import React, { useMemo } from 'react';
import { formatCurrency, formatPercent } from '@/lib/fiscalEngine';
import { motion } from 'framer-motion';

interface AirbnbCardProps {
  data?: Record<string, unknown>;
}

export default function AirbnbCard({ data = {} }: AirbnbCardProps) {
  const asNumber = (v: unknown, fallback = 0) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  const input = ((data as any).input ?? {}) as Record<string, unknown>;
  const investorType = typeof input.investorType === 'string' ? input.investorType : 'individual';
  const salaried = typeof input.salaried === 'string' ? input.salaried : undefined;
  const portfolioExistingLoansMonthly =
    typeof input.portfolioExistingLoansMonthly === 'number' ? input.portfolioExistingLoansMonthly : 0;

  const revenuBrutAnnuel = asNumber((data as any).revenuBrutAnnuel);
  const revenuBrutEffectifAnnuel = asNumber((data as any).revenuBrutEffectifAnnuel, revenuBrutAnnuel);
  const commissionsAirbnb = asNumber((data as any).commissionsAirbnb);
  const taxesSejour = asNumber((data as any).taxesSejour);
  const fraisGestion = asNumber((data as any).fraisGestion);
  const chargesFiscales = asNumber((data as any).chargesFiscales);
  const irIncremental = asNumber((data as any).irIncremental);
  const revenuNetAnnuel = asNumber((data as any).revenuNetAnnuel);
  const revenuNetMensuel = asNumber((data as any).revenuNetMensuel);
  const rendementAnnuel = asNumber((data as any).rendementAnnuel);

  const metrics = useMemo(() => {
    const taxLabel = investorType === 'company' ? 'Impôt (IS estimé)' : 'Impôts (IR)';
    const extra =
      investorType !== 'company' && salaried === 'yes' && irIncremental > 0
        ? [{ label: 'Scénario salarié (IR progressif)', value: irIncremental, unit: 'DH' }]
        : [];
    const afterExistingLoans =
      portfolioExistingLoansMonthly > 0
        ? [{ label: 'Net mensuel (après crédits existants)', value: revenuNetMensuel - portfolioExistingLoansMonthly, unit: 'DH' }]
        : [];
    return [
      { label: 'Brut annuel (effectif)', value: revenuBrutEffectifAnnuel, unit: 'DH' },
      { label: 'Commission plateforme', value: commissionsAirbnb, unit: 'DH' },
      { label: 'Taxes/séjour', value: taxesSejour, unit: 'DH' },
      { label: 'Frais de gestion', value: fraisGestion, unit: 'DH' },
      { label: taxLabel, value: chargesFiscales, unit: 'DH' },
      { label: 'Net annuel', value: revenuNetAnnuel, unit: 'DH' },
      { label: 'Net mensuel', value: revenuNetMensuel, unit: 'DH' },
      ...afterExistingLoans,
      { label: 'Rendement annuel', value: rendementAnnuel, unit: '%' },
      ...extra,
    ];
  }, [chargesFiscales, commissionsAirbnb, fraisGestion, investorType, irIncremental, portfolioExistingLoansMonthly, rendementAnnuel, revenuBrutEffectifAnnuel, revenuNetAnnuel, revenuNetMensuel, salaried, taxesSejour]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="text-xs font-semibold text-foreground">Lecture rapide</div>
        <div className="text-xs text-muted-foreground mt-1">
          Brut effectif → commissions + taxes séjour + gestion + dépenses → impôt → net.
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
              {metric.unit === 'DH' ? formatCurrency(metric.value) : formatPercent(metric.value / 100, 1)}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <h4 className="text-xs font-semibold text-foreground">Détail (annuel)</h4>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>• Brut (théorique) : {formatCurrency(revenuBrutAnnuel)}</p>
          <p>• Brut (effectif) : {formatCurrency(revenuBrutEffectifAnnuel)}</p>
          <p>• Commission plateforme : {formatCurrency(commissionsAirbnb)}</p>
          <p>• Taxes/séjour : {formatCurrency(taxesSejour)}</p>
          <p>• Gestion : {formatCurrency(fraisGestion)}</p>
          <p>• {investorType === 'company' ? 'IS (estimé)' : 'IR'} : {formatCurrency(chargesFiscales)}</p>
          {investorType !== 'company' && salaried === 'yes' && irIncremental > 0 ? (
            <p>• Scénario salarié (IR progressif) : {formatCurrency(irIncremental)}</p>
          ) : null}
          <p className="pt-2 border-t border-border font-semibold text-foreground">
            Net annuel : {formatCurrency(revenuNetAnnuel)}
          </p>
        </div>
      </div>
    </div>
  );
}
