import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, DollarSign, FileText, MapPin } from "lucide-react";
import { useEventsDashboard } from "@/hooks/useEventsDashboard";
import { formatCurrency } from "@/utils/processUtils";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color?: string;
}

function StatCard({ title, value, change, icon: Icon, color = "text-[var(--accent-green)]" }: StatCardProps) {
  return (
    <Card className="overflow-hidden hover:border-[var(--accent-green)]/40 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="metric-label">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="metric-value">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span>{change}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function EventStatsCards() {
  const { data, isLoading, error } = useEventsDashboard();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-gray-200 rounded mb-2" />
              <div className="h-6 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8"><p className="text-[var(--accent-red)]">Erro ao carregar eventos</p></div>;
  }

  const statsData = [
    {
      title: "Total de Processos",
      value: data?.stats.totalProcesses.toLocaleString("pt-BR") || "0",
      change: "Eventos cadastrados",
      icon: FileText,
      color: "text-[var(--accent-green)]",
    },
    {
      title: "Valor Transferido",
      value: formatCurrency(data?.stats.transferredValue || 0),
      change: "Soma dos valores concedentes",
      icon: DollarSign,
      color: "text-[var(--accent-green)]",
    },
    {
      title: "Municípios Beneficiados",
      value: data?.stats.municipalitiesCount.toLocaleString("pt-BR") || "0",
      change: "Municípios distintos em eventos",
      icon: Building,
      color: "text-[var(--accent-amber)]",
    },
    {
      title: "Núcleos Regionais Atendidos",
      value: data?.stats.regionalNucleiCount.toLocaleString("pt-BR") || "0",
      change: "Núcleos regionais distintos",
      icon: MapPin,
      color: "text-[var(--accent-amber)]",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => <StatCard key={stat.title} {...stat} />)}
    </div>
  );
}
