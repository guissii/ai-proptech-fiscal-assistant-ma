import React from 'react';
import jsPDF from 'jspdf';
import { formatCurrency } from '@/lib/fiscalEngine';
import { QUARTIERS } from '@/data/quartiers';
import type { QuartierData } from '@/data/quartiers';
import type { City } from '@shared/demoFlow';
import {
  CITY_PALETTES,
  CITY_LABELS,
  M,
  PW,
  PH,
  CW,
  drawRoundedRect,
  pageFooter,
  sectionHeader,
  subSection,
  kvRow,
  infoBox,
  warningBox,
  drawTable,
  drawBarChart,
  drawKpiCard,
  drawFlowStep,
  drawFlowArrow,
  drawBullet,
  TableRow,
  TableCol
} from './pdfHelpers';

export interface PdfExportProps {
  flowType: string;
  city: string;
  quartier?: string;
  data: Record<string, unknown>;
  userEmail?: string;
}

export function generatePdf(props: PdfExportProps) {
  const { flowType, city, quartier, data, userEmail } = props;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const palette = CITY_PALETTES[city] || CITY_PALETTES.casa;
  const cityName = CITY_LABELS[city] || 'Casablanca';
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const input = ((data as any)?.input ?? {}) as Record<string, unknown>;
  const achat = (data as any)?.achat as Record<string, unknown> | null | undefined;
  const location = (data as any)?.location as Record<string, unknown> | null | undefined;
  const airbnb = (data as any)?.airbnb as Record<string, unknown> | null | undefined;
  const tpi = (data as any)?.tpi as Record<string, unknown> | null | undefined;

  let pageNum = 1;
  const totalPages = 7; // Fixed structure for professional layout

  let y = M;
  const newPage = () => {
    pageFooter(doc, pageNum, totalPages, dateStr);
    doc.addPage();
    pageNum++;
    y = M;
  };
  const ensureSpace = (h: number) => {
    if (y + h > PH - 25) newPage();
  };

  // ── PAGE 1: Couverture ──
  doc.setFillColor(palette.secondary[0], palette.secondary[1], palette.secondary[2]);
  doc.rect(0, 0, PW, PH, 'F');
  
  // Background gradient effect (simplified for jsPDF)
  doc.setFillColor(palette.primary[0], palette.primary[1], palette.primary[2]);
  doc.triangle(0, 0, PW, 0, PW, PH * 0.4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(40);
  doc.setFont('helvetica', 'bold');
  doc.text('Aqar.ma', PW / 2, PH * 0.35, { align: 'center' });

  doc.setFontSize(24);
  doc.setFont('helvetica', 'normal');
  doc.text('Rapport de Simulation', PW / 2, PH * 0.45, { align: 'center' });

  doc.setFontSize(16);
  doc.text(cityName.toUpperCase() + (quartier ? ` • ${quartier.toUpperCase()}` : ''), PW / 2, PH * 0.52, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(200, 220, 255);
  doc.text(`Généré le ${dateStr}`, PW / 2, PH * 0.75, { align: 'center' });
  if (userEmail) {
    doc.text(`Pour : ${userEmail}`, PW / 2, PH * 0.78, { align: 'center' });
  }

  // Warning badge
  doc.setFillColor(255, 255, 255, 0.1);
  drawRoundedRect(doc, 30, PH * 0.85, PW - 60, 25, 4, 'F');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  const coverWarning = doc.splitTextToSize('Ce document est une estimation pédagogique. Les chiffres peuvent varier selon le dossier, les preuves et la réglementation. Consultez un expert avant toute décision.', PW - 80);
  doc.text(coverWarning, PW / 2, PH * 0.85 + 8, { align: 'center' });

  // ── PAGE 2: Profil & Paramètres ──
  newPage();
  y = sectionHeader(doc, '1. Paramètres de la simulation', y, palette.secondary);

  const price = typeof input.price === 'number' ? input.price : 0;
  const surface = typeof input.surface === 'number' ? input.surface : 0;
  const monthlyRent = typeof input.monthlyRent === 'number' ? input.monthlyRent : 0;
  const vacancyRate = typeof input.vacancyRate === 'number' ? input.vacancyRate : 0;
  const managementFeePct = typeof input.managementFeePct === 'number' ? input.managementFeePct : 0;
  const financing = typeof input.financing === 'string' ? input.financing : undefined;
  const salaried = typeof input.salaried === 'string' ? input.salaried : undefined;
  const salaryMonthly = typeof input.salaryMonthly === 'number' ? input.salaryMonthly : 0;

  // Cards grid for top parameters
  y = subSection(doc, 'Aperçu du bien', y, palette.secondary);
  const cw = (CW - 10) / 2;
  drawKpiCard(doc, 'PRIX DU BIEN', price > 0 ? formatCurrency(price) : '—', M, y, cw, palette.primary);
  drawKpiCard(doc, 'SURFACE', surface > 0 ? `${surface} m²` : '—', M + cw + 10, y, cw, palette.primary);
  y += 22;
  drawKpiCard(doc, 'QUARTIER', quartier ?? '—', M, y, cw, palette.primary);
  drawKpiCard(doc, 'FINANCEMENT', financing === 'credit' ? 'Crédit bancaire' : financing === 'cash' ? 'Cash / Fonds propres' : '—', M + cw + 10, y, cw, palette.primary);
  y += 26;

  y = subSection(doc, 'Détails saisis', y, palette.secondary);
  y = kvRow(doc, 'Loyer visé', monthlyRent > 0 ? `${formatCurrency(monthlyRent)} / mois` : '—', y);
  y = kvRow(doc, 'Vacance estimée', `${vacancyRate}% (mois inoccupés)`, y);
  y = kvRow(doc, 'Frais de gestion', `${managementFeePct}% du loyer encaissé`, y);
  y = kvRow(doc, 'Statut de l\'investisseur', input.investorType === 'company' ? 'Société' : 'Personne physique', y);
  const residentStatus = typeof input.residentStatus === 'string' ? input.residentStatus : 'resident';
  y = kvRow(doc, 'Résidence fiscale', residentStatus === 'mre_etranger' ? 'MRE / Non-résident' : 'Résident au Maroc', y);
  y = kvRow(doc, 'Salarié', salaried === 'yes' ? 'Oui' : salaried === 'no' ? 'Non' : '—', y);
  if (salaried === 'yes') {
    y = kvRow(doc, 'Salaire net', salaryMonthly > 0 ? `${formatCurrency(salaryMonthly)} / mois` : '—', y);
  }
  y += 6;

  y = infoBox(doc, "Pourquoi ces données ? Le statut salarié et vos revenus permettent d'estimer votre tranche marginale d'imposition (IR) et d'évaluer l'impact fiscal réel de ce nouvel investissement.", y);
  if (residentStatus === 'mre_etranger') {
    y = warningBox(doc, 'Note MRE / Non-résident', "En tant que MRE ou étranger, pensez impérativement à déclarer votre apport en devises à l'Office des Changes lors de l'achat. Cette formalité garantit votre droit de retransfert (rapatrier le produit de la revente vers l'étranger).", y);
  }

  // ── PAGE 3: Frais d'achat ──
  newPage();
  y = sectionHeader(doc, '2. Frais d\'acquisition', y, palette.secondary);

  if (achat) {
    const prixNet = typeof achat.prixNet === 'number' ? achat.prixNet : 0;
    const droits = typeof achat.droitsEnregistrement === 'number' ? achat.droitsEnregistrement : 0;
    const notaire = typeof achat.honorairesNotaire === 'number' ? achat.honorairesNotaire : 0;
    const tvaHon = typeof achat.tvaHonoraires === 'number' ? achat.tvaHonoraires : 0;
    const conserv = typeof achat.fraisConservation === 'number' ? achat.fraisConservation : 0;
    const divers = typeof achat.fraisDivers === 'number' ? achat.fraisDivers : 0;
    const fraisEntree = typeof achat.fraisEnregistrement === 'number' ? achat.fraisEnregistrement : 0;
    const coutTotal = typeof achat.coutTotal === 'number' ? achat.coutTotal : 0;

    y = infoBox(doc, "Lors de l'achat d'un bien immobilier au Maroc, des frais s'ajoutent au prix de vente. Ces frais couvrent les droits d'enregistrement (4-5%), la conservation foncière (1.5%), les honoraires du notaire (1% + TVA 10%), et les frais de dossier.", y);
    y += 4;

    const cols: TableCol[] = [
      { label: 'Poste de dépense', width: 90 },
      { label: 'Montant', width: 40, align: 'right' },
      { label: '% du prix', width: 40, align: 'right' },
    ];
    const pct = (v: number) => prixNet > 0 ? `${((v/prixNet)*100).toFixed(2)}%` : '—';
    const rows: TableRow[] = [
      { cells: ['Prix du bien (net vendeur)', formatCurrency(prixNet), '100%'] },
      { cells: ['Droits d\'enregistrement (D.E.)', formatCurrency(droits), pct(droits)] },
      { cells: ['Conservation foncière (C.F.) — 1.5% + fixe', formatCurrency(conserv), pct(conserv)] },
      { cells: ['Honoraires du notaire (1%, min 2 500 DH)', formatCurrency(notaire), pct(notaire)] },
      { cells: ['TVA sur honoraires notaire (10%)', formatCurrency(tvaHon), pct(tvaHon)] },
      { cells: ['Frais divers (timbres, expéditions)', formatCurrency(divers), pct(divers)] },
      { cells: ['TOTAL FRAIS D\'ENTRÉE', formatCurrency(fraisEntree), pct(fraisEntree)], bold: true, highlight: true },
      { cells: ['COÛT TOTAL D\'ACQUISITION', formatCurrency(coutTotal), pct(coutTotal)], bold: true },
    ];
    y = drawTable(doc, cols, rows, y, palette.secondary);

    y += 10;
    y = subSection(doc, 'Répartition visuelle des frais', y, palette.secondary);
    y = drawBarChart(doc, [
      { label: 'Droits d\'enregistrement', value: droits },
      { label: 'Conservation foncière', value: conserv },
      { label: 'Honoraires notaire', value: notaire },
      { label: 'TVA sur honoraires', value: tvaHon },
      { label: 'Frais divers', value: divers }
    ], y, palette.accent, 'MAD');
    
  } else {
    y = kvRow(doc, 'Info', 'Données d\'achat insuffisantes.', y);
  }

  // ── PAGE 4: Revenus locatifs ──
  newPage();
  y = sectionHeader(doc, '3. Revenus Locatifs (Longue durée)', y, palette.secondary);

  if (location) {
    const brut = typeof (location as any).revenuBrut === 'number' ? (location as any).revenuBrut : 0;
    const brutEff = typeof (location as any).revenuBrutEffectif === 'number' ? (location as any).revenuBrutEffectif : 0;
    const charges = typeof (location as any).chargesNonFiscales === 'number' ? (location as any).chargesNonFiscales : 0;
    const base = typeof (location as any).baseImposable === 'number' ? (location as any).baseImposable : 0;
    const ir = typeof (location as any).irAnnuel === 'number' ? (location as any).irAnnuel : 0;
    const net = typeof (location as any).revenuNet === 'number' ? (location as any).revenuNet : 0;
    const yieldNet = typeof (location as any).rendementNet === 'number' ? (location as any).rendementNet : 0;
    const cashflow = typeof (location as any).cashflowNetMensuel === 'number' ? (location as any).cashflowNetMensuel : 0;
    
    y = subSection(doc, 'Le chemin de l\'argent (Annuel)', y, palette.secondary);
    
    // Flow chart
    const fw = (CW - 32) / 3;
    const fxh1 = M;
    const fxh2 = M + fw + 16;
    const fxh3 = M + 2 * fw + 32;
    
    let fy = y;
    drawFlowStep(doc, 'Brut effectif', formatCurrency(brutEff), `Loyer cible après ${vacancyRate}% de vacance`, fxh1, fy, fw, palette.primary);
    drawFlowArrow(doc, fxh1 + fw + 4, fy);
    drawFlowStep(doc, 'Base Imposable', formatCurrency(base), 'Après abattement légal de 40%', fxh2, fy, fw, palette.primary);
    drawFlowArrow(doc, fxh2 + fw + 4, fy);
    drawFlowStep(doc, 'Impôt / IR', formatCurrency(ir), 'Impôt dû à l\'Etat', fxh3, fy, fw, [231, 76, 60], [231, 76, 60]);
    
    fy += 32;
    drawFlowStep(doc, 'Revenu Net', formatCurrency(net), 'Ce qu\'il vous reste en fin d\'année', fxh1, fy, fw, [46, 204, 113], [46, 204, 113]);
    drawFlowArrow(doc, fxh1 + fw + 4, fy);
    drawFlowStep(doc, 'Cashflow Mensuel', formatCurrency(cashflow), 'Net mensuel après impôts (et crédit si applicable)', fxh2, fy, fw, [46, 204, 113], [46, 204, 113]);
    drawFlowArrow(doc, fxh2 + fw + 4, fy);
    drawFlowStep(doc, 'Rendement Net', `${yieldNet.toFixed(2)}%`, 'Rentabilité nette sur le prix d\'achat', fxh3, fy, fw, [46, 204, 113], [46, 204, 113]);
    
    y = fy + 32;

    y = subSection(doc, 'Détail des calculs', y, palette.secondary);
    const cols: TableCol[] = [
      { label: 'Indicateur', width: 90 },
      { label: 'Montant', width: 80, align: 'right' },
    ];
    const rows: TableRow[] = [
      { cells: ['Loyer Brut Annuel (100% plein)', formatCurrency(brut)] },
      { cells: [`Perte pour vacance (${vacancyRate}%)`, `-${formatCurrency(brut - brutEff)}`] },
      { cells: ['Loyer Brut Effectif', formatCurrency(brutEff)], bold: true },
      { cells: ['Charges annuelles non fiscales', `-${formatCurrency(charges)}`] },
      { cells: ['Impôt estimé', `-${formatCurrency(ir)}`] },
      { cells: ['REVENU NET ANNUEL', formatCurrency(net)], bold: true, highlight: true },
    ];
    y = drawTable(doc, cols, rows, y, palette.secondary);

  } else {
    y = kvRow(doc, 'Info', 'Données de location insuffisantes.', y);
  }

  // ── PAGE 5: Fiscalité détaillée ──
  newPage();
  y = sectionHeader(doc, '4. Fiscalité & Explications', y, palette.secondary);

  y = infoBox(doc, "L'imposition des revenus locatifs bénéficie généralement d'un abattement de 40% (pour les immeubles). Si vous êtes une personne physique, le revenu net imposable s'ajoute à vos autres revenus (salaires) et est soumis au barème progressif de l'IR.", y);
  y += 6;

  y = subSection(doc, 'Barème IR Progressif (2026+)', y, palette.secondary);
  const irCols: TableCol[] = [
    { label: 'Tranche de revenu (MAD)', width: 80 },
    { label: 'Taux', width: 40, align: 'center' },
    { label: 'Somme à déduire', width: 50, align: 'right' }
  ];
  const irRows: TableRow[] = [
    { cells: ['0 à 30 000', '0%', '0'] },
    { cells: ['30 001 à 50 000', '10%', '3 000'] },
    { cells: ['50 001 à 60 000', '20%', '8 000'] },
    { cells: ['60 001 à 80 000', '30%', '14 000'] },
    { cells: ['80 001 à 180 000', '34%', '17 200'] },
    { cells: ['Plus de 180 000', '38%', '24 400'] }
  ];
  y = drawTable(doc, irCols, irRows, y, palette.primary);

  y += 10;
  if (location && salaried === 'yes') {
    const irIncremental = typeof (location as any).irIncremental === 'number' ? (location as any).irIncremental : 0;
    y = warningBox(doc, 'Impact Fiscal Réel (Effet de seuil)', `Puisque vous êtes salarié avec un revenu de ${formatCurrency(salaryMonthly)}/mois, l'ajout de ces loyers augmente votre revenu global. L'impôt supplémentaire spécifiquement dû à ce bien est estimé à ${formatCurrency(irIncremental)} par an.`, y);
  }

  // ── PAGE 6: Comparaisons ──
  newPage();
  y = sectionHeader(doc, '5. Analyses & Comparaisons', y, palette.secondary);

  if (airbnb && location) {
    y = subSection(doc, 'Location Longue Durée vs Airbnb', y, palette.secondary);
    const locNet = typeof (location as any).revenuNet === 'number' ? (location as any).revenuNet : 0;
    const airNet = typeof (airbnb as any).revenuNetAnnuel === 'number' ? (airbnb as any).revenuNetAnnuel : 0;
    const locYield = typeof (location as any).rendementNet === 'number' ? (location as any).rendementNet : 0;
    const airYield = typeof (airbnb as any).rendementAnnuel === 'number' ? (airbnb as any).rendementAnnuel : 0;

    const compCols: TableCol[] = [
      { label: 'Indicateur', width: 70 },
      { label: 'Longue Durée', width: 50, align: 'right' },
      { label: 'Airbnb (Courte durée)', width: 50, align: 'right' },
    ];
    const compRows: TableRow[] = [
      { cells: ['Revenu Net Annuel', formatCurrency(locNet), formatCurrency(airNet)] },
      { cells: ['Rendement Net', `${locYield.toFixed(2)}%`, `${airYield.toFixed(2)}%`] },
      { cells: ['Impôt estimé', formatCurrency((location as any).irAnnuel || 0), formatCurrency((airbnb as any).chargesFiscales || 0)] },
    ];
    y = drawTable(doc, compCols, compRows, y, palette.secondary);
    y += 8;

    y = infoBox(doc, airNet > locNet ? 'La stratégie Airbnb semble plus rentable financièrement, mais nécessite une gestion active et est soumise à la réglementation touristique.' : 'La location longue durée est plus rentable ou équivalente, tout en offrant plus de stabilité et moins d\'efforts de gestion.', y);
    y += 10;
  }

  y = subSection(doc, 'Analyse comparative par quartier (Top 6)', y, palette.secondary);
  const cityKey: City = city === 'fes' || city === 'rabat' || city === 'casa' ? (city as City) : 'casa';
  const quarters: QuartierData[] = ((QUARTIERS as unknown) as Record<string, QuartierData[]>)[cityKey] ?? [];
  
  if (quarters.length > 0 && price > 0) {
    const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x));
    const top = quarters
      .map((q: QuartierData) => {
        const avgPrice = (q.pricePerM2Min + q.pricePerM2Max) / 2;
        const surfaceEst = avgPrice > 0 ? price / avgPrice : 0;
        const scale = clamp(surfaceEst / 100, 0.5, 2);
        const loyerEst = q.medianRent * scale;
        const brutEff = loyerEst * 12 * (1 - q.vacancyRate / 100);
        const base = brutEff * 0.6;
        // Utiliser le vrai barème progressif 2026
        let ir = 0;
        if (base <= 30000) ir = 0;
        else if (base <= 50000) ir = base * 0.1 - 3000;
        else if (base <= 60000) ir = base * 0.2 - 8000;
        else if (base <= 80000) ir = base * 0.3 - 14000;
        else if (base <= 180000) ir = base * 0.34 - 17200;
        else ir = base * 0.38 - 24400;
        ir = Math.max(0, ir);
        const net = brutEff - ir;
        const yieldNet = price > 0 ? (net / price) * 100 : 0;
        return { label: q.name, value: yieldNet };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
      
    y = drawBarChart(doc, top, y, palette.accent, '%');
    y += 4;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Estimations basées sur les loyers médians et hypothèses simplifiées.', M, y);
  }

  // ── PAGE 7: Résumé & Avertissements ──
  newPage();
  y = sectionHeader(doc, '6. Synthèse et Conclusion', y, palette.secondary);

  y = subSection(doc, 'Les 5 points clés de votre projet', y, palette.secondary);
  
  if (achat) {
    y = drawBullet(doc, `Le coût d'acquisition total s'élève à ${formatCurrency((achat as any).coutTotal || 0)}`, 'Ce montant inclut les frais de notaire et droits d\'enregistrement.', y, palette.primary);
  }
  if (location) {
    y = drawBullet(doc, `Le revenu net annuel est estimé à ${formatCurrency((location as any).revenuNet || 0)}`, 'Après déduction de la vacance, des charges et de l\'impôt.', y, palette.primary);
    y = drawBullet(doc, `Le rendement net est de ${((location as any).rendementNet || 0).toFixed(2)}%`, 'C\'est l\'indicateur clé pour comparer cet investissement avec d\'autres placements.', y, palette.primary);
    y = drawBullet(doc, `Cashflow mensuel : ${formatCurrency((location as any).cashflowNetMensuel || 0)}`, 'C\'est ce qui rentre (ou sort) de votre poche chaque mois.', y, palette.primary);
  }
  y = drawBullet(doc, 'Pression fiscale personnalisée', 'Les impôts ont été calculés en tenant compte de votre statut et de l\'abattement foncier légal.', y, palette.primary);

  y += 10;
  y = warningBox(doc, 'Limites et Avertissements', 
    "1. Ce rapport a été généré par un outil de simulation informatique à but purement pédagogique.\n\n" +
    "2. Les calculs fiscaux (IR, TPI, Frais d'enregistrement) utilisent des forfaits simplifiés. Votre situation réelle (charges de famille, autres revenus, particularités du bien) modifiera le calcul final de l'administration fiscale.\n\n" +
    "3. Les données de marché (loyers, prix) sont des médianes indicatives. La valeur réelle d'un bien dépend de son état, son étage, son exposition, etc.\n\n" +
    "4. NE PRENEZ AUCUNE DÉCISION d'investissement sur la seule base de ce document. Il est impératif de consulter un professionnel (notaire, expert-comptable, conseiller financier) pour valider votre montage.",
  y);

  // Sign off
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Document généré par Aqar.ma - L\'assistant immobilier intelligent.', PW / 2, PH - 40, { align: 'center' });

  pageFooter(doc, pageNum, totalPages, dateStr);

  const safeCity = cityName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `Rapport_Simulation_${safeCity}_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

export interface PdfExportButtonProps {
  flowType: string;
  city: string;
  quartier?: string;
  data: Record<string, unknown>;
  userEmail?: string;
}

export default function PdfExportButton(props: PdfExportButtonProps) {
  const handleExport = () => {
    generatePdf(props);
  };

  return (
    <button
      onClick={handleExport}
      className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
    >
      Télécharger le rapport PDF détaillé
    </button>
  );
}
