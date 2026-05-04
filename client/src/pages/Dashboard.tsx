import React, { useEffect, useRef } from 'react';
import { useCity } from '@/contexts/CityContext';
import { useChat } from '@/hooks/useChat';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import { useLocation } from 'wouter';

export default function Dashboard() {
  const { activeCity, language } = useCity();
  const { messages, isLoading, error, currentNode, start, answer } = useChat();
  const [, setLocation] = useLocation();

  const lastStartedRef = useRef<string>('');

  useEffect(() => {
    const key = `${activeCity}:${language}`;
    if (lastStartedRef.current === key) return;
    lastStartedRef.current = key;
    start(activeCity, language);
  }, [activeCity, language, start]);

  useEffect(() => {
    const handler = () => {
      start(activeCity, language);
    };
    window.addEventListener('newSimulation', handler as any);
    return () => window.removeEventListener('newSimulation', handler as any);
  }, [activeCity, language, start]);

  return (
    <div className="flex h-[100dvh] bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border bg-muted/30">
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-foreground mb-2">
            Bienvenue sur Aqar.ma
          </h1>
          <p className="text-muted-foreground">
            Votre assistant fiscal immobilier pour le Maroc
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden flex">
          <ChatArea
            messages={messages}
            currentNode={currentNode}
            isLoading={isLoading}
            error={error}
            onAnswer={async (nodeId, value) => {
              const res = await answer(nodeId, value);
              if (res.action?.type === 'go_results') {
                const payload = {
                  city: activeCity,
                  language,
                  ...res.action.inputData,
                };
                localStorage.setItem('aqar.simulation.resultsInput', JSON.stringify(payload));
                setLocation('/results');
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
