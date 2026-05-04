/**
 * PDF Report Visual Helpers — Premium design utilities for jsPDF
 */
import jsPDF from 'jspdf';

// ── Color Palettes by City ──
export const CITY_PALETTES: Record<string, { primary: number[]; secondary: number[]; accent: number[]; light: number[] }> = {
  fes: { primary: [139, 69, 19], secondary: [196, 83, 42], accent: [218, 165, 32], light: [255, 248, 240] },
  rabat: { primary: [20, 60, 120], secondary: [27, 79, 138], accent: [41, 128, 185], light: [237, 246, 255] },
  casa: { primary: [75, 40, 130], secondary: [107, 63, 160], accent: [142, 68, 173], light: [245, 240, 255] },
};

export const CITY_LABELS: Record<string, string> = { fes: 'Fès', rabat: 'Rabat', casa: 'Casablanca' };

// ── Layout Constants ──
export const M = 18; // margin
export const PW = 210; // A4 width
export const PH = 297; // A4 height
export const CW = PW - 2 * M; // content width

// ── Drawing Primitives ──

export function drawRoundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, style: 'F' | 'S' | 'FD' = 'F') {
  doc.roundedRect(x, y, w, h, r, r, style);
}

export function pageFooter(doc: jsPDF, pageNum: number, totalPages: number, date: string) {
  const y = PH - 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(M, y - 3, PW - M, y - 3);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Aqar.ma — Rapport de simulation immobilière', M, y);
  doc.text(date, PW / 2, y, { align: 'center' });
  doc.text(`Page ${pageNum} / ${totalPages}`, PW - M, y, { align: 'right' });
}

export function sectionHeader(doc: jsPDF, title: string, y: number, color: number[]): number {
  doc.setFillColor(color[0], color[1], color[2]);
  drawRoundedRect(doc, M, y, CW, 10, 2, 'F');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(title, M + 5, y + 7);
  return y + 14;
}

export function subSection(doc: jsPDF, title: string, y: number, color: number[]): number {
  doc.setFontSize(11);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(title, M, y);
  y += 1.5;
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.4);
  doc.line(M, y, M + doc.getTextWidth(title) + 2, y);
  doc.setLineWidth(0.2);
  return y + 5;
}

export function kvRow(doc: jsPDF, label: string, value: string, y: number, labelW = 68): number {
  doc.setFontSize(9.5);
  doc.setTextColor(100, 100, 100);
  doc.text(label, M + 2, y);
  doc.setTextColor(30, 30, 30);
  const lines = doc.splitTextToSize(value, CW - labelW - 4);
  for (const line of lines) {
    doc.text(String(line), M + labelW, y);
    y += 5;
  }
  return y;
}

export function infoBox(doc: jsPDF, text: string, y: number, bgColor: number[] = [237, 246, 255], borderColor: number[] = [180, 210, 240]): number {
  const lines = doc.splitTextToSize(text, CW - 14) as string[];
  const h = lines.length * 4.5 + 8;
  doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  drawRoundedRect(doc, M, y, CW, h, 3, 'FD');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  let ty = y + 5;
  for (const line of lines) {
    doc.text(String(line), M + 7, ty);
    ty += 4.5;
  }
  return y + h + 3;
}

export function warningBox(doc: jsPDF, title: string, text: string, y: number): number {
  const lines = doc.splitTextToSize(text, CW - 14) as string[];
  const h = lines.length * 4.5 + 14;
  doc.setFillColor(255, 248, 230);
  doc.setDrawColor(243, 156, 18);
  drawRoundedRect(doc, M, y, CW, h, 3, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(180, 100, 0);
  doc.text(title, M + 7, y + 6);
  doc.setFontSize(8.5);
  doc.setTextColor(80, 60, 20);
  let ty = y + 12;
  for (const line of lines) {
    doc.text(String(line), M + 7, ty);
    ty += 4.5;
  }
  return y + h + 3;
}

// ── Table Drawing ──
export interface TableRow { cells: string[]; bold?: boolean; highlight?: boolean }
export interface TableCol { label: string; width: number; align?: 'left' | 'right' | 'center' }

export function drawTable(doc: jsPDF, cols: TableCol[], rows: TableRow[], y: number, color: number[]): number {
  const rowH = 7;
  const headerH = 8;
  const x0 = M;

  // Header
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x0, y, CW, headerH, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  let cx = x0;
  for (const col of cols) {
    const align = col.align ?? 'left';
    const tx = align === 'right' ? cx + col.width - 3 : align === 'center' ? cx + col.width / 2 : cx + 3;
    doc.text(col.label, tx, y + 5.5, { align });
    cx += col.width;
  }
  y += headerH;

  // Rows
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.highlight) {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(x0, y, CW, rowH, 'F');
      doc.setTextColor(255, 255, 255);
    } else {
      const bg = i % 2 === 0 ? [250, 250, 252] : [255, 255, 255];
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(x0, y, CW, rowH, 'F');
      doc.setTextColor(40, 40, 40);
    }

    doc.setFontSize(row.bold ? 9 : 8.5);
    cx = x0;
    for (let j = 0; j < cols.length; j++) {
      const col = cols[j];
      const text = row.cells[j] ?? '';
      const align = col.align ?? 'left';
      const tx = align === 'right' ? cx + col.width - 3 : align === 'center' ? cx + col.width / 2 : cx + 3;
      doc.text(text, tx, y + 5, { align });
      cx += col.width;
    }
    // Border
    doc.setDrawColor(230, 230, 230);
    doc.line(x0, y + rowH, x0 + CW, y + rowH);
    y += rowH;
  }
  // Outer border
  doc.setDrawColor(200, 200, 200);
  doc.rect(x0, y - rows.length * rowH - headerH, CW, rows.length * rowH + headerH, 'S');
  return y + 3;
}

// ── Horizontal Bar Chart ──
export function drawBarChart(doc: jsPDF, items: { label: string; value: number }[], y: number, color: number[], unit: 'MAD' | '%' = 'MAD', fmtFn?: (v: number) => string): number {
  const max = Math.max(...items.map(it => it.value), 1);
  const barH = 6;
  const gap = 4;
  const labelW = 42;
  const valueW = 30;
  const barW = CW - labelW - valueW;

  for (const it of items) {
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text(it.label, M, y + 4);

    // Track
    doc.setFillColor(235, 235, 240);
    drawRoundedRect(doc, M + labelW, y, barW, barH, 2, 'F');

    // Fill
    const w = Math.max(2, (it.value / max) * barW);
    doc.setFillColor(color[0], color[1], color[2]);
    drawRoundedRect(doc, M + labelW, y, w, barH, 2, 'F');

    // Value
    const txt = fmtFn ? fmtFn(it.value) : unit === '%' ? `${it.value.toFixed(1)}%` : `${Math.round(it.value).toLocaleString('fr-FR')} MAD`;
    doc.setTextColor(30, 30, 30);
    doc.text(txt, M + labelW + barW + 3, y + 4.5);

    y += barH + gap;
  }
  return y + 2;
}

// ── KPI Card ──
export function drawKpiCard(doc: jsPDF, label: string, value: string, x: number, y: number, w: number, color: number[]): number {
  const h = 18;
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(220, 220, 225);
  drawRoundedRect(doc, x, y, w, h, 3, 'FD');
  // Top color bar
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x, y, w, 2.5, 'F');
  // Label
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(label, x + 4, y + 8);
  // Value
  doc.setFontSize(11);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(value, x + 4, y + 14.5);
  return y + h + 3;
}

// ── Flow Step ──
export function drawFlowStep(doc: jsPDF, label: string, value: string, note: string, x: number, y: number, w: number, color: number[], valueColor?: number[]): number {
  const h = 22;
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(220, 220, 225);
  drawRoundedRect(doc, x, y, w, h, 3, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(label.toUpperCase(), x + 3, y + 5.5);
  doc.setFontSize(10);
  const vc = valueColor ?? color;
  doc.setTextColor(vc[0], vc[1], vc[2]);
  doc.text(value, x + 3, y + 12);
  doc.setFontSize(6.5);
  doc.setTextColor(150, 150, 150);
  const lines = doc.splitTextToSize(note, w - 6) as string[];
  doc.text(lines[0] ?? '', x + 3, y + 17);
  return y + h + 2;
}

// ── Flow Arrow ──
export function drawFlowArrow(doc: jsPDF, x: number, y: number) {
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(14);
  doc.text('→', x, y + 10);
}

// ── Bullet Point ──
export function drawBullet(doc: jsPDF, title: string, subtitle: string, y: number, color: number[]): number {
  // Checkmark circle
  doc.setFillColor(235, 255, 242);
  doc.setDrawColor(180, 230, 200);
  doc.circle(M + 4, y + 2.5, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(46, 204, 113);
  doc.text('✓', M + 2.3, y + 4);
  // Text
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  doc.text(title, M + 10, y + 3.5);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const lines = doc.splitTextToSize(subtitle, CW - 14) as string[];
  let ty = y + 8;
  for (const l of lines) { doc.text(String(l), M + 10, ty); ty += 4; }
  return ty + 1;
}
