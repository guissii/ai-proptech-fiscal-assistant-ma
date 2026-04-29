import React, { useState } from 'react';
import { formatCurrency, formatPercent } from '@/lib/fiscalEngine';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Check, X } from 'lucide-react';

interface AirbnbCardProps {
  data?: Record<string, unknown>;
}

export default function AirbnbCard({ data = {} }: AirbnbCardProps) {
  const [checklist, setChecklist] = useState({
    registration: false,
    taxDeclaration: false,
    insuranceUpdate: false,
    contractReview: false,
    licenseObtention: false,
  });

  const asNumber = (v: unknown, fallback = 0) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;

  const revenuBrutAnnuel = asNumber((data as any).revenuBrutAnnuel);
  const commissionsAirbnb = asNumber((data as any).commissionsAirbnb);
  const taxesSejour = asNumber((data as any).taxesSejour);
  const revenuNetMensuel = asNumber((data as any).revenuNetMensuel);
  const rendementAnnuel = asNumber((data as any).rendementAnnuel);

  const metrics = [
    { label: 'Revenu brut annuel', value: revenuBrutAnnuel, unit: 'DH' },
    { label: 'Commissions Airbnb', value: commissionsAirbnb, unit: 'DH' },
    { label: 'Taxes séjour', value: taxesSejour, unit: 'DH' },
    { label: 'Revenu net mensuel', value: revenuNetMensuel, unit: 'DH' },
    { label: 'Rendement annuel', value: rendementAnnuel, unit: '%' },
  ];

  const monthlyComparison = [
    { month: 'Jan', airbnb: 15000, longterm: 10000 },
    { month: 'Fév', airbnb: 16000, longterm: 10000 },
    { month: 'Mar', airbnb: 18000, longterm: 10000 },
    { month: 'Avr', airbnb: 17000, longterm: 10000 },
    { month: 'Mai', airbnb: 19000, longterm: 10000 },
    { month: 'Jun', airbnb: 20000, longterm: 10000 },
    { month: 'Jul', airbnb: 22000, longterm: 10000 },
    { month: 'Aoû', airbnb: 21000, longterm: 10000 },
    { month: 'Sep', airbnb: 18000, longterm: 10000 },
    { month: 'Oct', airbnb: 16000, longterm: 10000 },
    { month: 'Nov', airbnb: 14000, longterm: 10000 },
    { month: 'Déc', airbnb: 17000, longterm: 10000 },
  ];

  const occupancyHeatmap = [
    { month: 'Jan', rate: 65 },
    { month: 'Fév', rate: 70 },
    { month: 'Mar', rate: 75 },
    { month: 'Avr', rate: 72 },
    { month: 'Mai', rate: 78 },
    { month: 'Jun', rate: 82 },
    { month: 'Jul', rate: 88 },
    { month: 'Aoû', rate: 85 },
    { month: 'Sep', rate: 75 },
    { month: 'Oct', rate: 68 },
    { month: 'Nov', rate: 62 },
    { month: 'Déc', rate: 70 },
  ];

  const checklistItems = [
    { key: 'registration', label: 'Enregistrement auprès de l\'ONDA' },
    { key: 'taxDeclaration', label: 'Déclaration fiscale Airbnb' },
    { key: 'insuranceUpdate', label: 'Mise à jour assurance multirisque' },
    { key: 'contractReview', label: 'Révision contrat syndic' },
    { key: 'licenseObtention', label: 'Obtention licence Loi 80-14' },
  ];

  const toggleChecklistItem = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
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
              {metric.unit === 'DH' ? formatCurrency(metric.value) : formatPercent(metric.value / 100, 1)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Heatmap taux d'occupation */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Taux d'occupation mensuel
        </h4>
        <div className="grid grid-cols-12 gap-1">
          {occupancyHeatmap.map((item) => {
            const intensity = item.rate / 100;
            const hue = Math.round(120 * intensity);
            return (
              <div
                key={item.month}
                className="aspect-square rounded flex items-center justify-center text-xs font-semibold text-white"
                style={{
                  backgroundColor: `hsl(${hue}, 70%, 50%)`,
                }}
                title={`${item.month}: ${item.rate}%`}
              >
                {item.rate}%
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparateur Airbnb vs Location longue durée */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Comparateur annuel
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
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
              dataKey="airbnb"
              stroke="#C4532A"
              dot={false}
              name="Airbnb"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="longterm"
              stroke="#1B4F8A"
              dot={false}
              name="Location longue durée"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Checklist Loi 80-14 */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Checklist Loi 80-14
        </h4>
        <div className="space-y-2">
          {checklistItems.map((item) => (
            <motion.button
              key={item.key}
              onClick={() => toggleChecklistItem(item.key as keyof typeof checklist)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
              whileHover={{ x: 4 }}
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  checklist[item.key as keyof typeof checklist]
                    ? 'bg-primary border-primary'
                    : 'border-border'
                }`}
              >
                {checklist[item.key as keyof typeof checklist] && (
                  <Check className="w-3 h-3 text-primary-foreground" />
                )}
              </div>
              <span className="text-xs font-medium text-foreground">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Simulateur */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <h4 className="text-xs font-semibold text-foreground">Simulateur mensuel</h4>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>• Loyer/nuit : 350 DH × 22 jours = 7 700 DH</p>
          <p>• Taux occupation : 70% = 5 390 DH</p>
          <p>• Commission Airbnb (3%) : -162 DH</p>
          <p>• Taxes séjour (2%) : -108 DH</p>
          <p>• Charges (électricité, eau, nettoyage) : -800 DH</p>
          <p className="pt-2 border-t border-border font-semibold text-foreground">
            Net mensuel : 3 320 DH
          </p>
        </div>
      </div>
    </div>
  );
}
