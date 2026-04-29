import React from 'react';
import { QuartierData } from '@/data/quartiers';
import { formatCurrency, formatPercent, calculateInvestmentScore } from '@/lib/fiscalEngine';
import { motion } from 'framer-motion';
import { TrendingUp, Home, DollarSign, Zap } from 'lucide-react';

interface QuartierCardProps {
  quartier: QuartierData;
  onSimulate?: (quartier: QuartierData) => void;
}

export default function QuartierCard({ quartier, onSimulate }: QuartierCardProps) {
  const metrics = [
    {
      label: 'Prix/m²',
      value: `${formatCurrency((quartier.pricePerM2Min + quartier.pricePerM2Max) / 2)}`,
      icon: DollarSign,
    },
    {
      label: 'Loyer médian',
      value: formatCurrency(quartier.medianRent),
      icon: Home,
    },
    {
      label: 'Taux Airbnb',
      value: formatPercent(quartier.airbnbRate / 100, 0),
      icon: Zap,
    },
    {
      label: 'Rendement brut',
      value: formatPercent(quartier.grossYield / 100, 1),
      icon: TrendingUp,
    },
    {
      label: 'Plus-value/an',
      value: formatPercent(quartier.annualAppreciation / 100, 1),
      icon: TrendingUp,
    },
    {
      label: 'Vacance locative',
      value: formatPercent(quartier.vacancyRate / 100, 1),
      icon: Home,
    },
  ];

  const score = calculateInvestmentScore(
    (quartier.pricePerM2Min + quartier.pricePerM2Max) / 2,
    (quartier.pricePerM2Min + quartier.pricePerM2Max) / 2,
    quartier.grossYield,
    quartier.annualAppreciation,
    quartier.vacancyRate
  );

  const getScoreColor = (s: number) => {
    if (s >= 75) return '#10B981'; // green
    if (s >= 60) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      residential: '🏘️ Résidentiel',
      touristique: '🏨 Touristique',
      affaires: '💼 Affaires',
    };
    return labels[type] || type;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{quartier.name}</h3>
            <p className="text-xs text-muted-foreground">{getTypeLabel(quartier.type)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Score investissement</p>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: getScoreColor(score) }}>
                {score}
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{quartier.description}</p>
      </div>

      {/* Métriques */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="text-center"
              >
                <div className="flex justify-center mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                <p className="text-sm font-semibold text-foreground">{metric.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Gauge score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-foreground">Potentiel d'investissement</p>
            <p className="text-xs font-semibold" style={{ color: getScoreColor(score) }}>
              {score}/100
            </p>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: getScoreColor(score) }}
            />
          </div>
        </div>

        {/* Comparaison vs moyenne */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Prix vs moyenne</p>
            <p className="text-sm font-semibold text-foreground">
              {quartier.pricePerM2Min < 8500 ? '📉 -15%' : '📈 +12%'}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Rendement vs moyenne</p>
            <p className="text-sm font-semibold text-foreground">
              {quartier.grossYield > 5 ? '📈 +8%' : '📉 -5%'}
            </p>
          </div>
        </div>

        {/* Détails */}
        <div className="bg-muted/30 rounded-lg p-3 mb-6 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Prix/m² min-max</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(quartier.pricePerM2Min)} - {formatCurrency(quartier.pricePerM2Max)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Rendement net estimé</span>
            <span className="font-semibold text-foreground">
              {formatPercent((quartier.grossYield - 1.5) / 100, 1)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Taux de vacance</span>
            <span className="font-semibold text-foreground">
              {formatPercent(quartier.vacancyRate / 100, 1)}
            </span>
          </div>
        </div>

        {/* Bouton simulation */}
        <motion.button
          onClick={() => onSimulate?.(quartier)}
          className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Simuler un investissement ici →
        </motion.button>
      </div>
    </motion.div>
  );
}
