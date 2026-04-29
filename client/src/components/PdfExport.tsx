import React from 'react';
import jsPDF from 'jspdf';
import { formatCurrency, formatPercent } from '@/lib/fiscalEngine';

interface PdfExportProps {
  flowType: string;
  city: string;
  quartier?: string;
  data: Record<string, unknown>;
  userEmail?: string;
}

export function generatePdf(props: PdfExportProps) {
  const { flowType, city, quartier, data, userEmail } = props;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Couleurs par ville
  const cityColors: Record<string, [number, number, number]> = {
    fes: [196, 83, 42],
    rabat: [27, 79, 138],
    casa: [107, 63, 160],
  };

  const cityColor = cityColors[city] || [27, 79, 138];
  const cityLabel: Record<string, string> = {
    fes: 'Fès',
    rabat: 'Rabat',
    casa: 'Casablanca',
  };

  // Page 1 - Couverture
  doc.setFillColor(...cityColor);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(48);
  doc.text('Aqar.ma', margin, 60, { align: 'left' });

  doc.setFontSize(20);
  doc.text('Rapport de Simulation', margin, 100, { align: 'left' });

  doc.setFontSize(12);
  doc.text(`Type : ${flowType}`, margin, 130, { align: 'left' });
  doc.text(`Ville : ${cityLabel[city]}`, margin, 145, { align: 'left' });
  if (quartier) {
    doc.text(`Quartier : ${quartier}`, margin, 160, { align: 'left' });
  }

  doc.setFontSize(10);
  const now = new Date();
  doc.text(`Généré le : ${now.toLocaleDateString('fr-FR')}`, margin, pageHeight - 30, { align: 'left' });
  if (userEmail) {
    doc.text(`Utilisateur : ${userEmail}`, margin, pageHeight - 20, { align: 'left' });
  }

  // Page 2 - Résumé
  doc.addPage();
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text('Résumé de la Simulation', margin, 20);

  doc.setFontSize(11);
  doc.setTextColor(...cityColor);
  doc.text(`Type de simulation : ${flowType}`, margin, 40);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  let yPos = 55;

  // Afficher les données selon le type de flux
  const dataEntries = Object.entries(data);
  for (const [key, value] of dataEntries.slice(0, 8)) {
    const label = key.replace(/([A-Z])/g, ' $1').trim();
    const displayValue =
      typeof value === 'number'
        ? value > 1000
          ? formatCurrency(value)
          : formatPercent(value / 100, 1)
        : String(value);

    doc.text(`${label} :`, margin, yPos);
    doc.text(displayValue, margin + 80, yPos);
    yPos += 8;

    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }
  }

  // Page 3 - Graphiques et détails
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Détails Complets', margin, 20);

  doc.setFontSize(11);
  doc.setTextColor(...cityColor);
  doc.text('Calculs Détaillés', margin, 40);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  yPos = 55;

  const detailsText = [
    'Ce rapport présente les résultats de votre simulation immobilière.',
    'Les calculs sont basés sur les données fiscales marocaines à jour.',
    'Tous les montants sont exprimés en Dirhams Marocains (DH).',
    '',
    'Recommandations :',
    '• Consultez un expert fiscal pour valider ces résultats',
    '• Les conditions du marché peuvent varier',
    '• Vérifiez les conditions de financement auprès de votre banque',
  ];

  for (const line of detailsText) {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(line, margin, yPos);
    yPos += 8;
  }

  // Page 4 - Conclusion
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Conclusion', margin, 20);

  doc.setFontSize(11);
  doc.setTextColor(...cityColor);
  doc.text('Analyse de l\'Investissement', margin, 40);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  yPos = 55;

  const conclusionText = [
    'Synthèse de votre simulation :',
    '',
    'Cette analyse vous aide à prendre une décision éclairée concernant',
    'votre investissement immobilier au Maroc.',
    '',
    'Points clés à retenir :',
    '1. Évaluez le potentiel de rendement',
    '2. Comprenez les implications fiscales',
    '3. Planifiez votre stratégie d\'investissement',
    '',
    'Disclaimer légal :',
    'Ce rapport est fourni à titre informatif. Les calculs sont basés sur',
    'les données disponibles et peuvent être sujets à modification.',
    'Consultez un professionnel avant de prendre une décision.',
  ];

  for (const line of conclusionText) {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(line, margin, yPos);
    yPos += 7;
  }

  // Télécharger le PDF
  const fileName = `Aqar-${cityLabel[city]}-${flowType}-${now.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

interface PdfExportButtonProps {
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
      📥 Exporter PDF
    </button>
  );
}
