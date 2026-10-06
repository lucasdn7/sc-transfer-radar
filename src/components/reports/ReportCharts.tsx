import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** Formato devolvido pela edge function `generate-report` em `charts`. */
export type ChartSpec = {
  id: string;
  title: string;
  description: string;
  type: "bar" | "stacked_bar" | "pie" | "line";
  unit: "currency" | "count";
  x_key: string;
  series: { key: string; label: string }[];
  data: Record<string, string | number>[];
};

const PALETTE = ["#1f6f8b", "#e08e2b", "#4c9f70", "#a4508b", "#c8553d", "#6c757d", "#8ab0ab", "#3d5a80"];

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brlCompact = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("pt-BR");

function formatter(unit: ChartSpec["unit"], compact = false) {
  return (value: number | string) => {
    const n = Number(value);
    if (unit === "count") return integer.format(n);
    return compact ? brlCompact.format(n) : brl.format(n);
  };
}

function shorten(label: string, max = 14) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function ChartBody({ chart }: { chart: ChartSpec }) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const full = formatter(chart.unit);
  const axis = formatter(chart.unit, true);
  const chartHeight = isMobile ? 220 : 280;

  if (chart.type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie data={chart.data} dataKey="value" nameKey={chart.x_key} innerRadius={55} outerRadius={95} paddingAngle={2}>
            {chart.data.map((_, index) => (
              <Cell key={index} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => full(value)} />
          <Legend verticalAlign="bottom" iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "line") {
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={chart.data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={chart.x_key} tick={{ fontSize: 12 }} minTickGap={16} />
          <YAxis tickFormatter={axis} tick={{ fontSize: 12 }} width={64} />
          <Tooltip formatter={(value: number) => full(value)} />
          {chart.series.map((s, index) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={PALETTE[index % PALETTE.length]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  const stacked = chart.type === "stacked_bar";
  return (
    <ResponsiveContainer width="100%" height={isMobile ? 240 : 300}>
      <BarChart data={chart.data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={chart.x_key} tickFormatter={(v: string) => shorten(String(v))} tick={{ fontSize: 12 }} interval={0} angle={-25} textAnchor="end" height={60} />
        <YAxis tickFormatter={axis} tick={{ fontSize: 12 }} width={64} />
        <Tooltip formatter={(value: number) => full(value)} />
        {chart.series.length > 1 && <Legend />}
        {chart.series.map((s, index) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} stackId={stacked ? "total" : undefined} fill={PALETTE[index % PALETTE.length]} radius={stacked ? 0 : [3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Uso:
 *   <ReportCharts charts={report.charts} />
 * onde `report` é a resposta JSON de `generate-report`.
 */
export default function ReportCharts({ charts }: { charts?: ChartSpec[] }) {
  if (!charts || charts.length === 0) return null;

  return (
    <section aria-label="Gráficos do relatório" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))" }}>
      {charts.map((chart) => (
        <figure key={chart.id} style={{ margin: 0, padding: 16, border: "1px solid rgba(128,128,128,0.25)", borderRadius: 8 }}>
          <figcaption style={{ marginBottom: 12 }}>
            <strong style={{ display: "block", fontSize: 15 }}>{chart.title}</strong>
            <span style={{ fontSize: 13, opacity: 0.7 }}>{chart.description}</span>
          </figcaption>
          <ChartBody chart={chart} />
        </figure>
      ))}
    </section>
  );
}
