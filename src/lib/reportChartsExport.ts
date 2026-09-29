import type jsPDF from 'jspdf';
import type { ChartSpec } from '@/components/reports/ReportCharts';

type RGB = [number, number, number];

const PALETTE: RGB[] = [
  [31, 111, 139],
  [224, 142, 43],
  [76, 159, 112],
  [164, 80, 139],
  [200, 85, 61],
  [108, 117, 125],
  [138, 176, 171],
  [61, 90, 128],
];
const GRID: RGB = [225, 225, 225];
const TEXT: RGB = [40, 40, 40];
const MUTED: RGB = [110, 110, 110];

// Layout em A4 paisagem (297 x 210 mm): 2 colunas x 2 linhas = 4 gráficos por página.
const MARGIN = 14;
const COL_W = 130;
const GAP = 9;
const TOP = 26;
const CELL_H = 86;
const PER_PAGE = 4;

const integer = new Intl.NumberFormat('pt-BR');

function compactBRL(value: number) {
  const abs = Math.abs(value);
  const withUnit = (n: number, suffix: string) => `R$ ${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${suffix}`;
  if (abs >= 1e9) return withUnit(value / 1e9, 'bi');
  if (abs >= 1e6) return withUnit(value / 1e6, 'mi');
  if (abs >= 1e3) return withUnit(value / 1e3, 'mil');
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

const formatUnit = (unit: ChartSpec['unit'], value: number) => (unit === 'count' ? integer.format(value) : compactBRL(value));

function fit(doc: jsPDF, text: string, maxWidth: number) {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && doc.getTextWidth(`${result}...`) > maxWidth) result = result.slice(0, -1);
  return `${result}...`;
}

function setFill(doc: jsPDF, color: RGB) {
  doc.setFillColor(color[0], color[1], color[2]);
}
function setDraw(doc: jsPDF, color: RGB) {
  doc.setDrawColor(color[0], color[1], color[2]);
}
function setText(doc: jsPDF, color: RGB) {
  doc.setTextColor(color[0], color[1], color[2]);
}

/** Barras horizontais (simples ou empilhadas): rótulos à esquerda, valor no fim da barra. */
function drawHorizontalBars(doc: jsPDF, chart: ChartSpec, x: number, y: number, w: number, h: number) {
  const rows = chart.data;
  const stacked = chart.type === 'stacked_bar';
  const labelW = 42;
  const valueW = 24;
  const plotX = x + labelW;
  const plotW = w - labelW - valueW;
  const legendH = chart.series.length > 1 ? 7 : 0;
  const rowH = (h - legendH) / rows.length;
  const barH = Math.min(rowH * 0.65, 6);
  const totals = rows.map((row) => chart.series.reduce((sum, s) => sum + Number(row[s.key] || 0), 0));
  const max = Math.max(...totals, 1);

  if (legendH) {
    let lx = x;
    doc.setFontSize(7);
    chart.series.forEach((s, index) => {
      setFill(doc, PALETTE[index % PALETTE.length]);
      doc.rect(lx, y + 1, 2.5, 2.5, 'F');
      setText(doc, TEXT);
      doc.text(s.label, lx + 4, y + 3.2);
      lx += 8 + doc.getTextWidth(s.label);
    });
  }

  rows.forEach((row, index) => {
    const cy = y + legendH + index * rowH + rowH / 2;
    doc.setFontSize(7);
    setText(doc, TEXT);
    doc.text(fit(doc, String(row[chart.x_key] ?? ''), labelW - 2), x, cy + 1);

    let cursor = plotX;
    chart.series.forEach((s, si) => {
      const value = Number(row[s.key] || 0);
      const width = stacked || chart.series.length === 1 ? (value / max) * plotW : (value / max) * plotW;
      if (width > 0) {
        setFill(doc, PALETTE[si % PALETTE.length]);
        doc.rect(cursor, cy - barH / 2, width, barH, 'F');
        cursor += width;
      }
    });
    setText(doc, MUTED);
    doc.text(formatUnit(chart.unit, totals[index]), cursor + 1.5, cy + 1);
  });
}

/** Rosca com legenda (nome, valor e percentual). */
function drawDonut(doc: jsPDF, chart: ChartSpec, x: number, y: number, w: number, h: number) {
  const values = chart.data.map((item) => Number(item[chart.series[0].key] || 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return;

  const radius = Math.min(h / 2, w * 0.32) - 1;
  const cx = x + radius + 2;
  const cy = y + h / 2;
  let start = -Math.PI / 2;

  doc.setLineWidth(0.3);
  setDraw(doc, [255, 255, 255]);
  values.forEach((value, index) => {
    if (value <= 0) return;
    const angle = (value / total) * Math.PI * 2;
    const steps = Math.max(2, Math.ceil(angle / (Math.PI / 60)));
    const points: [number, number][] = [[cx, cy]];
    for (let step = 0; step <= steps; step += 1) {
      const a = start + (angle * step) / steps;
      points.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)]);
    }
    const relative = points.slice(1).map((point, i) => [point[0] - points[i][0], point[1] - points[i][1]]);
    setFill(doc, PALETTE[index % PALETTE.length]);
    doc.lines(relative, points[0][0], points[0][1], [1, 1], 'FD', true);
    start += angle;
  });
  setFill(doc, [255, 255, 255]);
  doc.circle(cx, cy, radius * 0.55, 'F');

  const legendX = x + radius * 2 + 10;
  const legendW = x + w - legendX;
  const rowH = Math.min(6.5, h / Math.max(values.length, 1));
  const legendTop = cy - (rowH * values.length) / 2;
  doc.setFontSize(7);
  values.forEach((value, index) => {
    const ly = legendTop + index * rowH;
    setFill(doc, PALETTE[index % PALETTE.length]);
    doc.rect(legendX, ly, 2.5, 2.5, 'F');
    setText(doc, TEXT);
    const label = `${chart.data[index][chart.x_key]}: ${formatUnit(chart.unit, value)} (${((value / total) * 100).toFixed(1).replace('.', ',')}%)`;
    doc.text(fit(doc, label, legendW - 4), legendX + 4, ly + 2.2);
  });
}

/** Linha com eixos, grade e rótulos espaçados. */
function drawLine(doc: jsPDF, chart: ChartSpec, x: number, y: number, w: number, h: number) {
  const series = chart.series[0];
  const values = chart.data.map((item) => Number(item[series.key] || 0));
  const padL = 24;
  const padB = 8;
  const padT = 3;
  const padR = 4;
  const px = x + padL;
  const py = y + padT;
  const pw = w - padL - padR;
  const ph = h - padT - padB;
  const max = Math.max(...values, 1) * 1.1;

  doc.setFontSize(7);
  doc.setLineWidth(0.2);
  for (let i = 0; i <= 4; i += 1) {
    const gy = py + ph - (ph * i) / 4;
    setDraw(doc, GRID);
    doc.line(px, gy, px + pw, gy);
    setText(doc, MUTED);
    doc.text(formatUnit(chart.unit, (max * i) / 4), px - 1.5, gy + 1, { align: 'right' });
  }

  const point = (index: number): [number, number] => [
    values.length === 1 ? px + pw / 2 : px + (pw * index) / (values.length - 1),
    py + ph - (values[index] / max) * ph,
  ];

  setDraw(doc, PALETTE[0]);
  doc.setLineWidth(0.6);
  for (let i = 1; i < values.length; i += 1) {
    const [x1, y1] = point(i - 1);
    const [x2, y2] = point(i);
    doc.line(x1, y1, x2, y2);
  }
  setFill(doc, PALETTE[0]);
  values.forEach((_, index) => {
    const [cx, cy] = point(index);
    doc.circle(cx, cy, 0.8, 'F');
  });

  const step = Math.ceil(values.length / 6);
  setText(doc, MUTED);
  chart.data.forEach((item, index) => {
    if (index % step !== 0) return;
    doc.text(String(item[chart.x_key] ?? ''), point(index)[0], py + ph + 5, { align: 'center' });
  });
}

/**
 * Desenha os gráficos em páginas novas do PDF (4 por página, A4 paisagem).
 * Use depois da tabela: drawChartsToPdf(doc, result.charts ?? [], title);
 */
export function drawChartsToPdf(doc: jsPDF, charts: ChartSpec[], title: string) {
  if (!charts.length) return;

  charts.forEach((chart, index) => {
    const slot = index % PER_PAGE;
    if (slot === 0) {
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      setText(doc, TEXT);
      doc.text(`Gráficos - ${title}`, MARGIN, 15);
      doc.setFont('helvetica', 'normal');
    }

    const x = MARGIN + (slot % 2) * (COL_W + GAP);
    const y = TOP + Math.floor(slot / 2) * CELL_H;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setText(doc, TEXT);
    doc.text(fit(doc, chart.title, COL_W), x, y + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setText(doc, MUTED);
    doc.text(fit(doc, chart.description, COL_W), x, y + 7.5);

    const areaY = y + 12;
    const areaH = CELL_H - 16;
    if (chart.type === 'pie') drawDonut(doc, chart, x, areaY, COL_W, areaH);
    else if (chart.type === 'line') drawLine(doc, chart, x, areaY, COL_W, areaH);
    else drawHorizontalBars(doc, chart, x, areaY, COL_W, areaH);
  });

  // devolve o estado padrão do PDF
  doc.setFont('helvetica', 'normal');
  doc.setLineWidth(0.2);
  setText(doc, [0, 0, 0]);
  setDraw(doc, [0, 0, 0]);
}

/** Linhas (array de arrays) para uma aba "Gráficos" no Excel: uma tabela de dados por gráfico. */
export function chartsToSheetRows(charts: ChartSpec[]): (string | number)[][] {
  const rows: (string | number)[][] = [];
  charts.forEach((chart) => {
    rows.push([chart.title]);
    rows.push([chart.description]);
    const firstColumn = chart.type === 'pie' ? 'Categoria' : chart.x_key === 'month' ? 'Mês' : 'Item';
    rows.push([firstColumn, ...chart.series.map((s) => s.label)]);
    chart.data.forEach((item) => {
      rows.push([String(item[chart.x_key] ?? ''), ...chart.series.map((s) => Number(item[s.key] || 0))]);
    });
    rows.push([]);
  });
  return rows;
}
