import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTotalDashboard } from "@/hooks/useTotalDashboard";

function LoadingChart() {
  return <div className="h-full flex items-center justify-center animate-pulse text-muted-foreground">Carregando...</div>;
}

export function TotalDashboardCharts() {
  const { data, isLoading, error } = useTotalDashboard();

  if (error) {
    return <div className="text-center py-8"><p className="text-[var(--accent-red)]">Erro ao carregar gráficos totais</p></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader><CardTitle className="text-lg font-semibold">Valores de Repasse por Ano</CardTitle></CardHeader>
        <CardContent><div className="w-full h-[350px]">{isLoading ? <LoadingChart /> : (
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data?.valuesByYear || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value) => [typeof value === "number" ? value.toLocaleString("pt-BR") : value, "Valor"]} /><Legend /><Bar dataKey="obras" stackId="a" fill="#2563eb" name="Obras" /><Bar dataKey="eventos" stackId="a" fill="#10b981" name="Eventos" /></BarChart></ResponsiveContainer>
        )}</div></CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader><CardTitle className="text-lg font-semibold">Municípios Atendidos por Ano</CardTitle></CardHeader>
        <CardContent><div className="w-full h-[350px]">{isLoading ? <LoadingChart /> : (
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data?.municipalitiesByYear || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value) => [typeof value === "number" ? value.toLocaleString("pt-BR") : value, "Municípios"]} /><Legend /><Bar dataKey="obras" stackId="a" fill="#2563eb" name="Obras" /><Bar dataKey="eventos" stackId="a" fill="#10b981" name="Eventos" /></BarChart></ResponsiveContainer>
        )}</div></CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader><CardTitle className="text-lg font-semibold">Obras/Eventos por Ano</CardTitle></CardHeader>
        <CardContent><div className="w-full h-[350px]">{isLoading ? <LoadingChart /> : (
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data?.countsByYear || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value) => [typeof value === "number" ? value.toLocaleString("pt-BR") : value, "Processos"]} /><Legend /><Bar dataKey="obras" stackId="a" fill="#2563eb" name="Obras" /><Bar dataKey="eventos" stackId="a" fill="#10b981" name="Eventos" /></BarChart></ResponsiveContainer>
        )}</div></CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader><CardTitle className="text-lg font-semibold">Valores por Núcleo Regional</CardTitle></CardHeader>
        <CardContent><div className="w-full h-[350px]">{isLoading ? <LoadingChart /> : (
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data?.valuesByNucleus || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value) => [typeof value === "number" ? value.toLocaleString("pt-BR") : value, "Valor"]} /><Legend /><Bar dataKey="obras" stackId="a" fill="#2563eb" name="Obras" /><Bar dataKey="eventos" stackId="a" fill="#10b981" name="Eventos" /></BarChart></ResponsiveContainer>
        )}</div></CardContent>
      </Card>
    </div>
  );
}
