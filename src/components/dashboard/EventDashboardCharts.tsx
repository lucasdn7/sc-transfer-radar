import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEventsDashboard } from "@/hooks/useEventsDashboard";

function EventBarChart({ data }: { data: Array<{ name: string; processos: number; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value, name) => [typeof value === "number" ? value.toLocaleString("pt-BR") : value, name === "value" ? "Valor transferido" : "Processos"]} />
        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Valor transferido" />
        <Bar dataKey="processos" fill="#10b981" radius={[4, 4, 0, 0]} name="Processos" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EventDashboardCharts() {
  const { data, isLoading, error } = useEventsDashboard();

  if (error) {
    return <div className="text-center py-8"><p className="text-[var(--accent-red)]">Erro ao carregar gráficos de eventos</p></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Eventos por Tipo de Repasse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[350px]">
            {isLoading ? <div className="h-full flex items-center justify-center animate-pulse text-muted-foreground">Carregando...</div> : <EventBarChart data={data?.byRepasseType || []} />}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Eventos por Ano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[350px]">
            {isLoading ? <div className="h-full flex items-center justify-center animate-pulse text-muted-foreground">Carregando...</div> : <EventBarChart data={data?.byYear || []} />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
