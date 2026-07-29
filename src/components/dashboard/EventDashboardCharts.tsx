import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEventsDashboard } from "@/hooks/useEventsDashboard";

function EventBarChart({ data, label }: { data: Array<{ name: string; value: number }>; label: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => [typeof value === "number" ? value.toLocaleString("pt-BR") : value, label]} />
        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name={label} />
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
          <CardTitle className="text-lg font-semibold">Valor Total por Ano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[350px]">
            {isLoading ? <div className="h-full flex items-center justify-center animate-pulse text-muted-foreground">Carregando...</div> : <EventBarChart data={data?.valueByYear || []} label="Valor total" />}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Eventos por Ano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[350px]">
            {isLoading ? <div className="h-full flex items-center justify-center animate-pulse text-muted-foreground">Carregando...</div> : <EventBarChart data={data?.eventsByYear || []} label="Eventos" />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
