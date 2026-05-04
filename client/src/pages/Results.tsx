import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import AchatCard from "@/components/results/AchatCard";
import AirbnbCard from "@/components/results/AirbnbCard";
import LocationCard from "@/components/results/LocationCard";
import TpiCard from "@/components/results/TpiCard";
import { generatePdf } from "@/components/PdfExport";
import { getQuartierById } from "@/data/quartiers";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast as sonnerToast } from "sonner";
import {
  calculateAchatCosts,
  calculateAirbnbRevenue,
  calculateLocationRevenue,
  calculateTpi,
  estimateLocalTaxesAnnual,
  formatCurrency,
} from "@/lib/fiscalEngine";

type ResultsInput = {
  city?: "fes" | "rabat" | "casa";
  language?: "fr" | "ar" | "en";
  taxYear?: string | number;
  salaried?: string;
  salaryMonthly?: number;
  portfolioHasProperties?: string;
  portfolioCount?: number;
  portfolioTotalValue?: number;
  portfolioExistingLoansMonthly?: number;
  otherTaxableIncomeAnnual?: number;
  investorType?: string;
  price?: number;
  surface?: number;
  propertyType?: string;
  quartierId?: string;
  financing?: string;
  downPayment?: number;
  loanYears?: number;
  interestRate?: number;
  monthlyRent?: number;
  vacancyRate?: number;
  managementFeePct?: number;
  operatingExpensesAnnual?: number;
  insuranceAnnual?: number;
  propertyTaxesAnnual?: number;
  wantAirbnb?: string;
  nightlyRate?: number;
  occupancyRate?: number;
  airbnbCommissionPct?: number;
  airbnbTouristTaxPct?: number;
  airbnbExpensesAnnual?: number;
  sell?: string;
  works?: number;
  isPrimaryResidence?: string;
  salePrice?: number;
  yearsHeld?: number;
};

function readResultsInput(): ResultsInput | null {
  try {
    const raw =
      localStorage.getItem("aqar.simulation.resultsInput") ??
      localStorage.getItem("aqar.demo.resultsInput");
    if (!raw) return null;
    return JSON.parse(raw) as ResultsInput;
  } catch {
    return null;
  }
}

export default function Results() {
  const [, setLocation] = useLocation();

  const input = useMemo(() => readResultsInput(), []);

  const parsed = useMemo(() => {
    const asNumber = (v: unknown) =>
      typeof v === "number" && Number.isFinite(v) ? v : undefined;
    const asString = (v: unknown) => (typeof v === "string" ? v : undefined);
    const asInt = (v: unknown) => {
      if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
      if (typeof v === "string" && v.trim() !== "") {
        const n = Number(v.trim());
        return Number.isFinite(n) ? Math.trunc(n) : undefined;
      }
      return undefined;
    };

    const price = asNumber(input?.price) ?? 0;
    const surface = asNumber(input?.surface) ?? 0;
    const quartierId = asString(input?.quartierId);
    const monthlyRent = asNumber(input?.monthlyRent) ?? 0;
    const nightlyRate = asNumber(input?.nightlyRate) ?? 0;
    const occupancyRate = asNumber(input?.occupancyRate) ?? 0;
    const salePrice = asNumber(input?.salePrice) ?? 0;
    const yearsHeld = asNumber(input?.yearsHeld);
    const salaried = asString(input?.salaried);
    const sell = asString(input?.sell);
    const propertyTypeRaw = asString(input?.propertyType);
    const propertyType: "ancien" | "neuf" | "terrain" =
      propertyTypeRaw === "neuf" ? "neuf" : propertyTypeRaw === "terrain" ? "terrain" : "ancien";

    const financingRaw = asString(input?.financing);
    const financing: "cash" | "credit" = financingRaw === "credit" ? "credit" : "cash";

    const taxYear = asInt(input?.taxYear) ?? 2026;
    const salaryMonthly = asNumber(input?.salaryMonthly) ?? 0;
    const salaryAnnual = salaried === "yes" ? salaryMonthly * 12 : 0;

    const portfolioHasProperties = asString(input?.portfolioHasProperties);
    const portfolioCount = asNumber(input?.portfolioCount) ?? 0;
    const portfolioTotalValue = asNumber(input?.portfolioTotalValue) ?? 0;
    const portfolioExistingLoansMonthly = asNumber(input?.portfolioExistingLoansMonthly) ?? 0;
    const otherTaxableIncomeAnnual = asNumber(input?.otherTaxableIncomeAnnual) ?? 0;

    const investorTypeRaw = asString(input?.investorType);
    const investorType: "individual" | "company" =
      investorTypeRaw === "company" ? "company" : "individual";

    const downPayment = asNumber(input?.downPayment) ?? 0;
    const loanYears = asNumber(input?.loanYears) ?? 0;
    const interestRate = asNumber(input?.interestRate) ?? 0;

    const vacancyRate = asNumber(input?.vacancyRate) ?? 0;
    const managementFeePct = asNumber(input?.managementFeePct) ?? 0;
    const operatingExpensesAnnual = asNumber(input?.operatingExpensesAnnual) ?? 0;
    const insuranceAnnual = asNumber(input?.insuranceAnnual) ?? 0;
    const propertyTaxesAnnualRaw = asNumber(input?.propertyTaxesAnnual);
    const propertyTaxesAnnualEstimated =
      typeof propertyTaxesAnnualRaw !== "number" || !Number.isFinite(propertyTaxesAnnualRaw);
    const propertyTaxesAnnual =
      propertyTaxesAnnualRaw ?? estimateLocalTaxesAnnual({ price, city: input?.city });

    const wantAirbnb = asString(input?.wantAirbnb);
    const airbnbCommissionPct = asNumber(input?.airbnbCommissionPct) ?? 0;
    const airbnbTouristTaxPct = asNumber(input?.airbnbTouristTaxPct) ?? 0;
    const airbnbExpensesAnnual = asNumber(input?.airbnbExpensesAnnual) ?? 0;

    const works = asNumber(input?.works) ?? 0;
    const isPrimaryResidence = asString(input?.isPrimaryResidence);

    return {
      city: input?.city,
      language: input?.language,
      taxYear,
      salaried,
      salaryMonthly,
      salaryAnnual,
      portfolioHasProperties,
      portfolioCount,
      portfolioTotalValue,
      portfolioExistingLoansMonthly,
      otherTaxableIncomeAnnual,
      investorType,
      sell,
      price,
      surface,
      propertyType,
      quartierId,
      financing,
      downPayment,
      loanYears,
      interestRate,
      monthlyRent,
      vacancyRate,
      managementFeePct,
      operatingExpensesAnnual,
      insuranceAnnual,
      propertyTaxesAnnual,
      propertyTaxesAnnualEstimated,
      wantAirbnb,
      nightlyRate,
      occupancyRate,
      airbnbCommissionPct,
      airbnbTouristTaxPct,
      airbnbExpensesAnnual,
      works,
      isPrimaryResidence,
      salePrice,
      yearsHeld,
    };
  }, [input]);

  const [tpiYearsHeld, setTpiYearsHeld] = useState<number>(5);

  useEffect(() => {
    if (parsed.yearsHeld && parsed.yearsHeld >= 1) {
      setTpiYearsHeld(parsed.yearsHeld);
      return;
    }
    if (parsed.sell === "yes") {
      setTpiYearsHeld(5);
    }
  }, [parsed.sell, parsed.yearsHeld]);

  const quartier = useMemo(() => {
    if (!parsed.quartierId) return undefined;
    return getQuartierById(parsed.quartierId);
  }, [parsed.quartierId]);

  const achatResults = useMemo(() => {
    if (!parsed.price || !parsed.surface) return null;
    return calculateAchatCosts({
      prix: parsed.price,
      surface: parsed.surface,
      typeImmobilier: parsed.propertyType,
      dateAcquisition: new Date(),
      estExonere: false,
    });
  }, [parsed.price, parsed.propertyType, parsed.surface]);

  const locationResults = useMemo(() => {
    if (!parsed.price || !parsed.monthlyRent) return null;
    return calculateLocationRevenue({
      prixAcquisition: parsed.price,
      loyer: parsed.monthlyRent,
      dureeDetention: parsed.sell === "yes" && parsed.yearsHeld ? parsed.yearsHeld : 10,
      typeImmobilier: "non-meuble",
      depensesAnnuelles: parsed.operatingExpensesAnnual,
      investorType: parsed.investorType,
      vacancyRatePct: parsed.vacancyRate,
      managementFeePct: parsed.managementFeePct,
      insuranceAnnual: parsed.insuranceAnnual,
      propertyTaxesAnnual: parsed.propertyTaxesAnnual,
      salaryAnnual: parsed.salaryAnnual,
      otherTaxableIncomeAnnual: parsed.otherTaxableIncomeAnnual,
      taxYear: parsed.taxYear,
      financing: parsed.financing,
      downPayment: parsed.downPayment,
      loanYears: parsed.loanYears,
      interestRatePct: parsed.interestRate,
    });
  }, [
    parsed.downPayment,
    parsed.financing,
    parsed.insuranceAnnual,
    parsed.interestRate,
    parsed.investorType,
    parsed.loanYears,
    parsed.managementFeePct,
    parsed.monthlyRent,
    parsed.operatingExpensesAnnual,
    parsed.price,
    parsed.propertyTaxesAnnual,
    parsed.salaryAnnual,
    parsed.otherTaxableIncomeAnnual,
    parsed.sell,
    parsed.taxYear,
    parsed.vacancyRate,
    parsed.yearsHeld,
  ]);

  const airbnbResults = useMemo(() => {
    if (parsed.wantAirbnb !== "yes") return null;
    if (!parsed.price || !parsed.nightlyRate || !parsed.occupancyRate) return null;
    return calculateAirbnbRevenue({
      prixAcquisition: parsed.price,
      loyerNuit: parsed.nightlyRate,
      tauxOccupation: parsed.occupancyRate,
      tauxCommissionAirbnb: parsed.airbnbCommissionPct / 100,
      tauxTaxesSejour: parsed.airbnbTouristTaxPct / 100,
      depensesAnnuelles: parsed.airbnbExpensesAnnual,
      investorType: parsed.investorType,
      managementFeePct: parsed.managementFeePct,
      vacancyRatePct: parsed.vacancyRate,
      salaryAnnual: parsed.salaryAnnual,
      otherTaxableIncomeAnnual: parsed.otherTaxableIncomeAnnual,
      taxYear: parsed.taxYear,
    });
  }, [
    parsed.airbnbCommissionPct,
    parsed.airbnbExpensesAnnual,
    parsed.airbnbTouristTaxPct,
    parsed.investorType,
    parsed.managementFeePct,
    parsed.nightlyRate,
    parsed.occupancyRate,
    parsed.price,
    parsed.salaryAnnual,
    parsed.otherTaxableIncomeAnnual,
    parsed.taxYear,
    parsed.vacancyRate,
    parsed.wantAirbnb,
  ]);

  const tpiResults = useMemo(() => {
    if (parsed.sell !== "yes") return null;
    if (!parsed.price || !parsed.salePrice) return null;
    return calculateTpi({
      prixVente: parsed.salePrice,
      prixAcquisition: parsed.price,
      dureeDetention: tpiYearsHeld,
      typeImmobilier: parsed.propertyType === "neuf" ? "neuf" : "ancien",
      travaux: parsed.works,
      isResidencePrincipale: parsed.isPrimaryResidence === "yes",
    });
  }, [parsed.isPrimaryResidence, parsed.price, parsed.propertyType, parsed.salePrice, parsed.sell, parsed.works, tpiYearsHeld]);

  const headerKpis = useMemo(() => {
    const kpis: Array<{ label: string; value: string }> = [];
    if (locationResults) {
      kpis.push({
        label: "Brut annuel (effectif)",
        value: formatCurrency(locationResults.revenuBrutEffectif ?? locationResults.revenuBrut),
      });
      kpis.push({ label: "Base imposable", value: formatCurrency(locationResults.baseImposable) });
      kpis.push({
        label: parsed.investorType === "company" ? "Impôt annuel (IS estimé)" : "Impôt annuel (IR revenus locatifs)",
        value: formatCurrency(locationResults.irAnnuel),
      });
      kpis.push({ label: "Net annuel", value: formatCurrency(locationResults.revenuNet) });
      kpis.push({ label: "Rendement net", value: `${locationResults.rendementNet.toFixed(1)}%` });
      if (locationResults.mensualiteCredit > 0) {
        kpis.push({ label: "Mensualité crédit", value: formatCurrency(locationResults.mensualiteCredit) });
      }
      kpis.push({ label: "Cashflow net/mois", value: formatCurrency(locationResults.cashflowNetMensuel) });
      if (parsed.portfolioExistingLoansMonthly > 0) {
        kpis.push({
          label: "Cashflow net/mois (après crédits existants)",
          value: formatCurrency(locationResults.cashflowNetMensuel - parsed.portfolioExistingLoansMonthly),
        });
      }
    }
    if (airbnbResults) {
      kpis.push({ label: "Brut annuel (Airbnb)", value: formatCurrency(airbnbResults.revenuBrutAnnuel) });
      kpis.push({ label: "Net annuel (Airbnb)", value: formatCurrency(airbnbResults.revenuNetAnnuel) });
      kpis.push({ label: "IR annuel (Airbnb)", value: formatCurrency(airbnbResults.chargesFiscales) });
    }
    if (tpiResults) {
      kpis.push({ label: "Économie max (TPI)", value: formatCurrency(tpiResults.economieMax) });
    }
    return kpis;
  }, [airbnbResults, locationResults, parsed.investorType, tpiResults]);

  const reportData = useMemo(() => {
    return {
      input: parsed,
      achat: achatResults,
      location: locationResults,
      airbnb: airbnbResults,
      tpi: tpiResults,
    };
  }, [achatResults, airbnbResults, locationResults, parsed, tpiResults]);

  const buildServerReportPayload = () => {
    const cityLabel = parsed.city === "fes" ? "Fès" : parsed.city === "rabat" ? "Rabat" : "Casablanca";
    const financingLabel = parsed.financing === "credit" ? "Crédit" : "Cash";
    const salaryNetMonthly = parsed.salaried === "yes" ? parsed.salaryMonthly : 0;
    const taxesLocales = parsed.propertyTaxesAnnual;

    const achat = achatResults as any;
    const loc = locationResults as any;
    const air = airbnbResults as any;

    return {
      ville: cityLabel,
      quartier: quartier?.name ?? "",
      prix: parsed.price || 0,
      surface: parsed.surface || 0,
      financement: financingLabel,
      loyer_mensuel: parsed.monthlyRent || 0,
      vacance_pct: parsed.vacancyRate || 0,
      gestion_pct: parsed.managementFeePct || 0,
      statut_salarie: parsed.salaried === "yes",
      salaire_net_mensuel: salaryNetMonthly || 0,
      autres_revenus: parsed.otherTaxableIncomeAnnual || 0,
      annee_fiscale: parsed.taxYear || 2026,

      frais_entree: achat?.fraisEnregistrement ?? null,
      cout_total: achat?.coutTotal ?? null,
      droits_enregistrement: achat?.droitsEnregistrement ?? null,
      honoraires_notaire: achat?.honorairesNotaire ?? null,
      conservation_fonciere: achat?.fraisConservation ?? null,

      brut_annuel: loc?.revenuBrut ?? null,
      brut_effectif: loc?.revenuBrutEffectif ?? null,
      charges_non_fiscales: loc?.chargesNonFiscales ?? null,
      base_imposable: loc?.baseImposable ?? null,
      impot_annuel: loc?.irAnnuel ?? null,
      net_annuel: loc?.revenuNet ?? null,
      rendement_net_pct: loc?.rendementNet ?? null,
      cashflow_net_mois: loc?.cashflowNetMensuel ?? null,

      depenses_exploitation: parsed.operatingExpensesAnnual ?? null,
      frais_gestion: loc?.fraisGestion ?? null,
      assurance: parsed.insuranceAnnual ?? null,
      taxes_locales_annuelles: taxesLocales ?? null,
      type_occupation_bien: "loue",

      airbnb_net_annuel: air?.revenuNetAnnuel ?? null,
      airbnb_impot_annuel: air?.chargesFiscales ?? null,

      quartiers_comparaison: null,

      date_generation: new Date().toLocaleDateString("fr-FR"),
      type_rapport: "Simulation",
    };
  };

  const downloadServerPdf = async () => {
    const payload = buildServerReportPayload();
    const resp = await fetch("/api/report/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      throw new Error(txt || "Export PDF impossible");
    }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-aqar-${parsed.city ?? "casa"}-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const recapItems = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [];
    items.push({ label: "Année fiscale", value: String(parsed.taxYear) });
    items.push({ label: "Type de bien", value: parsed.propertyType === "neuf" ? "Neuf" : parsed.propertyType === "terrain" ? "Terrain" : "Ancien" });
    items.push({ label: "Prix", value: parsed.price ? formatCurrency(parsed.price) : "—" });
    items.push({ label: "Surface", value: parsed.surface ? `${parsed.surface} m²` : "—" });
    items.push({ label: "Quartier", value: quartier?.name ? quartier.name : "—" });

    items.push({ label: "Statut", value: parsed.salaried === "yes" ? "Salarié" : parsed.salaried === "no" ? "Non salarié" : "—" });
    if (parsed.salaried === "yes") {
      items.push({ label: "Salaire net mensuel", value: parsed.salaryMonthly ? `${formatCurrency(parsed.salaryMonthly)}/mois` : "—" });
    }
    items.push({
      label: "Biens existants",
      value:
        parsed.portfolioHasProperties === "some"
          ? `${Math.trunc(parsed.portfolioCount)} bien(s)`
          : parsed.portfolioHasProperties === "none"
            ? "0 bien"
            : "—",
    });
    if (parsed.portfolioHasProperties === "some") {
      items.push({ label: "Valeur totale biens", value: formatCurrency(parsed.portfolioTotalValue) });
      items.push({ label: "Mensualités crédits existants", value: `${formatCurrency(parsed.portfolioExistingLoansMonthly)}/mois` });
    }
    items.push({ label: "Autres revenus imposables", value: formatCurrency(parsed.otherTaxableIncomeAnnual) });
    items.push({
      label: "Mode d’investissement",
      value: parsed.investorType === "company" ? "Société / agence" : "Personne physique",
    });

    items.push({ label: "Financement", value: parsed.financing === "credit" ? "Crédit" : "Cash" });
    if (parsed.financing === "credit") {
      items.push({ label: "Apport", value: parsed.downPayment ? formatCurrency(parsed.downPayment) : "—" });
      items.push({ label: "Durée crédit", value: parsed.loanYears ? `${parsed.loanYears} ans` : "—" });
      items.push({ label: "Taux annuel", value: parsed.interestRate ? `${parsed.interestRate.toFixed(2)}%` : "—" });
    }

    items.push({ label: "Loyer (mensuel)", value: parsed.monthlyRent ? formatCurrency(parsed.monthlyRent) : "—" });
    items.push({ label: "Vacance", value: `${parsed.vacancyRate.toFixed(0)}%` });
    items.push({ label: "Gestion", value: `${parsed.managementFeePct.toFixed(1)}%` });
    items.push({ label: "Charges d’exploitation", value: formatCurrency(parsed.operatingExpensesAnnual) });
    items.push({ label: "Assurance", value: formatCurrency(parsed.insuranceAnnual) });
    items.push({
      label: parsed.propertyTaxesAnnualEstimated ? "Taxes locales (estimées)" : "Taxes locales",
      value: formatCurrency(parsed.propertyTaxesAnnual),
    });

    if (parsed.wantAirbnb === "yes") {
      items.push({ label: "Airbnb activé", value: "Oui" });
      items.push({ label: "Prix/nuit", value: parsed.nightlyRate ? formatCurrency(parsed.nightlyRate) : "—" });
      items.push({ label: "Occupation", value: `${parsed.occupancyRate.toFixed(0)}%` });
      items.push({ label: "Commission", value: `${parsed.airbnbCommissionPct.toFixed(1)}%` });
      items.push({ label: "Taxe séjour", value: `${parsed.airbnbTouristTaxPct.toFixed(1)}%` });
      items.push({ label: "Dépenses Airbnb", value: formatCurrency(parsed.airbnbExpensesAnnual) });
    } else {
      items.push({ label: "Airbnb activé", value: "Non" });
    }

    if (parsed.sell === "yes") {
      items.push({ label: "Revente", value: "Oui" });
      items.push({ label: "Durée détention", value: `${tpiYearsHeld} ans` });
      items.push({ label: "Prix de vente", value: parsed.salePrice ? formatCurrency(parsed.salePrice) : "—" });
      items.push({ label: "Travaux justifiables", value: formatCurrency(parsed.works) });
      items.push({ label: "Résidence principale", value: parsed.isPrimaryResidence === "yes" ? "Oui" : "Non" });
    } else {
      items.push({ label: "Revente", value: "Non" });
    }

    return items;
  }, [parsed, quartier?.name, tpiYearsHeld]);

  if (!input) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md p-6 text-center">
            <h1 className="text-xl font-semibold text-foreground mb-2">Aucun résultat</h1>
            <p className="text-sm text-muted-foreground mb-4">
              Lancez une estimation depuis le chat, puis revenez ici.
            </p>
            <button
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
              onClick={() => setLocation("/")}
            >
              Aller au chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-background">
      <Sidebar />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-8 py-6 border-b border-border bg-muted/30 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-3xl font-bold text-foreground mb-1 truncate"
            >
              Résultats
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {parsed.price ? `Prix: ${formatCurrency(parsed.price)}` : "Prix: —"}
              {quartier?.name ? ` • Quartier: ${quartier.name}` : ""}
              {Number.isFinite(parsed.taxYear) ? ` • Année: ${parsed.taxYear}` : ""}
              {parsed.salaried ? ` • Salarié: ${parsed.salaried === "yes" ? "Oui" : "Non"}` : ""}
              {parsed.financing ? ` • Financement: ${parsed.financing === "credit" ? "Crédit" : "Cash"}` : ""}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              className="px-3 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80"
              onClick={async () => {
                try {
                  await downloadServerPdf();
                  sonnerToast.success("Rapport PDF téléchargé", {
                    description: "Version serveur (template premium).",
                  });
                } catch {
                  generatePdf({
                    flowType: "Simulation",
                    city: parsed.city ?? "casa",
                    quartier: quartier?.name,
                    data: reportData as any,
                  });
                  sonnerToast.warning("Rapport PDF simplifié téléchargé", {
                    description: "Le générateur serveur n’est pas disponible sur cet environnement.",
                  });
                }
              }}
            >
              Télécharger le rapport PDF
            </button>
            <button
              className="px-3 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80"
              onClick={() => setLocation("/")}
            >
              Retour au chat
            </button>
            <button
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
              onClick={() => {
                setLocation("/");
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("newSimulation"));
                }, 50);
              }}
            >
              Nouvelle estimation
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-8">
          <div className="rounded-lg border border-border bg-card p-6 mb-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">Entrées & hypothèses utilisées</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Les calculs ci-dessous utilisent exactement ces paramètres. Modifiez-les via le chat pour recalculer.
                </p>
              </div>
              <button
                className="px-3 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 shrink-0"
                onClick={() => setLocation("/")}
              >
                Modifier
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {recapItems.map((it) => (
                <div key={it.label} className="rounded-lg bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">{it.label}</div>
                  <div className="text-sm font-semibold text-foreground truncate">{it.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 mb-8">
            <h2 className="text-sm font-semibold text-foreground">Comprendre les chiffres</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Définitions rapides pour lire le résultat sans jargon financier.
            </p>
            <div className="mt-4">
              <Accordion type="single" collapsible>
                <AccordionItem value="ir">
                  <AccordionTrigger>IR annuel / impôt annuel</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground space-y-2">
                    <div>
                      C’est l’impôt estimé dû sur les revenus locatifs (ou IS estimé si investisseur = société).
                    </div>
                    <div>
                      Pour la location longue durée, on part d’une base imposable puis on applique un taux d’IR paramétré.
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="base">
                  <AccordionTrigger>Base imposable</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground space-y-2">
                    <div>
                      La base imposable est le montant sur lequel on calcule l’impôt. Ce n’est pas le “net dans votre poche”.
                    </div>
                    <div>
                      Exemple (simplifié) : base = brut effectif × (1 − abattement).
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="entree">
                  <AccordionTrigger>Frais d’entrée / coût total</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground space-y-2">
                    <div>
                      Les frais d’entrée sont des frais liés à l’achat (droits d’enregistrement, notaire, conservation). Ils
                      s’ajoutent au prix du bien.
                    </div>
                    <div>
                      Coût total acquisition = prix du bien + frais d’entrée.
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="economie">
                  <AccordionTrigger>Économie max (TPI)</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground space-y-2">
                    <div>
                      Montant d’impôt “économisé” en choisissant le scénario de calcul le plus avantageux, par rapport au
                      scénario standard.
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {headerKpis.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {headerKpis.slice(0, 6).map(kpi => (
                <div key={kpi.label} className="rounded-lg border border-border bg-card p-4">
                  <div className="text-xs text-muted-foreground">{kpi.label}</div>
                  <div className="text-lg font-semibold text-foreground">{kpi.value}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Achat</h2>
              {achatResults ? <AchatCard data={achatResults as any} /> : <p className="text-sm text-muted-foreground">Données insuffisantes.</p>}
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Location (longue durée)</h2>
              {locationResults ? (
                <LocationCard
                  data={{
                    ...(locationResults as any),
                    input: {
                      price: parsed.price,
                      monthlyRent: parsed.monthlyRent,
                      quartierId: parsed.quartierId,
                      vacancyRate: parsed.vacancyRate,
                      managementFeePct: parsed.managementFeePct,
                      investorType: parsed.investorType,
                      salaried: parsed.salaried,
                      taxYear: parsed.taxYear,
                      portfolioExistingLoansMonthly: parsed.portfolioExistingLoansMonthly,
                    },
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Données insuffisantes.</p>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Airbnb</h2>
              {airbnbResults ? (
                <AirbnbCard
                  data={{
                    ...(airbnbResults as any),
                    input: {
                      investorType: parsed.investorType,
                      salaried: parsed.salaried,
                      taxYear: parsed.taxYear,
                      portfolioExistingLoansMonthly: parsed.portfolioExistingLoansMonthly,
                    },
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Données insuffisantes.</p>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-sm font-semibold text-foreground">Revente (TPI)</h2>
                {parsed.sell === "yes" && (
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground whitespace-nowrap">Durée (ans)</div>
                    <input
                      type="range"
                      min={1}
                      max={40}
                      step={1}
                      value={tpiYearsHeld}
                      onChange={(e) => setTpiYearsHeld(Number(e.target.value))}
                      className="w-28 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-xs font-semibold text-foreground w-8 text-right">{tpiYearsHeld}</div>
                  </div>
                )}
              </div>
              {tpiResults ? (
                <TpiCard data={{ ...(tpiResults as any), input: { salePrice: parsed.salePrice, purchasePrice: parsed.price, yearsHeld: tpiYearsHeld } }} />
              ) : (
                <p className="text-sm text-muted-foreground">Non renseigné.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 mt-8">
            <h2 className="text-sm font-semibold text-foreground">Sources & limites</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Ce simulateur applique des règles paramétrées (année fiscale, abattements, forfaits). En cabinet, ces paramètres doivent être vérifiés selon le dossier et la réglementation en vigueur.
            </p>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/40 p-4">
                <div className="text-xs font-semibold text-foreground mb-2">Références utilisées</div>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    Barème IR (CGI, art. 73) :{" "}
                    <a className="underline hover:text-foreground" href="https://www.fiscamaroc.com/limpot-sur-revenu-29/article-73-taux-de-limpot-110.htm" target="_blank" rel="noreferrer">
                      fiscamaroc.com
                    </a>
                  </li>
                  <li>
                    Profits immobiliers (forfait frais d’acquisition 15%) :{" "}
                    <a className="underline hover:text-foreground" href="https://www.tax.gov.ma/wps/wcm/connect/d9e5cec0-e496-4a12-9925-41f48a54563f/Guide+d%27adh%C3%A9sion+et+de+d%C3%A9p%C3%B4t+de+la+d%C3%A9claration+IR-PF++%281%29+%281%29.pdf?MOD=AJPERES" target="_blank" rel="noreferrer">
                      tax.gov.ma (PDF)
                    </a>
                  </li>
                </ul>
              </div>
              <div className="rounded-lg bg-muted/40 p-4">
                <div className="text-xs font-semibold text-foreground mb-2">Ce que la version actuelle n’inclut pas encore</div>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Déductions spécifiques au salarié (charges de famille, frais pro, CNSS/AMO).</li>
                  <li>Coefficient officiel de réévaluation par année (TPI) paramétré au cas par cas.</li>
                  <li>Taxes locales détaillées par commune (TH/TSC) à partir d’une base cadastrale réelle.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
