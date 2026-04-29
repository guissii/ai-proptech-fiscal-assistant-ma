import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  createConversation,
  getConversation,
  getUserConversations,
  updateConversation,
  createMessage,
  getConversationMessages,
  createSimulation,
  getUserSimulations,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { DEMO_START_NODE_ID, getDemoNode, type DemoNode } from "@shared/demoFlow";
import { getQuartiersByCity } from "@shared/quartiers";
import { demoAddMessage, demoCreateConversation, demoGetConversation, demoUpdateConversation } from "./_core/demoStore";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Chat et conversations
  chat: router({
    // Créer une nouvelle conversation
    createConversation: protectedProcedure
      .input(
        z.object({
          city: z.enum(["fes", "rabat", "casa"]),
          language: z.enum(["fr", "ar", "en"]),
          title: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const conversationId = nanoid();
        const conversation = await createConversation({
          id: conversationId,
          userId: ctx.user.id,
          city: input.city,
          language: input.language,
          title: input.title || `Conversation ${new Date().toLocaleDateString()}`,
        });
        return conversation;
      }),

    // Récupérer une conversation
    getConversation: protectedProcedure
      .input(z.object({ conversationId: z.string() }))
      .query(async ({ input }) => {
        return getConversation(input.conversationId);
      }),

    // Récupérer les conversations de l'utilisateur
    getUserConversations: protectedProcedure.query(async ({ ctx }) => {
      return getUserConversations(ctx.user.id);
    }),

    // Envoyer un message et obtenir une réponse
    sendMessage: protectedProcedure
      .input(
        z.object({
          conversationId: z.string(),
          content: z.string(),
          city: z.enum(["fes", "rabat", "casa"]),
          language: z.enum(["fr", "ar", "en"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Sauvegarder le message utilisateur
        const userMessageId = nanoid();
        await createMessage({
          id: userMessageId,
          conversationId: input.conversationId,
          role: "user",
          content: input.content,
        });

        // Appeler le LLM pour générer une réponse
        try {
          const systemPrompt = `Tu es Aqar.ma, un assistant fiscal immobilier expert au Maroc.
Tu aides les utilisateurs avec :
- Simulations d'achat immobilier (calcul des frais, TPI, droits d'enregistrement)
- Calculs de rendement locatif et IR
- Simulations Airbnb (revenus, taxes, rendement)
- Analyses de détention immobilière
- Informations sur les quartiers (Fès, Rabat, Casablanca)
- Conseils fiscaux et financiers

Ville active : ${input.city}
Langue : ${input.language}

Réponds toujours en ${input.language === "fr" ? "français" : input.language === "ar" ? "arabe" : "anglais"}.
Sois concis, professionnel et utile.`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: input.content },
            ],
          });

          const assistantContent =
            typeof response.choices[0]?.message?.content === 'string'
              ? response.choices[0].message.content
              : "Je n'ai pas pu générer une réponse.";

          // Sauvegarder la réponse
          const assistantMessageId = nanoid();
          await createMessage({
            id: assistantMessageId,
            conversationId: input.conversationId,
            role: "assistant",
            content: assistantContent,
            metadata: {
              flowType: detectFlowType(input.content),
              entities: extractEntities(input.content),
            },
          });

          // Mettre à jour le titre de la conversation si c'est le premier message
          const conversation = await getConversation(input.conversationId);
          if (conversation && conversation.title && !conversation.title.includes("Conversation")) {
            const flowType = detectFlowType(input.content);
            await updateConversation(input.conversationId, {
              title: input.content.substring(0, 50),
              flowType: flowType || undefined,
            });
          }

          return {
            userMessage: { id: userMessageId, content: input.content },
            assistantMessage: { id: assistantMessageId, content: assistantContent },
          };
        } catch (error) {
          console.error("[Chat] LLM error:", error);
          throw new Error("Erreur lors de la génération de la réponse");
        }
      }),

    // Récupérer les messages d'une conversation
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.string() }))
      .query(async ({ input }) => {
        return getConversationMessages(input.conversationId);
      }),
  }),

  demo: router({
    start: publicProcedure
      .input(
        z.object({
          sessionId: z.string().min(8),
          city: z.enum(["fes", "rabat", "casa"]),
          language: z.enum(["fr", "ar", "en"]),
        })
      )
      .mutation(async ({ input }) => {
        const conversation = await demoCreateConversation({
          sessionId: input.sessionId,
          city: input.city,
          language: input.language,
          startNodeId: DEMO_START_NODE_ID,
        });

        const firstNode = resolveDemoNode(conversation.city, conversation.currentNodeId);
        if (!firstNode) {
          throw new Error("Demo flow misconfigured: start node missing");
        }

        const withPrompt = await demoUpdateConversation(conversation.id, c =>
          demoAddMessage(c, "assistant", firstNode.prompt)
        );

        return {
          conversationId: conversation.id,
          messages: withPrompt?.messages ?? [],
          currentNode: firstNode,
        };
      }),

    answer: publicProcedure
      .input(
        z.object({
          sessionId: z.string().min(8),
          conversationId: z.string().min(1),
          nodeId: z.string().min(1),
          value: z.union([z.string(), z.number()]),
        })
      )
      .mutation(async ({ input }) => {
        const conversation = await demoGetConversation(input.conversationId);
        if (!conversation) {
          throw new Error("Conversation introuvable");
        }
        if (conversation.sessionId !== input.sessionId) {
          throw new Error("Session invalide");
        }
        if (conversation.currentNodeId !== input.nodeId) {
          throw new Error("Étape invalide (node mismatch)");
        }

        const node = resolveDemoNode(conversation.city, conversation.currentNodeId);
        if (!node) {
          throw new Error("Node introuvable");
        }

        const applyTransition = async (nextNodeId: string, userDisplay: string, storedValue: string | number) => {
          const updated = await demoUpdateConversation(input.conversationId, c => {
            let next = c;
            next = demoAddMessage(next, "user", userDisplay);
            next = {
              ...next,
              answers: {
                ...next.answers,
                [c.currentNodeId]: storedValue,
              },
              currentNodeId: nextNodeId,
              updatedAt: Date.now(),
            };

            const nextNode = resolveDemoNode(c.city, nextNodeId);
            if (!nextNode) {
              return next;
            }

            next = demoAddMessage(next, "assistant", nextNode.prompt);
            return next;
          });

          const currentNode = resolveDemoNode(conversation.city, nextNodeId);
          if (!currentNode) {
            throw new Error("Node suivant introuvable");
          }

          if (currentNode.type !== "done") {
            return {
              messages: updated?.messages ?? [],
              currentNode,
              action: null,
            };
          }

          const action = buildSimulationAction(currentNode, updated?.answers ?? {});
          return {
            messages: updated?.messages ?? [],
            currentNode,
            action,
          };
        };

        if (node.type === "choice") {
          const value = typeof input.value === "string" ? input.value : String(input.value);
          const opt = node.options.find(o => o.value === value);
          if (!opt) {
            throw new Error("Choix invalide");
          }
          return applyTransition(opt.next, opt.label, opt.value);
        }

        if (node.type === "number") {
          const parsed =
            typeof input.value === "number"
              ? input.value
              : Number(String(input.value).replace(",", ".").trim());
          if (!Number.isFinite(parsed)) {
            throw new Error("Nombre invalide");
          }
          const { min, max } = node.number;
          if (typeof min === "number" && parsed < min) {
            throw new Error(`Valeur minimale: ${min}`);
          }
          if (typeof max === "number" && parsed > max) {
            throw new Error(`Valeur maximale: ${max}`);
          }
          return applyTransition(node.number.next, String(parsed), parsed);
        }

        throw new Error("Ce node n'accepte pas de réponse");
      }),
  }),

  // Simulations
  simulations: router({
    // Créer une simulation
    createSimulation: publicProcedure
      .input(
        z.object({
          conversationId: z.string(),
          type: z.enum(["achat", "location", "airbnb", "detention", "tpi"]),
          city: z.enum(["fes", "rabat", "casa"]),
          quartier: z.string().optional(),
          inputData: z.record(z.string(), z.unknown()),
          results: z.record(z.string(), z.unknown()),
          sessionId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user) {
          const simulationId = nanoid();
          return createSimulation({
            id: simulationId,
            conversationId: input.conversationId,
            userId: ctx.user.id,
            type: input.type,
            city: input.city,
            quartier: input.quartier,
            inputData: input.inputData,
            results: input.results,
          });
        }

        const sessionId = input.sessionId;
        if (!sessionId) {
          return {
            id: nanoid(),
            conversationId: input.conversationId,
            userId: 0,
            type: input.type,
            city: input.city,
            quartier: input.quartier ?? null,
            inputData: input.inputData,
            results: input.results,
            createdAt: new Date(),
          } as any;
        }

        await demoUpdateConversation(input.conversationId, c => {
          if (c.sessionId !== sessionId) return c;
          const payload = JSON.stringify({
            type: input.type,
            city: input.city,
            quartier: input.quartier ?? null,
            inputData: input.inputData,
            results: input.results,
          });
          return demoAddMessage(c, "assistant", `Simulation sauvegardée (démo) : ${payload}`);
        });

        return {
          id: nanoid(),
          conversationId: input.conversationId,
          userId: 0,
          type: input.type,
          city: input.city,
          quartier: input.quartier ?? null,
          inputData: input.inputData,
          results: input.results,
          createdAt: new Date(),
        } as any;
      }),

    // Récupérer les simulations de l'utilisateur
    getUserSimulations: protectedProcedure.query(async ({ ctx }) => {
      return getUserSimulations(ctx.user.id);
    }),
  }),
});

function buildSimulationAction(node: DemoNode & { type: "done" }, answers: Record<string, string | number>) {
  const action = node.action;
  const inputData: Record<string, unknown> = {};

  for (const [key, sourceNodeId] of Object.entries(action.inputMap)) {
    const value = answers[sourceNodeId];
    inputData[key] = value;
  }

  return {
    type: action.type,
    inputData,
  } as const;
}

function resolveDemoNode(city: "fes" | "rabat" | "casa", nodeId: string): DemoNode | undefined {
  const base = getDemoNode(nodeId);
  if (!base) return undefined;
  if (base.type !== "choice") return base;
  if (base.id !== "q.quartier") return base;

  const options = getQuartiersByCity(city).map(q => ({
    label: q.name,
    value: q.id,
    next: "q.rent",
  }));

  return {
    ...base,
    options,
  };
}

// Utilitaires
function detectFlowType(
  content: string
): "achat" | "location" | "airbnb" | "detention" | "tpi" | null {
  const content_lower = content.toLowerCase();

  if (
    content_lower.includes("achat") ||
    content_lower.includes("acheter") ||
    content_lower.includes("acquisition")
  ) {
    return "achat";
  }
  if (
    content_lower.includes("location") ||
    content_lower.includes("louer") ||
    content_lower.includes("locatif")
  ) {
    return "location";
  }
  if (
    content_lower.includes("airbnb") ||
    content_lower.includes("courte durée") ||
    content_lower.includes("meublé")
  ) {
    return "airbnb";
  }
  if (
    content_lower.includes("détention") ||
    content_lower.includes("garder") ||
    content_lower.includes("conserver")
  ) {
    return "detention";
  }
  if (
    content_lower.includes("tpi") ||
    content_lower.includes("plus-value") ||
    content_lower.includes("vendre")
  ) {
    return "tpi";
  }

  return null;
}

function extractEntities(
  content: string
): Record<string, unknown> {
  const entities: Record<string, unknown> = {};

  // Extraire les montants
  const amountMatch = content.match(/(\d+\s*(?:k|m|dh|د\.م\.)?)/gi);
  if (amountMatch) {
    entities.amounts = amountMatch as string[];
  }

  // Extraire les villes
  const cities = ["fès", "rabat", "casablanca", "casa"];
  const foundCities = cities.filter(city => content.toLowerCase().includes(city));
  if (foundCities.length > 0) {
    entities.cities = foundCities as string[];
  }

  // Extraire les quartiers connus
  const quartiers = [
    "médina",
    "agdal",
    "hay riad",
    "souissi",
    "anfa",
    "maarif",
    "ain diab",
  ];
  const foundQuartiers = quartiers.filter(q => content.toLowerCase().includes(q));
  if (foundQuartiers.length > 0) {
    entities.quartiers = foundQuartiers as string[];
  }

  return entities;
}

export type AppRouter = typeof appRouter;
