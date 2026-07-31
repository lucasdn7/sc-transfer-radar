import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Building, DollarSign, FileCheck, FileText, MapPin, TrendingDown } from "lucide-react";
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

  const pctContratos = Math.min(Math.max(data?.stats.pctContratosAssinadosPorValor || 0, 0), 100);

  const statsData = [
    {
      title: "Total de Processos",
      value: data?.stats.totalProcesses.toLocaleString("pt-BR") || "0",
      change: "Eventos cadastrados",
      icon: FileText,
      color: "text-[var(--accent-green)]",
    },
    {
      title: "Total das Portarias",
      value: formatCurrency(data?.stats.transferredValue || 0),
      change: "Soma dos valores concedentes",
      icon: FileCheck,
      color: "text-[var(--accent-green)]",
    },
    {
      title: "Contratos Assinados",
      value: data?.stats.totalContratosAssinados.toLocaleString("pt-BR") || "0",
      change: "Eventos com contrato assinado",
      icon: FileText,
      color: "text-[var(--accent-green)]",
    },
    {
      title: "Valores dos Contratos",
      value: formatCurrency(data?.stats.valorContratosAssinados || 0),
      change: "Valor concedente dos contratos",
      icon: DollarSign,
      color: "text-[var(--accent-green)]",
    },
    {
      title: "Processos com Repasse Concluído",
      value: formatCurrency(data?.stats.processosRepasseConcluido || 0),
      change: "Eventos pagos",
      icon: DollarSign,
      color: "text-[var(--accent-green)]",
    },
    {
      title: "Processos com a 1ª parcela paga",
      value: data?.stats.municipiosPrimeiraParcela.toLocaleString("pt-BR") || "0",
      change: "Eventos pagos",
      icon: TrendingDown,
      color: "text-[var(--accent-amber)]",
    },
    {
      title: "Municípios Beneficiados",
      value: data?.stats.municipalitiesCount.toLocaleString("pt-BR") || "0",
      change: "Municípios distintos em eventos",
      icon: Building,
      color: "text-[var(--accent-amber)]",
    },
    {
      title: "Núcleos Regionais",
      value: data?.stats.regionalNucleiCount.toLocaleString("pt-BR") || "0",
      change: "Núcleos regionais distintos",
      icon: MapPin,
      color: "text-[var(--accent-amber)]",
    },
    {
      title: "Saldo a repassar",
      value: formatCurrency(data?.stats.saldoARepassar || 0),
      change: "Contratos assinados menos eventos pagos",
      icon: TrendingDown,
      color: "text-[var(--accent-amber)]",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Status dos Contratos Assinados</span>
            <span className="text-sm font-normal text-gray-500">
              {(data?.stats.pctContratosAssinadosPorValor || 0).toFixed(1)}% repassado
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Valor repassado em contratos assinados</span>
            <span className="text-gray-600">
              {formatCurrency(data?.stats.valorRepassado || 0)} de {formatCurrency(data?.stats.valorContratosAssinados || 0)}
            </span>
          </div>
          <Progress value={pctContratos} className="h-4" />
          <div className="text-center">
            <span className="text-2xl font-bold text-green-600">
              {(data?.stats.pctContratosAssinadosPorValor || 0).toFixed(1)}%
            </span>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            {formatCurrency(data?.stats.valorRepassado || 0)} repassados equivalem a {(data?.stats.pctPortariaPaga || 0).toFixed(1)}% do total das portarias.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
