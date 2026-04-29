import React, { useState } from 'react';
import { useCity } from '@/contexts/CityContext';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AchatCard from './results/AchatCard';
import LocationCard from './results/LocationCard';
import AirbnbCard from './results/AirbnbCard';
import TpiCard from './results/TpiCard';
import DetentionCard from './results/DetentionCard';

export type FlowType = 'achat' | 'location' | 'airbnb' | 'tpi' | 'detention' | null;

interface ResultPanelProps {
  flowType: FlowType;
  data?: Record<string, unknown>;
  isLoading?: boolean;
  onClose?: () => void;
  onExportPDF?: () => void;
}

export default function ResultPanel({
  flowType,
  data = {},
  isLoading = false,
  onClose,
  onExportPDF,
}: ResultPanelProps) {
  const { activeCity, getCityColor } = useCity();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-muted border-t-primary animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Calcul en cours...</p>
          </div>
        </div>
      );
    }

    switch (flowType) {
      case 'achat':
        return <AchatCard data={data} />;
      case 'location':
        return <LocationCard data={data} />;
      case 'airbnb':
        return <AirbnbCard data={data} />;
      case 'tpi':
        return <TpiCard data={data} />;
      case 'detention':
        return <DetentionCard data={data} />;
      default:
        return null;
    }
  };

  const getFlowLabel = (flow: FlowType) => {
    const labels: Record<string, string> = {
      achat: 'Achat',
      location: 'Location',
      airbnb: 'Airbnb',
      tpi: 'TPI',
      detention: 'Détention',
    };
    return labels[flow || ''] || '';
  };

  if (!flowType) {
    return (
      <div className="w-[360px] bg-muted/30 border-l border-border hidden lg:flex flex-col items-center justify-center text-center p-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: getCityColor(activeCity) + '20' }}
        >
          <span className="text-3xl">📊</span>
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Aucune simulation</h3>
        <p className="text-xs text-muted-foreground">
          Les résultats de vos simulations apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-[360px] bg-background border-l border-border hidden lg:flex flex-col"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Résultats</h3>
          <span
            className="px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: getCityColor(activeCity) }}
          >
            {getFlowLabel(flowType)}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={flowType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <motion.button
          onClick={onExportPDF}
          className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download className="w-4 h-4" />
          Exporter PDF
        </motion.button>
      </div>
    </motion.div>
  );
}
