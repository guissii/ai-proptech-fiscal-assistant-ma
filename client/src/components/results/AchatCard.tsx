import React from 'react';
import { formatCurrency, formatPercent } from '@/lib/fiscalEngine';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AchatCardProps {
  data?: Record<string, unknown>;
}

export default function AchatCard({ data = {} }: AchatCardProps) {
  const asNumber = (v: unknown, fallback = 0) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;

  const prixNet = asNumber(data.prixNet);
  const fraisEntree = asNumber(data.fraisEnregistrement);
  const droitsEnregistrement = asNumber(data.droitsEnregistrement);
  const honorairesNotaire = asNumber(data.honorairesNotaire);
  const fraisConservation = asNumber(data.fraisConservation);
  const coutTotal = asNumber(data.coutTotal);
  const economieExoneration = asNumber(data.economieExoneration);
  const quitusFiscalObligatoire = Boolean(data.quitusFiscalObligatoire);
  const totalFrais = droitsEnregistrement + honorairesNotaire + fraisConservation;

  const metrics = [
    {
      label: 'Prix du bien',
      value: prixNet,
      unit: 'DH',
    },
    {
      label: "Frais d'entrée",
      value: fraisEntree,
      unit: 'DH',
    },
    {
      label: "Frais d'entrée (% du prix)",
      value: prixNet > 0 ? (fraisEntree / prixNet) * 100 : 0,
      unit: '%',
    },
    {
      label: 'Coût total acquisition',
      value: coutTotal,
      unit: 'DH',
    },
  ];

  const fraisData = [
    { name: 'Droits', value: droitsEnregistrement, color: '#C4532A' },
    { name: 'Honoraires', value: honorairesNotaire, color: '#6B3FA0' },
    { name: 'Conservation', value: fraisConservation, color: '#F59E0B' },
  ].filter(x => x.value > 0);

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-muted/50 rounded-lg p-3"
          >
            <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
            <p className="text-sm font-semibold text-foreground">
              {metric.unit === 'DH'
                ? formatCurrency(metric.value as number)
                : formatPercent((metric.value as number) / 100, 1)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Badge quitus fiscal */}
      {quitusFiscalObligatoire && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
        >
          <p className="text-xs font-medium text-red-700 dark:text-red-300">
            Quitus fiscal obligatoire
          </p>
        </motion.div>
      )}

      {/* Graphique répartition frais */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Répartition des frais
        </h4>
        <div className="text-xs text-muted-foreground">
          Frais d’entrée = droits d’enregistrement + honoraires notaire + conservation foncière.
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={fraisData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {fraisData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                const v = typeof value === 'number' ? value : 0;
                const pct = totalFrais > 0 ? v / totalFrais : 0;
                return [`${formatCurrency(v)} (${formatPercent(pct, 1)})`, String(name)];
              }}
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              formatter={(value, entry) => {
                const item = fraisData.find(d => d.name === value);
                if (!item) return value;
                const pct = totalFrais > 0 ? item.value / totalFrais : 0;
                return `${value}: ${formatCurrency(item.value)} (${formatPercent(pct, 1)})`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-xs font-semibold text-foreground mb-2">Détail des frais</div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {[
              { label: 'Droits d’enregistrement', value: droitsEnregistrement },
              { label: 'Honoraires notaire', value: honorairesNotaire },
              { label: 'Conservation foncière', value: fraisConservation },
            ]
              .filter(x => x.value > 0)
              .map((item) => {
                const pctFees = totalFrais > 0 ? item.value / totalFrais : 0;
                const pctPrice = prixNet > 0 ? item.value / prixNet : 0;
                return (
                  <div key={item.label} className="flex items-center justify-between gap-3">
                    <div className="min-w-0 truncate">{item.label}</div>
                    <div className="shrink-0 text-right text-foreground font-medium">
                      {formatCurrency(item.value)} · {formatPercent(pctFees, 1)} des frais · {formatPercent(pctPrice, 1)} du prix
                    </div>
                  </div>
                );
              })}
            <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
              <div className="text-foreground font-semibold">Total frais d’entrée</div>
              <div className="text-foreground font-semibold">
                {formatCurrency(totalFrais)} · {formatPercent(prixNet > 0 ? totalFrais / prixNet : 0, 1)} du prix
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Détails calcul */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <h4 className="text-xs font-semibold text-foreground">Détails du calcul</h4>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>• Prix du bien : {formatCurrency(prixNet)}</p>
          <p>• Droits d’enregistrement : {formatCurrency(droitsEnregistrement)}</p>
          <p>• Honoraires notaire : {formatCurrency(honorairesNotaire)}</p>
          <p>• Conservation foncière : {formatCurrency(fraisConservation)}</p>
          <p>• Total frais d’entrée : {formatCurrency(totalFrais)}</p>
          {economieExoneration > 0 ? <p>• Économie exonération (droits 6%) : {formatCurrency(economieExoneration)}</p> : null}
          <p className="pt-2 border-t border-border font-semibold text-foreground">
            Coût total : {formatCurrency(coutTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}
