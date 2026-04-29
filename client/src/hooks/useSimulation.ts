import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useCity } from '@/contexts/CityContext';
import { calculateAchatCosts, calculateLocationRevenue, calculateAirbnbRevenue, calculateTpi, calculateDetentionCosts } from '@/lib/fiscalEngine';
import { getDemoSessionId } from '@/lib/demoSession';

export type SimulationType = 'achat' | 'location' | 'airbnb' | 'detention' | 'tpi';

export interface SimulationResult {
  type: SimulationType;
  city: string;
  quartier?: string;
  inputData: Record<string, unknown>;
  results: Record<string, unknown>;
  timestamp: Date;
}

export interface UseSimulationReturn {
  result: SimulationResult | null;
  isLoading: boolean;
  error: string | null;
  runSimulation: (
    type: SimulationType,
    inputData: Record<string, unknown>,
    quartier?: string
  ) => Promise<void>;
  clearResult: () => void;
}

export function useSimulation(conversationId: string | null): UseSimulationReturn {
  const { activeCity } = useCity();
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSimulationMutation = trpc.simulations.createSimulation.useMutation();

  const runSimulation = useCallback(
    async (type: SimulationType, inputData: Record<string, unknown>, quartier?: string) => {
      if (!conversationId) {
        setError('Aucune conversation active');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        let results: Record<string, unknown> = {};

        // Calculer les résultats selon le type de simulation
        switch (type) {
          case 'achat': {
            const price = (inputData.price as number) || 1000000;
            const surface = (inputData.surface as number) || 100;
            const achatResults = calculateAchatCosts({
              prix: price,
              surface,
              typeImmobilier: (inputData.typeImmobilier as any) || 'ancien',
              dateAcquisition: new Date(),
              estExonere: false,
            });
            results = achatResults as unknown as Record<string, unknown>;
            break;
          }
          case 'location': {
            const price = (inputData.price as number) || 1000000;
            const monthlyRent = (inputData.monthlyRent as number) || 5000;
            const locationResults = calculateLocationRevenue({
              prixAcquisition: price,
              loyer: monthlyRent,
              dureeDetention: 10,
              typeImmobilier: 'non-meuble',
              depensesAnnuelles: 0,
            });
            results = locationResults as unknown as Record<string, unknown>;
            break;
          }
          case 'airbnb': {
            const price = (inputData.price as number) || 1000000;
            const nightlyRate = (inputData.nightlyRate as number) || 350;
            const occupancyRate = (inputData.occupancyRate as number) || 70;
            const airbnbResults = calculateAirbnbRevenue({
              prixAcquisition: price,
              loyerNuit: nightlyRate,
              tauxOccupation: occupancyRate,
              tauxCommissionAirbnb: 0.03,
              tauxTaxesSejour: 0.02,
              depensesAnnuelles: 0,
            });
            results = airbnbResults as unknown as Record<string, unknown>;
            break;
          }
          case 'tpi': {
            const salePrice = (inputData.salePrice as number) || 1000000;
            const purchasePrice = (inputData.purchasePrice as number) || 800000;
            const yearsHeld = (inputData.yearsHeld as number) || 5;
            const tpiResults = calculateTpi({
              prixVente: salePrice,
              prixAcquisition: purchasePrice,
              dureeDetention: yearsHeld,
              typeImmobilier: 'ancien',
              travaux: 0,
              isResidencePrincipale: false,
            });
            results = tpiResults as unknown as Record<string, unknown>;
            break;
          }
          case 'detention': {
            const price = (inputData.price as number) || 1000000;
            const yearsHeld = (inputData.yearsHeld as number) || 10;
            const detentionResults = calculateDetentionCosts({
              prixAcquisition: price,
              surface: 100,
              valeurLocative: 5000,
              dureeAnnees: yearsHeld,
              typeOccupation: 'propre',
            });
            results = { ...detentionResults } as Record<string, unknown>;
            break;
          }
        }

        const simulationResult: SimulationResult = {
          type,
          city: activeCity,
          quartier,
          inputData,
          results,
          timestamp: new Date(),
        };

        setResult(simulationResult);

        // Sauvegarder la simulation en base de données
        if (conversationId) {
          await createSimulationMutation.mutateAsync({
            conversationId,
            type,
            city: activeCity as 'fes' | 'rabat' | 'casa',
            quartier,
            inputData,
            results,
            sessionId: getDemoSessionId(),
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la simulation';
        setError(errorMessage);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, activeCity, createSimulationMutation]
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    isLoading,
    error,
    runSimulation,
    clearResult,
  };
}
