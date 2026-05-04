import React, { useState } from 'react';
import { formatCurrency, formatPercent } from '@/lib/fiscalEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TpiCardProps {
  data?: Record<string, unknown>;
}

export default function TpiCard({ data = {} }: TpiCardProps) {
  const [selectedScenario, setSelectedScenario] = useState(0);

  const asNumber = (v: unknown, fallback = 0) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;

  const scenariosRaw = (data as any).scenarios;
  const scenarios = Array.isArray(scenariosRaw) ? scenariosRaw : [];
  if (scenarios.length === 0) {
    return <p className="text-sm text-muted-foreground">Non renseigné.</p>;
  }

  const comparisonData = scenarios.map((s, idx) => ({
    name: `Scén. ${String.fromCharCode(65 + idx)}`,
    netVendeur: s.netVendeur,
  }));

  const safeIndex = Math.max(0, Math.min(selectedScenario, scenarios.length - 1));
  const selectedData = scenarios[safeIndex];
  const economieMax = asNumber((data as any).economieMax, 0);
  const input = ((data as any).input ?? {}) as Record<string, unknown>;
  const prixVente = asNumber(input.salePrice);
  const prixAcquisition = asNumber(input.purchasePrice);
  const dureeDetention = asNumber(input.yearsHeld);
  const plusValue = Math.max(0, prixVente - prixAcquisition);

  return (
    <div className="space-y-6">
      {/* Sélecteur de scénarios */}
      <div className="grid grid-cols-3 gap-2">
        {scenarios.map((scenario: any, index: number) => (
          <motion.button
            key={scenario.name}
            onClick={() => setSelectedScenario(index)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              safeIndex === index
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {scenario.name}
          </motion.button>
        ))}
      </div>

      {/* Détails du scénario sélectionné */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedScenario}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Scénario</p>
              <p className="text-sm font-semibold text-foreground">{selectedData.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Taux TPI</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatPercent(selectedData.tauxTpi, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Montant TPI</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(selectedData.montantTpi)}
                </p>
              </div>
            </div>

            {selectedData.montantDeductible > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Montant déductible</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(selectedData.montantDeductible)}
                </p>
              </div>
            )}

            {selectedData.cotisationMinimale > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800"
              >
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                  Cotisation minimale 3% : {formatCurrency(selectedData.cotisationMinimale)}
                </p>
              </motion.div>
            )}

            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Net vendeur</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(selectedData.netVendeur)}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Graphique comparatif */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Comparaison des nets vendeurs
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="netVendeur" fill="#1B4F8A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Détails calcul */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <h4 className="text-xs font-semibold text-foreground">Détails du calcul</h4>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>• Prix de vente : {formatCurrency(prixVente)}</p>
          <p>• Prix d'acquisition : {formatCurrency(prixAcquisition)}</p>
          <p>• Plus-value brute : {formatCurrency(plusValue)}</p>
          <p>• Durée détention : {dureeDetention || 0} ans</p>
          <p className="pt-2 border-t border-border">
            • Taux TPI applicable : {formatPercent(selectedData.tauxTpi, 0)}
          </p>
          <p>• Montant TPI : {formatCurrency(selectedData.montantTpi)}</p>
          {selectedData.montantDeductible > 0 && (
            <p>• Déduction travaux : {formatCurrency(selectedData.montantDeductible)}</p>
          )}
          <p className="pt-2 border-t border-border font-semibold text-foreground">
            Net vendeur : {formatCurrency(selectedData.netVendeur)}
          </p>
        </div>
      </div>

      {/* Économie maximale */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
      >
        <p className="text-xs font-medium text-green-700 dark:text-green-300">
          Économie max (TPI) : {formatCurrency(economieMax)}
        </p>
        <p className="text-xs text-green-700/80 dark:text-green-300/80 mt-1">
          Différence entre le scénario “Standard” et le scénario le plus avantageux.
        </p>
      </motion.div>
    </div>
  );
}
