import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileCheck, FileText, TrendingDown } from "lucide-react";
import { useTotalDashboard } from "@/hooks/useTotalDashboard";
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

export function TotalStatsCards() {
  const { data, isLoading, error } = useTotalDashboard();

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
    return <div className="text-center py-8"><p className="text-[var(--accent-red)]">Erro ao carregar totais</p></div>;
  }

  const statsData = [
    { title: "Total de Processos", value: data?.stats.totalProcesses.toLocaleString("pt-BR") || "0", change: "Obras + eventos", icon: FileText, color: "text-[var(--accent-green)]" },
    { title: "Contratos Assinados", value: data?.stats.signedContracts.toLocaleString("pt-BR") || "0", change: "Processos com contrato assinado", icon: FileCheck, color: "text-[var(--accent-green)]" },
    { title: "Valor Total Contratado", value: formatCurrency(data?.stats.valorTotalContratoAssinado || 0), change: "Valor total com contrato assinado", icon: DollarSign, color: "text-[var(--accent-green)]" },
    { title: "Saldo a Repassar", value: formatCurrency(data?.stats.pendingTransfer || 0), change: "Valor pendente de repasse", icon: TrendingDown, color: "text-[var(--accent-amber)]" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => <StatCard key={stat.title} {...stat} />)}
    </div>
  );
}
