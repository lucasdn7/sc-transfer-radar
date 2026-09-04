import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { Download, FileText, RefreshCw, BarChart3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

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

export default function Charts() {
  const { metricsData, isLoading, valoresPagosPorMes, valoresPagosPorAno, valoresEmpilhadosPorMunicipio, valoresEmpilhadosPorNucleo } = useDashboardMetrics(false);
  const [metric, setMetric] = useState("valor_concedente");
  const [group, setGroup] = useState("municipio");
  const [chartType, setChartType] = useState("bar");

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
    <div className="space-y-6" role="main" aria-label="Gráficos e visualizações de dados">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Gráficos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gráficos</h1>
          <p className="text-muted-foreground">
            Visualização de dados e tendências
          </p>
        </div>
      </div>

      {/* Gráfico Principal Personalizável */}
      <section aria-labelledby="grafico-principal">
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg font-semibold" id="grafico-principal">{metricLabel} por {groupLabel}</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Select value={metric} onValueChange={setMetric} aria-label="Selecionar métrica">
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRICS.map(m => (
                    <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={group} onValueChange={setGroup} aria-label="Selecionar agrupamento">
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUPS.map(g => (
                    <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={chartType} onValueChange={setChartType} aria-label="Selecionar tipo de gráfico">
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
              <div className="h-64 flex items-center justify-center" role="status" aria-live="polite" aria-label="Carregando gráfico">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="w-full h-[350px]" role="img" aria-label={`Gráfico de ${metricLabel} por ${groupLabel}`}>
                <ChartRenderer type={chartType} data={chartData} metricLabel={metricLabel} />
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Gráfico de valores pagos por mês */}
      <section aria-labelledby="grafico-mes">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold" id="grafico-mes">Valores Pagos por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center" role="status" aria-live="polite">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="w-full h-[350px]" role="img" aria-label="Gráfico de valores pagos por mês">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valoresPagosPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [typeof value === 'number' ? value.toLocaleString('pt-BR') : value, 'Valor']} />
                    <Bar dataKey="value" fill="#3b82f6" name="Valor Pago" />
                    <Line type="monotone" dataKey="value" stroke="#10b981" name="Valor Pago" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Gráfico de valores pagos por ano */}
      <section aria-labelledby="grafico-ano">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold" id="grafico-ano">Valores Pagos por Ano</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center" role="status" aria-live="polite">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="w-full h-[350px]" role="img" aria-label="Gráfico de valores pagos por ano">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valoresPagosPorAno}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [typeof value === 'number' ? value.toLocaleString('pt-BR') : value, 'Valor']} />
                    <Bar dataKey="value" fill="#3b82f6" name="Valor Pago" />
                    <Line type="monotone" dataKey="value" stroke="#10b981" name="Valor Pago" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Gráfico empilhado por município */}
      <section aria-labelledby="grafico-municipio">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold" id="grafico-municipio">Valores Repassados e a Repassar por Município</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center" role="status" aria-live="polite">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="w-full h-[350px]" role="img" aria-label="Gráfico empilhado de valores repassados e a repassar por município">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valoresEmpilhadosPorMunicipio} stackOffset="none">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [typeof value === 'number' ? value.toLocaleString('pt-BR') : value, name === 'repassado' ? 'Repassado' : 'A Repassar']} />
                    <Bar dataKey="repassado" stackId="a" fill="#2563eb" name="Repassado" />
                    <Bar dataKey="aRepassar" stackId="a" fill="#93c5fd" name="A Repassar" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Gráfico empilhado por núcleo */}
      <section aria-labelledby="grafico-nucleo">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold" id="grafico-nucleo">Valores Repassados e a Repassar por Núcleo Regional</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center" role="status" aria-live="polite">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="w-full h-[350px]" role="img" aria-label="Gráfico empilhado de valores repassados e a repassar por núcleo regional">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valoresEmpilhadosPorNucleo} stackOffset="none">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [typeof value === 'number' ? value.toLocaleString('pt-BR') : value, name === 'repassado' ? 'Repassado' : 'A Repassar']} />
                    <Bar dataKey="repassado" stackId="a" fill="#2563eb" name="Repassado" />
                    <Bar dataKey="aRepassar" stackId="a" fill="#93c5fd" name="A Repassar" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
