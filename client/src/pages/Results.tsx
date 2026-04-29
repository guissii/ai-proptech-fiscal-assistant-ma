import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import AchatCard from "@/components/results/AchatCard";
import AirbnbCard from "@/components/results/AirbnbCard";
import LocationCard from "@/components/results/LocationCard";
import TpiCard from "@/components/results/TpiCard";
import { getQuartierById } from "@/data/quartiers";
import {
  calculateAchatCosts,
  calculateAirbnbRevenue,
  calculateLocationRevenue,
  calculateTpi,
  formatCurrency,
} from "@/lib/fiscalEngine";

type ResultsInput = {
  city?: "fes" | "rabat" | "casa";
  language?: "fr" | "ar" | "en";
  salaried?: string;
  price?: number;
  surface?: number;
  quartierId?: string;
  monthlyRent?: number;
  nightlyRate?: number;
  occupancyRate?: number;
  sell?: string;
  salePrice?: number;
  yearsHeld?: number;
};

function readResultsInput(): ResultsInput | null {
  try {
    const raw = localStorage.getItem("aqar.demo.resultsInput");
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

    return {
      city: input?.city,
      language: input?.language,
      salaried,
      sell,
      price,
      surface,
      quartierId,
      monthlyRent,
      nightlyRate,
      occupancyRate,
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
      typeImmobilier: "ancien",
      dateAcquisition: new Date(),
      estExonere: false,
    });
  }, [parsed.price, parsed.surface]);

  const locationResults = useMemo(() => {
    if (!parsed.price || !parsed.monthlyRent) return null;
    return calculateLocationRevenue({
      prixAcquisition: parsed.price,
      loyer: parsed.monthlyRent,
      dureeDetention: 10,
      typeImmobilier: "non-meuble",
      depensesAnnuelles: 0,
    });
  }, [parsed.monthlyRent, parsed.price]);

  const airbnbResults = useMemo(() => {
    if (!parsed.price || !parsed.nightlyRate || !parsed.occupancyRate) return null;
    return calculateAirbnbRevenue({
      prixAcquisition: parsed.price,
      loyerNuit: parsed.nightlyRate,
      tauxOccupation: parsed.occupancyRate,
      tauxCommissionAirbnb: 0.03,
      tauxTaxesSejour: 0.02,
      depensesAnnuelles: 0,
    });
  }, [parsed.nightlyRate, parsed.occupancyRate, parsed.price]);

  const tpiResults = useMemo(() => {
    if (parsed.sell !== "yes") return null;
    if (!parsed.price || !parsed.salePrice) return null;
    return calculateTpi({
      prixVente: parsed.salePrice,
      prixAcquisition: parsed.price,
      dureeDetention: tpiYearsHeld,
      typeImmobilier: "ancien",
      travaux: 0,
      isResidencePrincipale: false,
    });
  }, [parsed.price, parsed.salePrice, parsed.sell, tpiYearsHeld]);

  const headerKpis = useMemo(() => {
    const kpis: Array<{ label: string; value: string }> = [];
    if (locationResults) {
      kpis.push({ label: "Brut annuel (Location)", value: formatCurrency(locationResults.revenuBrut) });
      kpis.push({ label: "IR annuel (Location)", value: formatCurrency(locationResults.irAnnuel) });
      kpis.push({ label: "Net annuel (Location)", value: formatCurrency(locationResults.revenuNet) });
    }
    if (airbnbResults) {
      kpis.push({ label: "Brut annuel (Airbnb)", value: formatCurrency(airbnbResults.revenuBrutAnnuel) });
      kpis.push({ label: "Net annuel (Airbnb)", value: formatCurrency(airbnbResults.revenuNetAnnuel) });
    }
    if (tpiResults) {
      kpis.push({ label: "Économie max (TPI)", value: formatCurrency(tpiResults.economieMax) });
    }
    return kpis;
  }, [airbnbResults, locationResults, tpiResults]);

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
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
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
              {parsed.salaried ? ` • Salarié: ${parsed.salaried === "yes" ? "Oui" : "Non"}` : ""}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
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

        <div className="flex-1 overflow-y-auto p-8">
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
                <LocationCard data={{ ...(locationResults as any), input: { price: parsed.price, monthlyRent: parsed.monthlyRent, quartierId: parsed.quartierId } }} />
              ) : (
                <p className="text-sm text-muted-foreground">Données insuffisantes.</p>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Airbnb</h2>
              {airbnbResults ? <AirbnbCard data={airbnbResults as any} /> : <p className="text-sm text-muted-foreground">Données insuffisantes.</p>}
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
        </div>
      </div>
    </div>
  );
}
