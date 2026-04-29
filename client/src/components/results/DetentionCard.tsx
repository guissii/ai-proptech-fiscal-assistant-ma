import React, { useState } from 'react';
import { formatCurrency, formatPercent } from '@/lib/fiscalEngine';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DetentionCardProps {
  data?: Record<string, unknown>;
}

export default function DetentionCard({ data = {} }: DetentionCardProps) {
  const [selectedDuration, setSelectedDuration] = useState(10);

  const durations = [5, 10, 15];

  const projectionData = Array.from({ length: 16 }, (_, i) => ({
    year: i,
    dgi: 1000000 * Math.pow(1.02, i),
    market: 1000000 * Math.pow(1.065, i),
  }));

  const metrics = [
    { label: 'Plus-value projetée', value: 790000, unit: 'DH' },
    { label: 'Charges fiscales cumulées', value: 125000, unit: 'DH' },
    { label: 'Gain net réel', value: 665000, unit: 'DH' },
    { label: 'Break-even vente', value: 3, unit: 'ans' },
  ];

  const detailsTable = [
    { year: 5, dgi: 1104081, market: 1368569, charges: 62500, netGain: 306069 },
    { year: 10, dgi: 1219391, market: 1870414, charges: 125000, netGain: 745414 },
    { year: 15, dgi: 1345868, market: 2571324, charges: 187500, netGain: 1383824 },
  ];

  return (
    <div className="space-y-6">
      {/* Sélecteur de durée */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Durée de détention
        </p>
        <div className="flex gap-2">
          {durations.map((duration) => (
            <motion.button
              key={duration}
              onClick={() => setSelectedDuration(duration)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedDuration === duration
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {duration} ans
            </motion.button>
          ))}
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-muted/50 rounded-lg p-3"
          >
            <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
            <p className="text-sm font-semibold text-foreground">
              {metric.unit === 'DH' ? formatCurrency(metric.value) : `${metric.value} ${metric.unit}`}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Graphique projection */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Projection revalorisation
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="year" label={{ value: 'Années', position: 'insideBottomRight', offset: -5 }} tick={{ fontSize: 12 }} />
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
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Line
              type="monotone"
              dataKey="dgi"
              stroke="#1B4F8A"
              dot={false}
              name="Revalorisation DGI (+2%/an)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="market"
              stroke="#C4532A"
              dot={false}
              name="Marché réel (+6.5%/an)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau récapitulatif */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Récapitulatif par durée
        </h4>
        <div className="bg-muted/30 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-2 text-left font-semibold">Durée</th>
                <th className="px-2 py-2 text-right font-semibold">Marché</th>
                <th className="px-2 py-2 text-right font-semibold">Charges</th>
                <th className="px-2 py-2 text-right font-semibold">Net</th>
              </tr>
            </thead>
            <tbody>
              {detailsTable.map((row) => (
                <tr key={row.year} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                  <td className="px-2 py-2 font-medium">{row.year} ans</td>
                  <td className="px-2 py-2 text-right">{formatCurrency(row.market)}</td>
                  <td className="px-2 py-2 text-right">{formatCurrency(row.charges)}</td>
                  <td className="px-2 py-2 text-right font-semibold">{formatCurrency(row.netGain)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Détails charges annuelles */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <h4 className="text-xs font-semibold text-foreground">Charges annuelles</h4>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>• Taxe d'habitation : 12 500 DH</p>
          <p>• Taxe services communaux : 2 500 DH</p>
          <p className="pt-2 border-t border-border font-semibold text-foreground">
            Total annuel : 15 000 DH
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            Cumulées sur {selectedDuration} ans : {formatCurrency(15000 * selectedDuration)}
          </p>
        </div>
      </div>

      {/* Recommandation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
      >
        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
          💡 Vente optimale dans 3 ans (break-even fiscal)
        </p>
      </motion.div>
    </div>
  );
}
