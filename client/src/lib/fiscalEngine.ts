/**
 * Moteur de calcul fiscal immobilier Maroc
 * Couvre : TPI, IR locatif, TH, TSC, frais d'enregistrement
 * Mise à jour : Loi Finances 2024
 */

export interface AchatSimulation {
  prix: number;
  surface: number;
  typeImmobilier: 'neuf' | 'ancien' | 'terrain';
  dateAcquisition: Date;
  estExonere: boolean;
}

export interface AchatResults {
  prixNet: number;
  fraisEnregistrement: number;
  droitsEnregistrement: number;
  honorairesNotaire: number;
  fraisConservation: number;
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
}

export interface AirbnbSimulation {
  prixAcquisition: number;
  loyerNuit: number;
  tauxOccupation: number;
  tauxCommissionAirbnb: number;
  tauxTaxesSejour: number;
  depensesAnnuelles: number;
}

export interface AirbnbResults {
  revenuBrutAnnuel: number;
  commissionsAirbnb: number;
  taxesSejour: number;
  chargesFiscales: number;
  revenuNetMensuel: number;
  revenuNetAnnuel: number;
  rendementAnnuel: number;
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
  const { prix, surface, typeImmobilier, dateAcquisition, estExonere } = sim;

  // Frais d'enregistrement (droits d'enregistrement)
  let tauxDroits = 0;
  if (typeImmobilier === 'neuf') {
    tauxDroits = estExonere ? 0 : 0.06; // 6% normal, 0% si exonéré
  } else if (typeImmobilier === 'ancien') {
    tauxDroits = 0.075; // 7.5% pour ancien
  } else {
    tauxDroits = 0.05; // 5% pour terrain
  }

  const droitsEnregistrement = prix * tauxDroits;

  // Honoraires notaire (environ 0.5-1% du prix)
  const honorairesNotaire = prix * 0.0075;

  // Frais de conservation (environ 0.1% du prix)
  const fraisConservation = prix * 0.001;

  // Frais d'entrée (somme des frais)
  const fraisEntree = droitsEnregistrement + honorairesNotaire + fraisConservation;

  // Coût total d'acquisition
  const coutTotal = prix + fraisEntree;

  // Économie d'exonération si applicable
  const economieExoneration = estExonere ? prix * 0.06 : 0;

  // Quitus fiscal obligatoire si bien acquis après juillet 2024
  const quitusFiscalObligatoire = dateAcquisition > new Date('2024-07-01');

  return {
    prixNet: prix,
    fraisEnregistrement: fraisEntree,
    droitsEnregistrement,
    honorairesNotaire,
    fraisConservation,
    coutTotal,
    economieExoneration,
    quitusFiscalObligatoire,
    detailsCalcul: `Prix: ${prix} DH | Droits: ${droitsEnregistrement.toFixed(0)} DH | Honoraires: ${honorairesNotaire.toFixed(0)} DH | Conservation: ${fraisConservation.toFixed(0)} DH`,
  };
}

// ============ LOCATION ============

export function calculateLocationRevenue(sim: LocationSimulation): LocationResults {
  const { prixAcquisition, loyer, dureeDetention, typeImmobilier, depensesAnnuelles } = sim;

  // Revenu brut annuel
  const revenuBrut = loyer * 12;

  const abattementFoncier = 0.4;
  const baseImposable = Math.max(0, revenuBrut * (1 - abattementFoncier));
  const irAnnuel = calculateIRRevenusFonciers(baseImposable);

  const revenuNetAvantIR = revenuBrut - depensesAnnuelles;
  const revenuNet = revenuNetAvantIR - irAnnuel;

  // Rendements
  const rendementBrut = (revenuBrut / prixAcquisition) * 100;
  const rendementNet = (revenuNet / prixAcquisition) * 100;

  return {
    revenuBrut,
    chargesFiscales: irAnnuel,
    revenuNet,
    rendementBrut,
    rendementNet,
    irAnnuel,
    baseImposable,
    abattementFoncier,
  };
}

export function calculateIRRevenusFonciers(revenuFoncierNetImposableAnnuel: number): number {
  const x = Math.max(0, revenuFoncierNetImposableAnnuel);
  const t1 = 30000;
  const t2 = 120000;

  if (x <= t1) return 0;
  if (x <= t2) return (x - t1) * 0.1;
  return (t2 - t1) * 0.1 + (x - t2) * 0.15;
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
  } = sim;

  const occupationPct = tauxOccupation <= 1 ? tauxOccupation * 100 : tauxOccupation;
  const joursOccupation = 365 * (occupationPct / 100);

  // Revenu brut annuel
  const revenuBrutAnnuel = loyerNuit * joursOccupation;

  // Commissions Airbnb (3% standard)
  const commissionsAirbnb = revenuBrutAnnuel * tauxCommissionAirbnb;

  // Taxes de séjour (environ 1-2% du revenu)
  const taxesSejour = revenuBrutAnnuel * tauxTaxesSejour;

  // Revenu net avant charges
  const revenuNetAvantCharges = revenuBrutAnnuel - commissionsAirbnb - taxesSejour;

  // IR sur revenus Airbnb (taux plus élevé, activité commerciale)
  const chargesFiscales = calculateIRAirbnb(revenuNetAvantCharges);

  // Revenu net final
  const revenuNetAnnuel = revenuNetAvantCharges - chargesFiscales - depensesAnnuelles;
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
  };
}

function calculateIRAirbnb(revenuNet: number): number {
  // Taux d'IR plus élevé pour activité commerciale
  if (revenuNet <= 30000) return revenuNet * 0.05;
  if (revenuNet <= 50000) return 1500 + (revenuNet - 30000) * 0.15;
  if (revenuNet <= 100000) return 4500 + (revenuNet - 50000) * 0.25;
  return 16000 + (revenuNet - 100000) * 0.35;
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
  const { prixVente, prixAcquisition, dureeDetention, typeImmobilier, travaux, isResidencePrincipale } = sim;

  const plusValue = prixVente - prixAcquisition;

  // Scénario A : TPI standard 20%
  const scenarioA: TpiScenario = {
    name: 'Scénario A',
    description: 'TPI standard 20%',
    tauxTpi: 0.20,
    montantTpi: plusValue * 0.20,
    montantDeductible: 0,
    netVendeur: prixVente - plusValue * 0.20,
    cotisationMinimale: 0,
  };

  // Scénario B : Exonération résidence principale
  const scenarioB: TpiScenario = {
    name: 'Scénario B',
    description: 'Exonération résidence principale',
    tauxTpi: isResidencePrincipale ? 0 : 0.20,
    montantTpi: isResidencePrincipale ? 0 : plusValue * 0.20,
    montantDeductible: 0,
    netVendeur: prixVente - (isResidencePrincipale ? 0 : plusValue * 0.20),
    cotisationMinimale: 0,
  };

  // Scénario C : Déduction travaux
  const montantDeductibleTravaux = Math.min(travaux, plusValue * 0.5);
  const plusValueApresTravaux = plusValue - montantDeductibleTravaux;
  const tpiApresTravaux = plusValueApresTravaux * 0.20;
  const cotisationMinimale = Math.max(tpiApresTravaux, prixVente * 0.03); // 3% minimum

  const scenarioC: TpiScenario = {
    name: 'Scénario C',
    description: 'Déduction travaux',
    tauxTpi: 0.20,
    montantTpi: tpiApresTravaux,
    montantDeductible: montantDeductibleTravaux,
    netVendeur: prixVente - cotisationMinimale,
    cotisationMinimale,
  };

  // Déterminer le scénario optimal
  const scenarios = [scenarioA, scenarioB, scenarioC];
  const scenarioOptimal = scenarios.reduce((best, current) =>
    current.netVendeur > best.netVendeur ? current : best
  );

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
