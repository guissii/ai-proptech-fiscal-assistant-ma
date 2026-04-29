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

export const DEMO_START_NODE_ID = "q.salarie" as const;

export const DEMO_NODES: Record<string, DemoNode> = {
  "q.salarie": {
    id: "q.salarie",
    type: "choice",
    prompt: "Êtes-vous salarié(e) ?",
    options: [
      { label: "Oui", value: "yes", next: "q.price" },
      { label: "Non", value: "no", next: "q.price" },
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
      next: "q.quartier",
    },
  },
  "q.quartier": {
    id: "q.quartier",
    type: "choice",
    prompt: "Quel quartier ?",
    options: [],
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
      next: "q.airbnbNightly",
    },
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
      next: "q.sell",
    },
  },
  "q.sell": {
    id: "q.sell",
    type: "choice",
    prompt: "Voulez-vous estimer aussi la revente (TPI) ?",
    options: [
      { label: "Oui", value: "yes", next: "q.salePrice" },
      { label: "Non", value: "no", next: "q.done" },
    ],
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
      next: "q.done",
    },
  },
  "q.done": {
    id: "q.done",
    type: "done",
    prompt: "Je prépare votre page de résultats…",
    action: {
      type: "go_results",
      inputMap: {
        salaried: "q.salarie",
        price: "q.price",
        surface: "q.surface",
        quartierId: "q.quartier",
        monthlyRent: "q.rent",
        nightlyRate: "q.airbnbNightly",
        occupancyRate: "q.airbnbOccupancy",
        sell: "q.sell",
        salePrice: "q.salePrice",
      },
    },
  },
};

export function getDemoNode(nodeId: string): DemoNode | undefined {
  return DEMO_NODES[nodeId];
}
