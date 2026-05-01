import React, { useMemo } from 'react';
import { useCity } from '@/contexts/CityContext';
import { QUARTIERS } from '@/data/quartiers';
import { calculateIRRevenusFonciers, formatCurrency, formatPercent } from '@/lib/fiscalEngine';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LocationCardProps {
  data?: Record<string, unknown>;
}

export default function LocationCard({ data = {} }: LocationCardProps) {
  const { activeCity } = useCity();

  const input = (data?.input ?? {}) as Record<string, unknown>;
  const budget = typeof input.price === 'number' ? input.price : 0;
  const monthlyRent = typeof input.monthlyRent === 'number' ? input.monthlyRent : 0;
  const vacancyRate = typeof input.vacancyRate === 'number' ? input.vacancyRate : 0;
  const managementFeePct = typeof input.managementFeePct === 'number' ? input.managementFeePct : 0;
  const investorType = typeof input.investorType === 'string' ? input.investorType : 'individual';
  const salaried = typeof input.salaried === 'string' ? input.salaried : undefined;

  const results = data as any;

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
    const taxLabel =
      investorType === 'company' ? 'Impôt (IS estimé)' : 'Impôt (IR revenus locatifs)';
    const extra =
      investorType !== 'company' && salaried === 'yes' && typeof results.irIncremental === 'number' && results.irIncremental > 0
        ? [{ label: 'Scénario salarié (IR progressif)', value: results.irIncremental, unit: 'DH' }]
        : [];
    return [
      { label: 'Revenu brut annuel (effectif)', value: results.revenuBrutEffectif ?? results.revenuBrut, unit: 'DH' },
      { label: 'Charges non fiscales', value: results.chargesNonFiscales ?? 0, unit: 'DH' },
      { label: 'Base imposable', value: results.baseImposable ?? 0, unit: 'DH' },
      { label: taxLabel, value: results.irAnnuel ?? 0, unit: 'DH' },
      { label: 'Revenu net annuel', value: results.revenuNet ?? 0, unit: 'DH' },
      { label: 'Rendement net', value: results.rendementNet ?? 0, unit: '%' },
      ...extra,
      ...(results.mensualiteCredit
        ? [
            { label: 'Mensualité crédit', value: results.mensualiteCredit, unit: 'DH' },
            { label: 'Cashflow net/mois', value: results.cashflowNetMensuel ?? 0, unit: 'DH' },
          ]
        : []),
    ];
  }, [investorType, results, salaried]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="text-xs font-semibold text-foreground">Lecture rapide</div>
        <div className="text-xs text-muted-foreground mt-1">
          Brut effectif (loyer − vacance) → charges (copro/entretien/assurance/taxes/gestion) → base imposable → impôt → net.
        </div>
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Loyer (mensuel)</div>
            <div className="text-sm font-semibold text-foreground">{formatCurrency(monthlyRent)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Vacance</div>
            <div className="text-sm font-semibold text-foreground">{formatPercent(vacancyRate / 100, 0)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Gestion</div>
            <div className="text-sm font-semibold text-foreground">{formatPercent(managementFeePct / 100, 1)}</div>
          </div>
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
              {metric.unit === 'DH'
                ? formatCurrency(metric.value)
                : formatPercent((metric.value as number) / 100, 1)}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <h4 className="text-xs font-semibold text-foreground">Détail (annuel)</h4>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>• Brut (théorique) : {formatCurrency(results.revenuBrut ?? 0)}</p>
          <p>• Brut (effectif) : {formatCurrency(results.revenuBrutEffectif ?? results.revenuBrut ?? 0)}</p>
          <p>• Frais de gestion : {formatCurrency(results.fraisGestion ?? 0)}</p>
          <p>• Charges non fiscales : {formatCurrency(results.chargesNonFiscales ?? 0)}</p>
          <p>• Base imposable : {formatCurrency(results.baseImposable ?? 0)}</p>
          <p>• {investorType === 'company' ? 'IS (estimé)' : 'IR (revenus locatifs)'} : {formatCurrency(results.irAnnuel ?? 0)}</p>
          {investorType !== 'company' && salaried === 'yes' && typeof results.irIncremental === 'number' && results.irIncremental > 0 ? (
            <p>• Scénario salarié (IR progressif) : {formatCurrency(results.irIncremental)}</p>
          ) : null}
          {results.mensualiteCredit ? <p>• Mensualité crédit : {formatCurrency(results.mensualiteCredit)}</p> : null}
        </div>
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
