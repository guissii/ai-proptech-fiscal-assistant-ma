import { describe, it, expect } from 'vitest';
import {
  calculateAchatCosts,
  calculateLocationRevenue,
  calculateAirbnbRevenue,
  calculateDetentionCosts,
  calculateTpi,
  calculateInvestmentScore,
  formatCurrency,
  formatPercent,
} from '../client/src/lib/fiscalEngine';

describe('Fiscal Engine - Achat', () => {
  it('should calculate achat costs correctly for ancien property', () => {
    const result = calculateAchatCosts({
      prix: 1000000,
      surface: 100,
      typeImmobilier: 'ancien',
      dateAcquisition: new Date('2024-01-01'),
      estExonere: false,
    });

    expect(result.prixNet).toBe(1000000);
    expect(result.droitsEnregistrement).toBe(75000); // 7.5% for ancien
    expect(result.coutTotal).toBeGreaterThan(1000000);
    expect(result.quitusFiscalObligatoire).toBe(false);
  });

  it('should apply exoneration for neuf property', () => {
    const result = calculateAchatCosts({
      prix: 1000000,
      surface: 100,
      typeImmobilier: 'neuf',
      dateAcquisition: new Date('2024-01-01'),
      estExonere: true,
    });

    expect(result.droitsEnregistrement).toBe(0); // 0% if exonerated
    expect(result.economieExoneration).toBe(60000); // 6% savings
  });

  it('should mark quitus fiscal as obligatory for recent purchases', () => {
    const result = calculateAchatCosts({
      prix: 1000000,
      surface: 100,
      typeImmobilier: 'ancien',
      dateAcquisition: new Date('2024-08-01'),
      estExonere: false,
    });

    expect(result.quitusFiscalObligatoire).toBe(true);
  });
});

describe('Fiscal Engine - Location', () => {
  it('should calculate location revenue correctly', () => {
    const result = calculateLocationRevenue({
      prixAcquisition: 1000000,
      loyer: 5000,
      dureeDetention: 10,
      typeImmobilier: 'non-meuble',
      depensesAnnuelles: 0,
    });

    expect(result.revenuBrut).toBe(60000); // 5000 * 12
    expect(result.rendementBrut).toBe(6); // 60000 / 1000000 * 100
    expect(result.revenuNet).toBeLessThan(result.revenuBrut);
  });

  it('should calculate IR on rental income', () => {
    const result = calculateLocationRevenue({
      prixAcquisition: 1000000,
      loyer: 10000,
      dureeDetention: 10,
      typeImmobilier: 'non-meuble',
      depensesAnnuelles: 0,
    });

    expect(result.irAnnuel).toBeGreaterThan(0);
    expect(result.chargesFiscales).toBeGreaterThan(0);
  });
});

describe('Fiscal Engine - Airbnb', () => {
  it('should calculate airbnb revenue with commissions', () => {
    const result = calculateAirbnbRevenue({
      prixAcquisition: 1000000,
      loyerNuit: 350,
      tauxOccupation: 0.7,
      tauxCommissionAirbnb: 0.03,
      tauxTaxesSejour: 0.02,
      depensesAnnuelles: 0,
    });

    expect(result.revenuBrutAnnuel).toBeGreaterThan(0);
    expect(result.commissionsAirbnb).toBeGreaterThan(0);
    expect(result.taxesSejour).toBeGreaterThan(0);
    expect(result.revenuNetAnnuel).toBeLessThan(result.revenuBrutAnnuel);
  });

  it('should calculate monthly net revenue', () => {
    const result = calculateAirbnbRevenue({
      prixAcquisition: 1000000,
      loyerNuit: 350,
      tauxOccupation: 0.7,
      tauxCommissionAirbnb: 0.03,
      tauxTaxesSejour: 0.02,
      depensesAnnuelles: 0,
    });

    expect(result.revenuNetMensuel).toBe(result.revenuNetAnnuel / 12);
  });
});

describe('Fiscal Engine - Detention', () => {
  it('should calculate detention costs', () => {
    const result = calculateDetentionCosts({
      prixAcquisition: 1000000,
      surface: 100,
      valeurLocative: 5000,
      dureeAnnees: 10,
      typeOccupation: 'propre',
    });

    expect(result.chargesAnnuelles).toBeGreaterThan(0);
    expect(result.chargesCumulees).toBe(result.chargesAnnuelles * 10);
  });

  it('should project appreciation over time', () => {
    const result = calculateDetentionCosts({
      prixAcquisition: 1000000,
      surface: 100,
      valeurLocative: 5000,
      dureeAnnees: 10,
      typeOccupation: 'propre',
    });

    expect(result.plusValueProjetee).toBeGreaterThan(0);
    expect(result.gainNetReel).toBeGreaterThan(0);
  });
});

describe('Fiscal Engine - TPI', () => {
  it('should calculate TPI for standard scenario', () => {
    const result = calculateTpi({
      prixVente: 1000000,
      prixAcquisition: 800000,
      dureeDetention: 5,
      typeImmobilier: 'ancien',
      travaux: 0,
      isResidencePrincipale: false,
    });

    expect(result.scenarios.length).toBeGreaterThan(0);
    expect(result.scenarioOptimal).toBeDefined();
    expect(result.economieMax).toBeGreaterThanOrEqual(0);
  });

  it('should provide multiple scenarios', () => {
    const result = calculateTpi({
      prixVente: 1000000,
      prixAcquisition: 800000,
      dureeDetention: 5,
      typeImmobilier: 'ancien',
      travaux: 0,
      isResidencePrincipale: false,
    });

    expect(result.scenarios.length).toBeGreaterThanOrEqual(3);
    result.scenarios.forEach(scenario => {
      expect(scenario.name).toBeDefined();
      expect(scenario.montantTpi).toBeGreaterThanOrEqual(0);
      expect(scenario.netVendeur).toBeGreaterThan(0);
    });
  });
});

describe('Fiscal Engine - Investment Score', () => {
  it('should calculate investment score', () => {
    const score = calculateInvestmentScore(
      8500, // pricePerM2
      8500, // avgPricePerM2
      5, // grossYield
      6.5, // annualAppreciation
      5 // vacancyRate
    );

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should give higher scores for better investments', () => {
    const goodScore = calculateInvestmentScore(
      7000, // lower price
      8500,
      6, // higher yield
      7, // higher appreciation
      3 // lower vacancy
    );

    const poorScore = calculateInvestmentScore(
      12000, // higher price
      8500,
      3, // lower yield
      4, // lower appreciation
      10 // higher vacancy
    );

    expect(goodScore).toBeGreaterThan(poorScore);
  });
});

describe('Fiscal Engine - Formatting', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(1000000)).toContain('1');
    expect(formatCurrency(0)).toContain('0');
    expect(formatCurrency(1234567)).toMatch(/MAD|DH/);
  });

  it('should format percent correctly', () => {
    const result = formatPercent(0.05, 1);
    expect(result).toContain('%');
    expect(result).toContain('5');
  });
});
