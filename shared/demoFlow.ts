export type City = "fes" | "rabat" | "casa";
export type Language = "fr" | "ar" | "en";

export type DemoNodeType = "choice" | "number" | "done";

export type DemoChoiceOption = {
  label: string;
  value: string;
  next: string;
};

export type DemoNumberSpec = {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  next: string;
};

export type DemoNode =
  | {
      id: string;
      type: "choice";
      prompt: string;
      options: DemoChoiceOption[];
    }
  | {
      id: string;
      type: "number";
      prompt: string;
      number: DemoNumberSpec;
    }
  | {
      id: string;
      type: "done";
      prompt: string;
      action: {
        type: "go_results";
        inputMap: Record<string, string>;
      };
    };

export const DEMO_START_NODE_ID = "q.taxYear" as const;

export const DEMO_NODES: Record<string, DemoNode> = {
  "q.taxYear": {
    id: "q.taxYear",
    type: "choice",
    prompt: "Quelle année fiscale souhaitez-vous utiliser pour l’estimation ?",
    options: [
      { label: "2026 (référence)", value: "2026", next: "q.salarie" },
      { label: "2025", value: "2025", next: "q.salarie" },
      { label: "2024", value: "2024", next: "q.salarie" },
    ],
  },

  "q.salarie": {
    id: "q.salarie",
    type: "choice",
    prompt: "Êtes-vous salarié(e) ?",
    options: [
      { label: "Oui", value: "yes", next: "q.salaryMonthly" },
      { label: "Non", value: "no", next: "q.investorType" },
    ],
  },

  "q.salaryMonthly": {
    id: "q.salaryMonthly",
    type: "number",
    prompt: "Quel est votre salaire net mensuel approximatif (DH) ?",
    number: {
      min: 0,
      max: 500000,
      step: 500,
      unit: "DH/mois",
      placeholder: "Ex: 12000",
      next: "q.investorType",
    },
  },

  "q.investorType": {
    id: "q.investorType",
    type: "choice",
    prompt: "Vous investissez en tant que… (cela change la manière d’estimer l’impôt)",
    options: [
      { label: "Personne physique", value: "individual", next: "q.price" },
      { label: "Société / agence", value: "company", next: "q.price" },
    ],
  },

  "q.price": {
    id: "q.price",
    type: "number",
    prompt: "Quel est le prix du bien (DH) ?",
    number: {
      min: 100000,
      max: 50000000,
      step: 5000,
      unit: "DH",
      placeholder: "Ex: 1500000",
      next: "q.surface",
    },
  },
  "q.surface": {
    id: "q.surface",
    type: "number",
    prompt: "Quelle est la surface (m²) ?",
    number: {
      min: 10,
      max: 2000,
      step: 1,
      unit: "m²",
      placeholder: "Ex: 100",
      next: "q.propertyType",
    },
  },
  "q.propertyType": {
    id: "q.propertyType",
    type: "choice",
    prompt: "Quel type de bien ?",
    options: [
      { label: "Ancien", value: "ancien", next: "q.quartier" },
      { label: "Neuf", value: "neuf", next: "q.quartier" },
      { label: "Terrain", value: "terrain", next: "q.quartier" },
    ],
  },
  "q.quartier": {
    id: "q.quartier",
    type: "choice",
    prompt: "Quel quartier ?",
    options: [],
  },
  "q.financing": {
    id: "q.financing",
    type: "choice",
    prompt: "Comment financez-vous l’achat ?",
    options: [
      { label: "Cash (sans crédit)", value: "cash", next: "q.rent" },
      { label: "Crédit immobilier", value: "credit", next: "q.downPayment" },
    ],
  },
  "q.downPayment": {
    id: "q.downPayment",
    type: "number",
    prompt: "Apport (DH) ?",
    number: {
      min: 0,
      max: 50000000,
      step: 5000,
      unit: "DH",
      placeholder: "Ex: 300000",
      next: "q.loanYears",
    },
  },
  "q.loanYears": {
    id: "q.loanYears",
    type: "number",
    prompt: "Durée du crédit (années) ?",
    number: {
      min: 1,
      max: 30,
      step: 1,
      unit: "ans",
      placeholder: "Ex: 20",
      next: "q.interestRate",
    },
  },
  "q.interestRate": {
    id: "q.interestRate",
    type: "number",
    prompt: "Taux d’intérêt annuel (%) ?",
    number: {
      min: 0,
      max: 25,
      step: 0.1,
      unit: "%",
      placeholder: "Ex: 4.5",
      next: "q.rent",
    },
  },
  "q.rent": {
    id: "q.rent",
    type: "number",
    prompt: "Quel est le loyer mensuel estimé (DH) ?",
    number: {
      min: 500,
      max: 500000,
      step: 100,
      unit: "DH/mois",
      placeholder: "Ex: 6500",
      next: "q.vacancyRate",
    },
  },
  "q.vacancyRate": {
    id: "q.vacancyRate",
    type: "number",
    prompt: "Taux de vacance (périodes non louées) (%) ?",
    number: {
      min: 0,
      max: 50,
      step: 1,
      unit: "%",
      placeholder: "Ex: 5",
      next: "q.managementFeePct",
    },
  },
  "q.managementFeePct": {
    id: "q.managementFeePct",
    type: "number",
    prompt: "Frais de gestion/Agence sur loyers (%) ?",
    number: {
      min: 0,
      max: 30,
      step: 0.5,
      unit: "%",
      placeholder: "Ex: 8",
      next: "q.operatingExpensesAnnual",
    },
  },
  "q.operatingExpensesAnnual": {
    id: "q.operatingExpensesAnnual",
    type: "number",
    prompt: "Charges annuelles (copro, entretien, réparations) (DH/an) ?",
    number: {
      min: 0,
      max: 1000000,
      step: 500,
      unit: "DH/an",
      placeholder: "Ex: 12000",
      next: "q.insuranceAnnual",
    },
  },
  "q.insuranceAnnual": {
    id: "q.insuranceAnnual",
    type: "number",
    prompt: "Assurance annuelle (DH/an) ?",
    number: {
      min: 0,
      max: 200000,
      step: 200,
      unit: "DH/an",
      placeholder: "Ex: 2500",
      next: "q.wantAirbnb",
    },
  },
  "q.wantAirbnb": {
    id: "q.wantAirbnb",
    type: "choice",
    prompt: "Souhaitez-vous aussi estimer la location courte durée (Airbnb) ?",
    options: [
      { label: "Oui", value: "yes", next: "q.airbnbNightly" },
      { label: "Non", value: "no", next: "q.sell" },
    ],
  },
  "q.airbnbNightly": {
    id: "q.airbnbNightly",
    type: "number",
    prompt: "Si Airbnb : quel tarif moyen par nuit (DH) ?",
    number: {
      min: 50,
      max: 20000,
      step: 10,
      unit: "DH/nuit",
      placeholder: "Ex: 450",
      next: "q.airbnbOccupancy",
    },
  },
  "q.airbnbOccupancy": {
    id: "q.airbnbOccupancy",
    type: "number",
    prompt: "Si Airbnb : quel taux d'occupation (%) ?",
    number: {
      min: 5,
      max: 100,
      step: 1,
      unit: "%",
      placeholder: "Ex: 70",
      next: "q.airbnbCommissionPct",
    },
  },
  "q.airbnbCommissionPct": {
    id: "q.airbnbCommissionPct",
    type: "number",
    prompt: "Commission plateforme (%) ?",
    number: {
      min: 0,
      max: 25,
      step: 0.5,
      unit: "%",
      placeholder: "Ex: 3",
      next: "q.airbnbTouristTaxPct",
    },
  },
  "q.airbnbTouristTaxPct": {
    id: "q.airbnbTouristTaxPct",
    type: "number",
    prompt: "Taxe de séjour (Airbnb) (%) ?",
    number: {
      min: 0,
      max: 15,
      step: 0.5,
      unit: "%",
      placeholder: "Ex: 2",
      next: "q.airbnbExpensesAnnual",
    },
  },
  "q.airbnbExpensesAnnual": {
    id: "q.airbnbExpensesAnnual",
    type: "number",
    prompt: "Dépenses annuelles Airbnb (ménage, linge, consommables) (DH/an) ?",
    number: {
      min: 0,
      max: 2000000,
      step: 500,
      unit: "DH/an",
      placeholder: "Ex: 18000",
      next: "q.sell",
    },
  },
  "q.sell": {
    id: "q.sell",
    type: "choice",
    prompt: "Voulez-vous estimer aussi la revente (TPI) ?",
    options: [
      { label: "Oui", value: "yes", next: "q.yearsHeld" },
      { label: "Non", value: "no", next: "q.done" },
    ],
  },
  "q.yearsHeld": {
    id: "q.yearsHeld",
    type: "number",
    prompt: "Durée de détention (achat → revente) (années) ?",
    number: {
      min: 1,
      max: 40,
      step: 1,
      unit: "ans",
      placeholder: "Ex: 8",
      next: "q.salePrice",
    },
  },
  "q.salePrice": {
    id: "q.salePrice",
    type: "number",
    prompt: "Prix de vente estimé (DH) ?",
    number: {
      min: 100000,
      max: 50000000,
      step: 5000,
      unit: "DH",
      placeholder: "Ex: 2500000",
      next: "q.works",
    },
  },
  "q.works": {
    id: "q.works",
    type: "number",
    prompt: "Travaux justifiables (factures) (DH) ?",
    number: {
      min: 0,
      max: 50000000,
      step: 5000,
      unit: "DH",
      placeholder: "Ex: 150000",
      next: "q.isPrimaryResidence",
    },
  },
  "q.isPrimaryResidence": {
    id: "q.isPrimaryResidence",
    type: "choice",
    prompt: "Ce bien est-il votre résidence principale ?",
    options: [
      { label: "Oui", value: "yes", next: "q.done" },
      { label: "Non", value: "no", next: "q.done" },
    ],
  },
  "q.done": {
    id: "q.done",
    type: "done",
    prompt: "Je prépare votre page de résultats…",
    action: {
      type: "go_results",
      inputMap: {
        taxYear: "q.taxYear",
        salaried: "q.salarie",
        salaryMonthly: "q.salaryMonthly",
        investorType: "q.investorType",
        price: "q.price",
        surface: "q.surface",
        propertyType: "q.propertyType",
        quartierId: "q.quartier",
        financing: "q.financing",
        downPayment: "q.downPayment",
        loanYears: "q.loanYears",
        interestRate: "q.interestRate",
        monthlyRent: "q.rent",
        vacancyRate: "q.vacancyRate",
        managementFeePct: "q.managementFeePct",
        operatingExpensesAnnual: "q.operatingExpensesAnnual",
        insuranceAnnual: "q.insuranceAnnual",
        wantAirbnb: "q.wantAirbnb",
        nightlyRate: "q.airbnbNightly",
        occupancyRate: "q.airbnbOccupancy",
        airbnbCommissionPct: "q.airbnbCommissionPct",
        airbnbTouristTaxPct: "q.airbnbTouristTaxPct",
        airbnbExpensesAnnual: "q.airbnbExpensesAnnual",
        sell: "q.sell",
        yearsHeld: "q.yearsHeld",
        salePrice: "q.salePrice",
        works: "q.works",
        isPrimaryResidence: "q.isPrimaryResidence",
      },
    },
  },
};

export const DEMO_NODE_ORDER: string[] = [
  "q.taxYear",
  "q.salarie",
  "q.salaryMonthly",
  "q.investorType",
  "q.price",
  "q.surface",
  "q.propertyType",
  "q.quartier",
  "q.financing",
  "q.downPayment",
  "q.loanYears",
  "q.interestRate",
  "q.rent",
  "q.vacancyRate",
  "q.managementFeePct",
  "q.operatingExpensesAnnual",
  "q.insuranceAnnual",
  "q.wantAirbnb",
  "q.airbnbNightly",
  "q.airbnbOccupancy",
  "q.airbnbCommissionPct",
  "q.airbnbTouristTaxPct",
  "q.airbnbExpensesAnnual",
  "q.sell",
  "q.yearsHeld",
  "q.salePrice",
  "q.works",
  "q.isPrimaryResidence",
  "q.done",
];

export function getDemoNode(nodeId: string): DemoNode | undefined {
  return DEMO_NODES[nodeId];
}
