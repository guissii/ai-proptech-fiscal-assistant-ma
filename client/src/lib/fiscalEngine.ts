/**
 * Moteur de calcul fiscal immobilier Maroc
 * Couvre : TPI, IR locatif, TH, TSC, frais d'enregistrement
 * Mise à jour : Loi Finances 2026
 */

export interface AchatSimulation {
  prix: number;
  surface: number;
  typeImmobilier: 'neuf' | 'ancien' | 'terrain';
  dateAcquisition: Date;
  estExonere: boolean;
  residentStatus?: 'resident' | 'mre_etranger';
}

export interface AchatResults {
  prixNet: number;
  fraisEnregistrement: number;
  droitsEnregistrement: number;
  honorairesNotaire: number;
  tvaHonoraires: number;
  fraisConservation: number;
  fraisDivers: number;
  coutTotal: number;
  economieExoneration: number;
  quitusFiscalObligatoire: boolean;
  detailsCalcul: string;
}

export interface LocationSimulation {
  prixAcquisition: number;
  loyer: number;
  dureeDetention: number;
  typeImmobilier: 'meuble' | 'non-meuble';
  depensesAnnuelles: number;
  investorType?: 'individual' | 'company';
  residentStatus?: 'resident' | 'mre_etranger';
  vacancyRatePct?: number;
  managementFeePct?: number;
  insuranceAnnual?: number;
  propertyTaxesAnnual?: number;
  salaryAnnual?: number;
  otherTaxableIncomeAnnual?: number;
  taxYear?: number;
  financing?: 'cash' | 'credit';
  downPayment?: number;
  loanYears?: number;
  interestRatePct?: number;
}

export interface LocationResults {
  revenuBrut: number;
  chargesFiscales: number;
  revenuNet: number;
  rendementBrut: number;
  rendementNet: number;
  irAnnuel: number;
  baseImposable: number;
  abattementFoncier: number;
  revenuBrutEffectif: number;
  fraisGestion: number;
  chargesNonFiscales: number;
  mensualiteCredit: number;
  cashflowNetMensuel: number;
  irIncremental: number;
}

export interface AirbnbSimulation {
  prixAcquisition: number;
  loyerNuit: number;
  tauxOccupation: number;
  tauxCommissionAirbnb: number;
  tauxTaxesSejour: number;
  depensesAnnuelles: number;
  investorType?: 'individual' | 'company';
  residentStatus?: 'resident' | 'mre_etranger';
  managementFeePct?: number;
  vacancyRatePct?: number;
  salaryAnnual?: number;
  otherTaxableIncomeAnnual?: number;
  taxYear?: number;
}

export interface AirbnbResults {
  revenuBrutAnnuel: number;
  commissionsAirbnb: number;
  taxesSejour: number;
  chargesFiscales: number;
  revenuNetMensuel: number;
  revenuNetAnnuel: number;
  rendementAnnuel: number;
  revenuBrutEffectifAnnuel: number;
  fraisGestion: number;
  chargesNonFiscales: number;
  irIncremental: number;
}

export interface DetentionSimulation {
  prixAcquisition: number;
  surface: number;
  valeurLocative: number;
  dureeAnnees: number;
  typeOccupation: 'propre' | 'loue';
}

export interface DetentionResults {
  taxeHabitationAnnuelle: number;
  taxeServicesCommAnnuelle: number;
  chargesAnnuelles: number;
  chargesCumulees: number;
  plusValueProjetee: number;
  gainNetReel: number;
  breakEvenVente: number;
}

export interface TpiSimulation {
  prixVente: number;
  prixAcquisition: number;
  dureeDetention: number;
  typeImmobilier: 'neuf' | 'ancien';
  travaux: number;
  isResidencePrincipale: boolean;
  residentStatus?: 'resident' | 'mre_etranger';
}

export interface TpiScenario {
  name: string;
  description: string;
  tauxTpi: number;
  montantTpi: number;
  montantDeductible: number;
  netVendeur: number;
  cotisationMinimale: number;
}

export interface TpiResults {
  scenarios: TpiScenario[];
  scenarioOptimal: TpiScenario;
  economieMax: number;
}

// ============ ACHAT ============

export function calculateAchatCosts(sim: AchatSimulation): AchatResults {
  const { prix, surface, typeImmobilier, dateAcquisition, estExonere, residentStatus } = sim;

  // Droits d'Enregistrement (D.E.)
  let tauxDroits = 0;
  if (typeImmobilier === 'neuf' || typeImmobilier === 'ancien') {
    tauxDroits = estExonere ? 0 : 0.04; // 4% pour le bâti
  } else {
    tauxDroits = 0.05; // 5% pour terrain
  }
  const droitsEnregistrement = prix * tauxDroits;

  // Conservation Foncière (C.F.)
  // 1.5% du prix déclaré + Droit fixe de 250 DH + certificat 100 DH. Min: 1000 DH
  const fraisConservationCalculated = (prix * 0.015) + 350;
  const fraisConservation = Math.max(1000, fraisConservationCalculated);

  // Honoraires Notaire (Barème de référence: ~1% avec min 2500 DH)
  const honorairesCalculated = prix * 0.01;
  const honorairesNotaire = Math.max(2500, honorairesCalculated);

  // TVA sur Honoraires Notaire (10%)
  const tvaHonoraires = honorairesNotaire * 0.10;

  // Frais divers (Timbres, minutes, expéditions) forfaitaires
  const fraisDivers = 2000;

  // Frais d'entrée totaux
  const fraisEntree = droitsEnregistrement + fraisConservation + honorairesNotaire + tvaHonoraires + fraisDivers;

  // Coût total d'acquisition
  const coutTotal = prix + fraisEntree;

  // Économie d'exonération si applicable
  const economieExoneration = estExonere ? prix * 0.04 : 0;

  // Quitus fiscal obligatoire si bien acquis après juillet 2024
  const quitusFiscalObligatoire = dateAcquisition > new Date('2024-07-01');

  // MRE note
  const mreNote = residentStatus === 'mre_etranger' ? " | Note MRE : Pensez à déclarer l'apport en devises à l'Office des Changes pour garantir la convertibilité à la revente." : "";

  return {
    prixNet: prix,
    fraisEnregistrement: fraisEntree,
    droitsEnregistrement,
    honorairesNotaire,
    tvaHonoraires,
    fraisConservation,
    fraisDivers,
    coutTotal,
    economieExoneration,
    quitusFiscalObligatoire,
    detailsCalcul: `Prix: ${prix} DH | Droits (4-5%): ${droitsEnregistrement.toFixed(0)} DH | CF (1.5%): ${fraisConservation.toFixed(0)} DH | Honoraires (1%): ${honorairesNotaire.toFixed(0)} DH | TVA (10%): ${tvaHonoraires.toFixed(0)} DH | Divers: ${fraisDivers} DH${mreNote}`,
  };
}

// ============ LOCATION ============

export function calculateLocationRevenue(sim: LocationSimulation): LocationResults {
  const {
    prixAcquisition,
    loyer,
    dureeDetention,
    typeImmobilier,
    depensesAnnuelles,
    investorType = 'individual',
    residentStatus = 'resident',
    vacancyRatePct = 0,
    managementFeePct = 0,
    insuranceAnnual = 0,
    propertyTaxesAnnual = 0,
    salaryAnnual = 0,
    otherTaxableIncomeAnnual = 0,
    taxYear = 2026,
    financing = 'cash',
    downPayment = 0,
    loanYears = 0,
    interestRatePct = 0,
  } = sim;

  // Revenu brut annuel
  const revenuBrut = loyer * 12;

  const vacPct = Math.min(50, Math.max(0, vacancyRatePct));
  const revenuBrutEffectif = revenuBrut * (1 - vacPct / 100);

  const mgmtPct = Math.min(30, Math.max(0, managementFeePct));
  const fraisGestion = revenuBrutEffectif * (mgmtPct / 100);

  // Abattement de 40% (Art 63 CGI)
  const abattementFoncier = 0.4;
  const baseImposable = Math.max(0, revenuBrutEffectif * (1 - abattementFoncier));
  const irAnnuel = calculateIRRevenusFonciers(baseImposable);
  const irIncremental =
    investorType === 'company'
      ? 0
      : calculateIRIncrementalFromAdditionalIncome({
          baseIncomeAnnual: salaryAnnual + otherTaxableIncomeAnnual,
          additionalIncomeAnnual: baseImposable,
          taxYear,
        });

  // Taxe des Services Communaux (TSC) estimée à 10.5% de la valeur locative (loyer brut)
  // Souvent à la charge du proprio s'il ne la refacture pas.
  const tscCalculee = revenuBrut * 0.105;
  const tscAppliquee = propertyTaxesAnnual > 0 ? propertyTaxesAnnual : tscCalculee;

  const chargesNonFiscales = depensesAnnuelles + fraisGestion + insuranceAnnual + tscAppliquee;
  const revenuNetAvantImpots = revenuBrutEffectif - chargesNonFiscales;

  const taxes =
    investorType === 'company'
      ? Math.max(0, revenuNetAvantImpots) * 0.2 // IS simplifié
      : irAnnuel;
  const revenuNet = revenuNetAvantImpots - taxes;

  const principal = Math.max(0, prixAcquisition - Math.max(0, downPayment));
  const mensualiteCredit =
    financing === 'credit' && loanYears > 0 && interestRatePct > 0
      ? calculateMonthlyLoanPayment(principal, interestRatePct, loanYears)
      : 0;

  const cashflowNetMensuel = (revenuNet - mensualiteCredit * 12) / 12;

  // Rendements
  const rendementBrut = (revenuBrutEffectif / prixAcquisition) * 100;
  const rendementNet = (revenuNet / prixAcquisition) * 100;

  return {
    revenuBrut,
    chargesFiscales: taxes,
    revenuNet,
    rendementBrut,
    rendementNet,
    irAnnuel: taxes,
    baseImposable,
    abattementFoncier,
    revenuBrutEffectif,
    fraisGestion,
    chargesNonFiscales,
    mensualiteCredit,
    cashflowNetMensuel,
    irIncremental,
  };
}

export function calculateIRRevenusFonciers(revenuFoncierNetImposableAnnuel: number): number {
  return calculateIRProgressiveAnnual(revenuFoncierNetImposableAnnuel, 2026);
}

// ============ AIRBNB ============

export function calculateAirbnbRevenue(sim: AirbnbSimulation): AirbnbResults {
  const {
    prixAcquisition,
    loyerNuit,
    tauxOccupation,
    tauxCommissionAirbnb,
    tauxTaxesSejour,
    depensesAnnuelles,
    investorType = 'individual',
    managementFeePct = 0,
    vacancyRatePct = 0,
    salaryAnnual = 0,
    otherTaxableIncomeAnnual = 0,
    taxYear = 2026,
  } = sim;

  const occupationPct = tauxOccupation <= 1 ? tauxOccupation * 100 : tauxOccupation;
  const joursOccupation = 365 * (occupationPct / 100);

  // Revenu brut annuel
  const revenuBrutAnnuel = loyerNuit * joursOccupation;

  const vacPct = Math.min(50, Math.max(0, vacancyRatePct));
  const revenuBrutEffectifAnnuel = revenuBrutAnnuel * (1 - vacPct / 100);

  // Commissions Airbnb (3% standard)
  const commissionsAirbnb = revenuBrutEffectifAnnuel * tauxCommissionAirbnb;

  // Taxes de séjour (environ 1-2% du revenu)
  const taxesSejour = revenuBrutEffectifAnnuel * tauxTaxesSejour;

  const mgmtPct = Math.min(30, Math.max(0, managementFeePct));
  const fraisGestion = revenuBrutEffectifAnnuel * (mgmtPct / 100);

  // Revenu net avant charges
  const revenuNetAvantCharges = revenuBrutEffectifAnnuel - commissionsAirbnb - taxesSejour - fraisGestion;
  const profitAvantImpots = Math.max(0, revenuNetAvantCharges - depensesAnnuelles);

  // IR sur revenus Airbnb (taux plus élevé, activité commerciale)
  const irAirbnb = calculateIRAirbnb(profitAvantImpots);
  const irIncremental = calculateIRIncrementalFromAdditionalIncome({
    baseIncomeAnnual: salaryAnnual + otherTaxableIncomeAnnual,
    additionalIncomeAnnual: profitAvantImpots,
    taxYear,
  });
  const irIncrementalSafe = investorType === 'company' ? 0 : irIncremental;
  const chargesFiscales =
    investorType === 'company'
      ? profitAvantImpots * 0.2
      : salaryAnnual > 0
        ? irIncrementalSafe
        : irAirbnb;

  // Revenu net final
  const chargesNonFiscales = depensesAnnuelles + commissionsAirbnb + taxesSejour + fraisGestion;
  const revenuNetAnnuel = (revenuNetAvantCharges - depensesAnnuelles) - chargesFiscales;
  const revenuNetMensuel = revenuNetAnnuel / 12;

  // Rendement annuel
  const rendementAnnuel = (revenuNetAnnuel / prixAcquisition) * 100;

  return {
    revenuBrutAnnuel,
    commissionsAirbnb,
    taxesSejour,
    chargesFiscales,
    revenuNetMensuel,
    revenuNetAnnuel,
    rendementAnnuel,
    revenuBrutEffectifAnnuel,
    fraisGestion,
    chargesNonFiscales,
    irIncremental: irIncrementalSafe,
  };
}

function calculateIRAirbnb(revenuNet: number): number {
  // Taux d'IR plus élevé pour activité commerciale
  if (revenuNet <= 30000) return revenuNet * 0.05;
  if (revenuNet <= 50000) return 1500 + (revenuNet - 30000) * 0.15;
  if (revenuNet <= 100000) return 4500 + (revenuNet - 50000) * 0.25;
  return 16000 + (revenuNet - 100000) * 0.35;
}

function calculateMonthlyLoanPayment(principal: number, annualRatePct: number, years: number): number {
  const p = Math.max(0, principal);
  const y = Math.max(0, years);
  const r = Math.max(0, annualRatePct) / 100 / 12;
  const n = Math.round(y * 12);
  if (!p || !n) return 0;
  if (!r) return p / n;
  const factor = Math.pow(1 + r, n);
  return (p * r * factor) / (factor - 1);
}

function calculateIRProgressiveAnnual(incomeAnnual: number, taxYear: number): number {
  const x = Math.max(0, incomeAnnual);
  const year = Number.isFinite(taxYear) ? Math.trunc(taxYear) : 2026;

  // Barème officiel Loi de Finances 2026
  const table =
    year >= 2026
      ? [
          { max: 30000, rate: 0, deduction: 0 },
          { max: 50000, rate: 0.1, deduction: 3000 },
          { max: 60000, rate: 0.2, deduction: 8000 },
          { max: 80000, rate: 0.3, deduction: 14000 },
          { max: 180000, rate: 0.34, deduction: 17200 },
          { max: Infinity, rate: 0.38, deduction: 24400 },
        ]
      : [
          { max: 30000, rate: 0, deduction: 0 },
          { max: 50000, rate: 0.1, deduction: 3000 },
          { max: 60000, rate: 0.2, deduction: 8000 },
          { max: 80000, rate: 0.3, deduction: 14000 },
          { max: 180000, rate: 0.34, deduction: 17200 },
          { max: Infinity, rate: 0.38, deduction: 24400 },
        ];

  const row = table.find(t => x <= t.max) ?? table[table.length - 1];
  return Math.max(0, x * row.rate - row.deduction);
}

function calculateIRIncrementalFromAdditionalIncome(args: {
  baseIncomeAnnual: number;
  additionalIncomeAnnual: number;
  taxYear: number;
}): number {
  const base = Math.max(0, args.baseIncomeAnnual);
  const add = Math.max(0, args.additionalIncomeAnnual);
  const total = base + add;
  return calculateIRProgressiveAnnual(total, args.taxYear) - calculateIRProgressiveAnnual(base, args.taxYear);
}

// ============ DÉTENTION ============

export function calculateDetentionCosts(sim: DetentionSimulation): DetentionResults {
  const { prixAcquisition, surface, valeurLocative, dureeAnnees, typeOccupation } = sim;

  // Taxe d'habitation annuelle (si propriété louée)
  let taxeHabitationAnnuelle = 0;
  if (typeOccupation === 'loue') {
    taxeHabitationAnnuelle = valeurLocative * 0.10; // 10% de la valeur locative
  }

  // Taxe de services communaux (environ 0.5% de la valeur locative)
  const taxeServicesCommAnnuelle = valeurLocative * 0.005;

  // Charges annuelles totales
  const chargesAnnuelles = taxeHabitationAnnuelle + taxeServicesCommAnnuelle;

  // Charges cumulées sur la durée
  const chargesCumulees = chargesAnnuelles * dureeAnnees;

  // Plus-value projetée (2% par an DGI, 5-8% marché réel)
  const plusValueDGI = prixAcquisition * Math.pow(1.02, dureeAnnees) - prixAcquisition;
  const plusValueMarche = prixAcquisition * Math.pow(1.065, dureeAnnees) - prixAcquisition;

  // Gain net réel (marché moins charges)
  const gainNetReel = plusValueMarche - chargesCumulees;

  // Break-even vente (quand plus-value > charges)
  let breakEvenVente = 0;
  for (let year = 1; year <= 30; year++) {
    const pv = prixAcquisition * Math.pow(1.065, year) - prixAcquisition;
    const charges = chargesAnnuelles * year;
    if (pv > charges) {
      breakEvenVente = year;
      break;
    }
  }

  return {
    taxeHabitationAnnuelle,
    taxeServicesCommAnnuelle,
    chargesAnnuelles,
    chargesCumulees,
    plusValueProjetee: plusValueMarche,
    gainNetReel,
    breakEvenVente,
  };
}

// ============ TPI (TAXE PLUS-VALUE) ============

export function calculateTpi(sim: TpiSimulation): TpiResults {
  const { prixVente, prixAcquisition, dureeDetention, typeImmobilier, travaux, isResidencePrincipale, residentStatus } = sim;

  const held = Math.max(1, Math.min(40, Math.trunc(dureeDetention)));
  const fraisAcquisitionForfait = prixAcquisition * 0.15;
  // Coefficient d'actualisation (exemple simplifié 3% par an, en réalité publié chaque année par le ministère)
  const coefficientRevalorisation = 1 + 0.03 * held;

  const coutRevientBase = (prixAcquisition * coefficientRevalorisation) + fraisAcquisitionForfait;
  const coutRevientAvecTravaux = coutRevientBase + Math.max(0, travaux);

  const profitBase = Math.max(0, prixVente - coutRevientBase);
  const profitAvecTravaux = Math.max(0, prixVente - coutRevientAvecTravaux);

  const tauxTpi = 0.2;
  const cotisationMinimale = prixVente * 0.03; // Minimum de perception légal

  const tpiStandard = profitBase * tauxTpi;
  const tpiTravaux = profitAvecTravaux * tauxTpi;

  const mreNote = residentStatus === 'mre_etranger' ? " (MRE: Garantie de retransfert assurée si achat déclaré)" : "";

  const scenarioA: TpiScenario = {
    name: 'Standard' + mreNote,
    description: 'TPI sur profit net réévalué (20%) + minimum 3% du prix de cession',
    tauxTpi,
    montantTpi: Math.max(tpiStandard, cotisationMinimale),
    montantDeductible: fraisAcquisitionForfait,
    netVendeur: prixVente - Math.max(tpiStandard, cotisationMinimale),
    cotisationMinimale,
  };

  const eligibleResidence = Boolean(isResidencePrincipale) && held >= 6;
  const scenarioB: TpiScenario = {
    name: 'Résidence principale',
    description: eligibleResidence ? 'Exonération totale (occupation >= 6 ans)' : 'Non applicable (occupation < 6 ans)',
    tauxTpi: eligibleResidence ? 0 : tauxTpi,
    montantTpi: eligibleResidence ? 0 : Math.max(tpiStandard, cotisationMinimale),
    montantDeductible: fraisAcquisitionForfait,
    netVendeur: prixVente - (eligibleResidence ? 0 : Math.max(tpiStandard, cotisationMinimale)),
    cotisationMinimale,
  };

  const scenarioC: TpiScenario = {
    name: 'Avec travaux justifiés',
    description: 'TPI avec ajout des travaux facturés au coût de revient + minimum 3%',
    tauxTpi,
    montantTpi: Math.max(tpiTravaux, cotisationMinimale),
    montantDeductible: fraisAcquisitionForfait + Math.max(0, travaux),
    netVendeur: prixVente - Math.max(tpiTravaux, cotisationMinimale),
    cotisationMinimale,
  };

  const scenarios = [scenarioA, scenarioB, scenarioC];
  const scenarioOptimal = scenarios.reduce((best, current) => (current.netVendeur > best.netVendeur ? current : best));

  const economieMax = scenarioA.montantTpi - scenarioOptimal.montantTpi;

  return {
    scenarios,
    scenarioOptimal,
    economieMax,
  };
}

// ============ UTILITAIRES ============

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function estimateLocalTaxesAnnual(args: { price: number; city?: string }): number {
  const price = Math.max(0, args.price);
  const cityCoef = args.city === "casa" ? 1.15 : args.city === "rabat" ? 1.1 : 1;
  const basePct = 0.003;
  const min = 1200;
  const max = 30000;
  const raw = price * basePct * cityCoef;
  return Math.round(Math.max(min, Math.min(max, raw)));
}

export function calculateInvestmentScore(
  pricePerM2: number,
  medianPrice: number,
  yield_: number,
  appreciation: number,
  vacancyRate: number
): number {
  let score = 50; // Base de 50

  // Facteur prix (-10 à +10)
  const priceRatio = pricePerM2 / medianPrice;
  if (priceRatio < 0.8) score += 10;
  else if (priceRatio < 0.95) score += 5;
  else if (priceRatio > 1.2) score -= 10;
  else if (priceRatio > 1.05) score -= 5;

  // Facteur rendement (-10 à +15)
  if (yield_ > 6) score += 15;
  else if (yield_ > 5) score += 10;
  else if (yield_ > 4) score += 5;
  else if (yield_ < 3) score -= 10;

  // Facteur appréciation (-5 à +10)
  if (appreciation > 4) score += 10;
  else if (appreciation > 3) score += 5;
  else if (appreciation < 2) score -= 5;

  // Facteur vacance (-15 à 0)
  if (vacancyRate > 10) score -= 15;
  else if (vacancyRate > 7) score -= 10;
  else if (vacancyRate > 5) score -= 5;

  return Math.max(0, Math.min(100, score));
}
