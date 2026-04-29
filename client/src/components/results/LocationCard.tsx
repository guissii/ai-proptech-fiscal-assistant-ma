import React, { useMemo, useState } from 'react';
import { useCity } from '@/contexts/CityContext';
import { QUARTIERS } from '@/data/quartiers';
import { calculateIRRevenusFonciers, calculateLocationRevenue, formatCurrency, formatPercent } from '@/lib/fiscalEngine';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LocationCardProps {
  data?: Record<string, unknown>;
}

export default function LocationCard({ data = {} }: LocationCardProps) {
  const { activeCity } = useCity();

  const input = (data?.input ?? {}) as Record<string, unknown>;
  const initialBudget = typeof input.price === 'number' ? input.price : 1000000;
  const initialRent = typeof input.monthlyRent === 'number' ? input.monthlyRent : 5000;

  const [budget, setBudget] = useState(() => Math.max(100000, initialBudget));
  const [monthlyRent, setMonthlyRent] = useState(() => Math.max(0, initialRent));
  const [useCredit, setUseCredit] = useState(false);

  const results = useMemo(() => {
    return calculateLocationRevenue({
      prixAcquisition: budget,
      loyer: monthlyRent,
      dureeDetention: 10,
      typeImmobilier: 'non-meuble',
      depensesAnnuelles: 0,
    });
  }, [budget, monthlyRent]);

  const creditMonthlyPayment = useMemo(() => {
    if (!useCredit) return 0;
    const downPaymentRate = 0.2;
    const annualRate = 0.045;
    const years = 20;
    const principal = Math.max(0, budget * (1 - downPaymentRate));
    const r = annualRate / 12;
    const n = years * 12;
    if (principal <= 0) return 0;
    if (r <= 0) return principal / n;
    const factor = Math.pow(1 + r, n);
    return (principal * r * factor) / (factor - 1);
  }, [budget, useCredit]);

  const cashflowNetMonthly = useMemo(() => {
    const netMonthly = results.revenuNet / 12;
    return netMonthly - creditMonthlyPayment;
  }, [creditMonthlyPayment, results.revenuNet]);

  const quartierData = useMemo(() => {
    const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x));
    const quarters = QUARTIERS[activeCity] ?? [];
    const rows = quarters.map(q => {
      const avgPrice = (q.pricePerM2Min + q.pricePerM2Max) / 2;
      const surface = avgPrice > 0 ? budget / avgPrice : 0;
      const scale = clamp(surface / 100, 0.5, 2);
      const loyer = q.medianRent * scale;
      const revenuBrutAnnuel = loyer * 12 * (1 - q.vacancyRate / 100);
      const baseImposable = revenuBrutAnnuel * 0.6;
      const irAnnuel = calculateIRRevenusFonciers(baseImposable);
      const revenuNetAnnuel = revenuBrutAnnuel - irAnnuel;
      const rendementNet = budget > 0 ? (revenuNetAnnuel / budget) * 100 : 0;
      return {
        name: q.name,
        loyer: Math.round(loyer),
        rendementNet,
      };
    });
    return rows.sort((a, b) => b.rendementNet - a.rendementNet).slice(0, 6);
  }, [activeCity, budget]);

  const metrics = useMemo(() => {
    return [
      { label: 'Loyer mensuel', value: monthlyRent, unit: 'DH' },
      { label: 'Revenu brut annuel', value: results.revenuBrut, unit: 'DH' },
      { label: 'Base imposable', value: results.baseImposable, unit: 'DH' },
      { label: 'IR annuel', value: results.irAnnuel, unit: 'DH' },
      { label: 'Revenu net annuel', value: results.revenuNet, unit: 'DH' },
      { label: 'Rendement net', value: results.rendementNet, unit: '%' },
      ...(useCredit
        ? [
            { label: 'Mensualité crédit', value: creditMonthlyPayment, unit: 'DH' },
            { label: 'Cashflow net/mois', value: cashflowNetMonthly, unit: 'DH' },
          ]
        : []),
    ];
  }, [cashflowNetMonthly, creditMonthlyPayment, monthlyRent, results, useCredit]);

  return (
    <div className="space-y-6">
      {/* Sélecteur budget */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground">Budget d'investissement</label>
          <span className="text-sm font-semibold text-primary">{formatCurrency(budget)}</span>
        </div>
        <input
          type="range"
          min="100000"
          max="5000000"
          step="25000"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>100k DH</span>
          <span>5M DH</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground">Loyer mensuel</label>
          <span className="text-sm font-semibold text-primary">{formatCurrency(monthlyRent)}</span>
        </div>
        <input
          type="range"
          min="500"
          max="50000"
          step="100"
          value={monthlyRent}
          onChange={(e) => setMonthlyRent(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>500 DH</span>
          <span>50k DH</span>
        </div>
      </div>

      {/* Toggle Cash vs Crédit */}
      <div className="flex gap-2">
        <button
          onClick={() => setUseCredit(false)}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            !useCredit
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          💰 Cash
        </button>
        <button
          onClick={() => setUseCredit(true)}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            useCredit
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          🏦 Crédit (4.5%)
        </button>
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
              {metric.unit === 'DH'
                ? formatCurrency(metric.value)
                : formatPercent((metric.value as number) / 100, 1)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Classement quartiers */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Classement quartiers
        </h4>
        <div className="bg-muted/30 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-2 text-left font-semibold">Quartier</th>
                <th className="px-2 py-2 text-right font-semibold">Loyer</th>
                <th className="px-2 py-2 text-right font-semibold">Rend. net</th>
              </tr>
            </thead>
            <tbody>
              {quartierData.map((row) => (
                <tr key={row.name} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                  <td className="px-2 py-2 font-medium">{row.name}</td>
                  <td className="px-2 py-2 text-right">{formatCurrency(row.loyer)}</td>
                  <td className="px-2 py-2 text-right font-semibold">{formatPercent(row.rendementNet / 100, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Graphique rendement */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Rendement net par quartier
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={quartierData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => formatPercent(value as number / 100, 1)}
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="rendementNet" fill="#1B4F8A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
