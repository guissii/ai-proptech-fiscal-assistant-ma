import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useCity } from '@/contexts/CityContext';
import type { DemoNode } from '@shared/demoFlow';
import { getDemoSessionId } from '@/lib/demoSession';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  currentNode: DemoNode | null;
  start: (city: string, language: string) => Promise<void>;
  answer: (
    nodeId: string,
    value: string | number
  ) => Promise<{ action: null | { type: 'go_results'; inputData: Record<string, unknown> } }>;
}

export function useChat(): UseChatReturn {
  const { activeCity, language } = useCity();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentNode, setCurrentNode] = useState<DemoNode | null>(null);

  const startMutation = trpc.demo.start.useMutation();
  const answerMutation = trpc.demo.answer.useMutation();

  const sessionId = useMemo(() => {
    return getDemoSessionId();
  }, []);

  const start = useCallback(
    async (city: string, language: string) => {
      try {
        setError(null);
        const res = await startMutation.mutateAsync({
          sessionId,
          city: city as 'fes' | 'rabat' | 'casa',
          language: language as 'fr' | 'ar' | 'en',
        });
        setConversationId(res.conversationId);
        setMessages(
          res.messages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.ts),
          }))
        );
        setCurrentNode(res.currentNode);
      } catch (err) {
        setError('Erreur lors du démarrage de la démo');
        console.error(err);
      }
    },
    [sessionId, startMutation]
  );

  const answer = useCallback(
    async (nodeId: string, value: string | number) => {
      if (!conversationId) {
        setError('Aucune conversation active');
        return { action: null };
      }
      try {
        setIsLoading(true);
        setError(null);
        const res = await answerMutation.mutateAsync({
          sessionId,
          conversationId,
          nodeId,
          value,
        });
        setMessages(
          res.messages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.ts),
          }))
        );
        setCurrentNode(res.currentNode);
        return { action: res.action };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur lors de l'envoi";
        setError(errorMessage);
        console.error(err);
        return { action: null };
      } finally {
        setIsLoading(false);
      }
    },
    [answerMutation, conversationId, sessionId]
  );

  return {
    messages,
    isLoading,
    error,
    conversationId,
    currentNode,
    start,
    answer,
  };
}
