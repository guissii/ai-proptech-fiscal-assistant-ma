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

        const firstNode = resolveDemoNode(conversation.city, conversation.currentNodeId, conversation.answers);
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

        const node = resolveDemoNode(conversation.city, conversation.currentNodeId, conversation.answers);
        if (!node) {
          throw new Error("Node introuvable");
        }

        const applyTransition = async (nextNodeId: string, userDisplay: string, storedValue: string | number) => {
          const updated = await demoUpdateConversation(input.conversationId, c => {
            const edit = c.editContext ?? null;
            let next = c;
            next = demoAddMessage(next, "user", userDisplay);

            let nextEdit = edit;
            let effectiveNextNodeId = nextNodeId;

            if (c.currentNodeId === "q.editWhich") {
              nextEdit = {
                returnToNodeId: "q.review",
                targetNodeId: nextNodeId,
                stopNodeId: nextNodeId,
              };
            } else if (nextEdit) {
              if (c.currentNodeId === nextEdit.targetNodeId) {
                const stop = computeEditStopNodeId({ targetNodeId: nextEdit.targetNodeId, value: storedValue });
                if (stop) {
                  nextEdit = { ...nextEdit, stopNodeId: stop };
                }
              }

              if (c.currentNodeId === nextEdit.stopNodeId) {
                effectiveNextNodeId = nextEdit.returnToNodeId;
                nextEdit = null;
              }
            }

            next = {
              ...next,
              answers: {
                ...next.answers,
                [c.currentNodeId]: storedValue,
              },
              currentNodeId: effectiveNextNodeId,
              editContext: nextEdit,
              updatedAt: Date.now(),
            };

            const nextNode = resolveDemoNode(c.city, next.currentNodeId, next.answers);
            if (!nextNode) {
              return next;
            }

            next = demoAddMessage(next, "assistant", nextNode.prompt);
            return next;
          });

          const currentNode = resolveDemoNode(conversation.city, updated?.currentNodeId ?? nextNodeId, updated?.answers ?? {});
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

function resolveDemoNode(
  city: "fes" | "rabat" | "casa",
  nodeId: string,
  answers: Record<string, string | number> = {}
): DemoNode | undefined {
  const base = getDemoNode(nodeId);
  if (!base) return undefined;
  if (base.type !== "choice") return base;
  if (base.id === "q.review") {
    return {
      ...base,
      prompt: buildReviewPrompt(city, answers),
    };
  }
  if (base.id !== "q.quartier") return base;

  const options = getQuartiersByCity(city).map(q => ({
    label: q.name,
    value: q.id,
    next: "q.financing",
  }));

  return {
    ...base,
    options,
  };
}

function computeEditStopNodeId(args: { targetNodeId: string; value: string | number }): string | null {
  const v = typeof args.value === "string" ? args.value : String(args.value);
  if (args.targetNodeId === "q.salarie") {
    return v === "yes" ? "q.salaryMonthly" : "q.salarie";
  }
  if (args.targetNodeId === "q.financing") {
    return v === "credit" ? "q.interestRate" : "q.financing";
  }
  if (args.targetNodeId === "q.wantAirbnb") {
    return v === "yes" ? "q.airbnbExpensesAnnual" : "q.wantAirbnb";
  }
  if (args.targetNodeId === "q.sell") {
    return v === "yes" ? "q.isPrimaryResidence" : "q.sell";
  }
  if (args.targetNodeId === "q.propertyType") {
    return "q.quartier";
  }
  return null;
}

function buildReviewPrompt(city: "fes" | "rabat" | "casa", answers: Record<string, string | number>): string {
  const get = (id: string) => answers[id];
  const asStr = (x: unknown) => (typeof x === "string" ? x : typeof x === "number" ? String(x) : "");
  const asNum = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
  const formatDh = (x: unknown) => {
    const n = asNum(x);
    if (typeof n !== "number") return "—";
    return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n);
  };
  const formatPct = (x: unknown) => {
    const n = asNum(x);
    if (typeof n !== "number") return "—";
    return `${n.toFixed(n % 1 === 0 ? 0 : 1)}%`;
  };

  const quartierId = asStr(get("q.quartier"));
  const quartier =
    quartierId ? getQuartiersByCity(city).find(q => q.id === quartierId)?.name ?? quartierId : "";

  const salaried = asStr(get("q.salarie"));
  const financing = asStr(get("q.financing"));
  const wantAirbnb = asStr(get("q.wantAirbnb"));
  const sell = asStr(get("q.sell"));

  const lines: string[] = [];
  lines.push("Récapitulatif des informations saisies :");
  lines.push("");
  lines.push("**Profil investisseur**");
  lines.push(`- Année fiscale : ${asStr(get("q.taxYear")) || "—"}`);
  lines.push(`- Salarié : ${salaried === "yes" ? "Oui" : salaried === "no" ? "Non" : "—"}`);
  if (salaried === "yes") {
    lines.push(`- Salaire net mensuel : ${formatDh(get("q.salaryMonthly"))}/mois`);
  }
  const investorType = asStr(get("q.investorType"));
  lines.push(`- Investisseur : ${investorType === "company" ? "Société / agence" : "Personne physique"}`);
  lines.push("");

  lines.push("**Bien immobilier**");
  lines.push(`- Prix : ${formatDh(get("q.price"))}`);
  lines.push(`- Surface : ${asNum(get("q.surface")) ?? "—"} m²`);
  const propertyType = asStr(get("q.propertyType"));
  lines.push(`- Type : ${propertyType === "neuf" ? "Neuf" : propertyType === "terrain" ? "Terrain" : "Ancien"}`);
  lines.push(`- Quartier : ${quartier || "—"}`);
  lines.push("");

  lines.push("**Financement**");
  lines.push(`- Mode : ${financing === "credit" ? "Crédit immobilier" : financing === "cash" ? "Cash" : "—"}`);
  if (financing === "credit") {
    lines.push(`- Apport : ${formatDh(get("q.downPayment"))}`);
    lines.push(`- Durée crédit : ${asNum(get("q.loanYears")) ?? "—"} ans`);
    lines.push(`- Taux d’intérêt : ${formatPct(get("q.interestRate"))}`);
  }
  lines.push("");

  lines.push("**Location longue durée**");
  lines.push(`- Loyer mensuel : ${formatDh(get("q.rent"))}/mois`);
  lines.push(`- Vacance : ${formatPct(get("q.vacancyRate"))} (valeur suggérée : 8%)`);
  lines.push(`- Gestion/agence : ${formatPct(get("q.managementFeePct"))} (valeur suggérée : 0%)`);
  lines.push(`- Charges annuelles : ${formatDh(get("q.operatingExpensesAnnual"))}/an`);
  lines.push(`- Assurance : ${formatDh(get("q.insuranceAnnual"))}/an`);
  lines.push("- Taxes locales : estimées automatiquement (non demandées)");
  lines.push("");

  lines.push("**Airbnb (optionnel)**");
  lines.push(`- Activé : ${wantAirbnb === "yes" ? "Oui" : wantAirbnb === "no" ? "Non" : "—"}`);
  if (wantAirbnb === "yes") {
    lines.push(`- Tarif/nuit : ${formatDh(get("q.airbnbNightly"))}`);
    lines.push(`- Occupation : ${formatPct(get("q.airbnbOccupancy"))}`);
    lines.push(`- Commission : ${formatPct(get("q.airbnbCommissionPct"))} (valeur suggérée : 15%)`);
    lines.push(`- Taxe de séjour : ${formatPct(get("q.airbnbTouristTaxPct"))}`);
    lines.push(`- Dépenses annuelles : ${formatDh(get("q.airbnbExpensesAnnual"))}/an`);
  }
  lines.push("");

  lines.push("**Revente / TPI (optionnel)**");
  lines.push(`- Activé : ${sell === "yes" ? "Oui" : sell === "no" ? "Non" : "—"}`);
  if (sell === "yes") {
    lines.push(`- Durée de détention : ${asNum(get("q.yearsHeld")) ?? "—"} ans`);
    lines.push(`- Prix de vente : ${formatDh(get("q.salePrice"))}`);
    lines.push(`- Travaux justifiables : ${formatDh(get("q.works"))}`);
    const isPrimary = asStr(get("q.isPrimaryResidence"));
    lines.push(`- Résidence principale : ${isPrimary === "yes" ? "Oui" : isPrimary === "no" ? "Non" : "—"}`);
  }

  lines.push("");
  lines.push("Confirmez-vous ces informations ?");

  return lines.join("\n");
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
