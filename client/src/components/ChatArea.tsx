import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useCity } from '@/contexts/CityContext';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Send } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { motion, AnimatePresence } from 'framer-motion';
import type { DemoNode } from '@shared/demoFlow';
import { DEMO_NODE_ORDER } from '@shared/demoFlow';

interface ChatAreaProps {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
  }>;
  currentNode: DemoNode | null;
  isLoading: boolean;
  error?: string | null;
  onAnswer: (nodeId: string, value: string | number) => Promise<void>;
}

export default function ChatArea({ messages, currentNode, isLoading, error, onAnswer }: ChatAreaProps) {
  const { activeCity, language, getCityColor, getCityLabel } = useCity();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [numberInput, setNumberInput] = useState<string>('');

  // Auto-scroll vers le dernier message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getTimeString = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const canAnswer = Boolean(currentNode) && !isLoading;

  const stepInfo = useMemo(() => {
    if (!currentNode) return null;
    const idx = DEMO_NODE_ORDER.indexOf(currentNode.id);
    const step = idx >= 0 ? idx + 1 : undefined;
    const total = DEMO_NODE_ORDER.length;
    const progress = step ? Math.round((step / total) * 100) : 0;
    return { step, total, progress };
  }, [currentNode]);

  const actionArea = useMemo(() => {
    if (!currentNode) return null;
    if (currentNode.type === 'choice') {
      return (
        <div className="flex flex-wrap gap-2">
          {currentNode.options.map(opt => (
            <motion.button
              key={opt.value}
              onClick={() => onAnswer(currentNode.id, opt.value)}
              disabled={!canAnswer}
              className="px-3 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      );
    }

    if (currentNode.type === 'number') {
      const unit = currentNode.number.unit ? ` (${currentNode.number.unit})` : '';
      const min = typeof currentNode.number.min === 'number' ? currentNode.number.min : undefined;
      const max = typeof currentNode.number.max === 'number' ? currentNode.number.max : undefined;
      const isPercent = currentNode.number.unit === '%';
      return (
        <div className="flex flex-col gap-3">
          {isPercent && typeof min === 'number' && typeof max === 'number' && (
            <input
              type="range"
              min={min}
              max={max}
              step={currentNode.number.step ?? 1}
              value={numberInput.trim() === '' ? min : Number(numberInput)}
              onChange={(e) => setNumberInput(String(e.target.value))}
              disabled={!canAnswer}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          )}
          <div className="flex gap-3 items-center">
            <div className="flex-1">
            <Input
              value={numberInput}
              onChange={e => setNumberInput(e.target.value)}
              placeholder={`${currentNode.number.placeholder ?? 'Entrez une valeur'}${unit}`}
              disabled={!canAnswer}
              inputMode="numeric"
            />
          </div>
          <motion.button
            onClick={async () => {
              const value = numberInput.trim();
              if (!value) return;
              setNumberInput('');
              await onAnswer(currentNode.id, value);
            }}
            disabled={!canAnswer || numberInput.trim().length === 0}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity h-9"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
          </div>
        </div>
      );
    }

    return null;
  }, [canAnswer, currentNode, numberInput, onAnswer]);

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">Assistant</h2>
            {stepInfo?.step && (
              <p className="text-xs text-muted-foreground">
                Étape {stepInfo.step} / {stepInfo.total}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: getCityColor(activeCity) }}
            >
              {getCityLabel(activeCity)}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              {language.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="w-40">
          <Progress value={stepInfo?.progress ?? 0} />
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: getCityColor(activeCity) + '20' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold"
                  style={{ backgroundColor: getCityColor(activeCity) }}
                >
                  A
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Bienvenue sur Aqar.ma</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Sélectionnez la ville et la langue, puis répondez aux questions pour obtenir une estimation détaillée.
              </p>
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MessageBubble
                  message={message.content}
                  role={message.role}
                  timestamp={getTimeString(message.timestamp ?? new Date())}
                  cityColor={getCityColor(activeCity)}
                />
              </motion.div>
            ))
          )}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-semibold text-muted-foreground">AI</span>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-muted-foreground"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.4, delay: i * 0.2, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action area */}
      <div className="px-6 py-4 border-t border-border bg-background">
        <div className="space-y-2">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
          {actionArea}
        </div>
      </div>
    </div>
  );
}
