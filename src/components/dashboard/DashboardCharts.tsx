import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280", "#ef4444"];

const METRICS = [
  { key: "valor_concedente", label: "Valor Concedente" },
  { key: "valor_contrapartida", label: "Valor de Contrapartida" },
  { key: "num_processos", label: "Número de Processos" },
];

const GROUPS = [
  { key: "municipio", label: "Município" },
  { key: "nucleo", label: "Núcleo Regional" },
];

const CHART_TYPES = [
  { key: "bar", label: "Barras" },
  { key: "line", label: "Linhas" },
  { key: "pie", label: "Pizza" },
];

export function DashboardCharts() {
  const { metricsData, isLoading } = useDashboardMetrics();
  const [metric, setMetric] = useState("valor_concedente");
  const [group, setGroup] = useState("municipio");
  const [chartType, setChartType] = useState("bar");

  // Prepara os dados para os gráficos conforme seleção
  const chartData = useMemo(() => {
    if (!metricsData || isLoading) return [];
    let data = [];
    if (group === "municipio") {
      if (metric === "valor_concedente") {
        data = metricsData.valor_concedente_por_municipio || [];
      } else if (metric === "valor_contrapartida") {
        data = metricsData.valor_contrapartida_por_municipio || [];
      } else if (metric === "num_processos") {
        data = metricsData.num_processos_por_municipio || [];
      }
    } else if (group === "nucleo") {
      if (metric === "valor_concedente") {
        data = metricsData.valor_concedente_por_nucleo || [];
      } else if (metric === "valor_contrapartida") {
        data = metricsData.valor_contrapartida_por_nucleo || [];
      } else if (metric === "num_processos") {
        data = metricsData.num_processos_por_nucleo || [];
      }
    }
    return data;
  }, [metricsData, metric, group, isLoading]);

  const metricLabel = METRICS.find(m => m.key === metric)?.label || "";
  const groupLabel = GROUPS.find(g => g.key === group)?.label || "";

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CardTitle className="text-lg font-semibold">{metricLabel} por {groupLabel}</CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRICS.map(m => (
                <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GROUPS.map(g => (
                <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHART_TYPES.map(t => (
                <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        ) : (
          <div className="w-full h-[350px]">
            <ChartRenderer type={chartType} data={chartData} metricLabel={metricLabel} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartRenderer({ type, data, metricLabel }: { type: string; data: any[]; metricLabel: string }) {
  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString('pt-BR') : value, metricLabel]} />
          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name={metricLabel} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString('pt-BR') : value, metricLabel]} />
          <Line type="monotone" dataKey="value" stroke="#10b981" name={metricLabel} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString('pt-BR') : value, metricLabel]} />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  return null;
} 