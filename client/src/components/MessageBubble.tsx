import React from 'react';
import { motion } from 'framer-motion';
import { Streamdown } from 'streamdown';

interface MessageBubbleProps {
  message: string;
  role: 'user' | 'assistant';
  timestamp: string;
  cityColor?: string;
  isRTL?: boolean;
}

export default function MessageBubble({
  message,
  role,
  timestamp,
  cityColor = '#1B4F8A',
  isRTL = false,
}: MessageBubbleProps) {
  // Déterminer si le texte est en arabe
  const isArabic = /[\u0600-\u06FF]/.test(message);
  const shouldBeRTL = isRTL || isArabic;

  if (role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
        dir={shouldBeRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-end gap-2 max-w-xs">
          <div className="flex flex-col items-end gap-1">
            <div
              className="px-4 py-2 rounded-2xl rounded-tr-none text-white"
              style={{
                backgroundColor: cityColor,
                boxShadow: `0 2px 8px ${cityColor}30`,
              }}
            >
              <p className="text-sm leading-relaxed break-words">{message}</p>
            </div>
            <span className="text-xs text-muted-foreground px-2">{timestamp}</span>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: cityColor }}
          >
            U
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
      dir={shouldBeRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-end gap-2 max-w-2xl">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          A
        </div>
        <div className="flex flex-col items-start gap-1">
          <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-muted">
            <div className="text-sm leading-relaxed break-words prose prose-sm dark:prose-invert max-w-none">
              <Streamdown>{message}</Streamdown>
            </div>
          </div>
          <span className="text-xs text-muted-foreground px-2">{timestamp}</span>
        </div>
      </div>
    </motion.div>
  );
}
