
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, FileText, Building, MapPin, BarChart3 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { formatCurrency } from "@/utils/processUtils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color?: string;
}

function StatCard({ title, value, change, trend, icon: Icon, color = "text-[var(--accent-green)]" }: StatCardProps) {
  return (
    <Card className="overflow-hidden hover:border-[var(--accent-green)]/40 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="metric-label">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="metric-value">{value}</div>
        {change && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend === 'up' && <TrendingUp className="mr-1 h-3 w-3 text-[var(--accent-green)]" />}
            {trend === 'down' && <TrendingDown className="mr-1 h-3 w-3 text-[var(--accent-red)]" />}
            <span className={trend === 'up' ? 'text-[var(--accent-green)]' : trend === 'down' ? 'text-[var(--accent-red)]' : ''}>
              {change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function OptimizedStatsCards() {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--accent-red)]">Erro ao carregar estatísticas</p>
      </div>
    );
  }

  const statsData = [
    {
      title: "Total de Processos",
      value: stats?.totalProcesses?.toLocaleString('pt-BR') || "0",
      change: "Dados atualizados em tempo real",
      trend: 'neutral' as const,
      icon: FileText,
      color: "text-[var(--accent-green)]"
    },
    {
      title: "Valor Total Transferido",
      value: formatCurrency(stats?.totalValue || 0),
      change: "Investimento em Santa Catarina",
      trend: 'up' as const,
      icon: DollarSign,
      color: "text-[var(--accent-green)]"
    },
    {
      title: "Municípios Beneficiados",
      value: stats?.activeMunicipalities?.toString() || "0",
      change: "Municípios ativos no programa",
      trend: 'neutral' as const,
      icon: Building,
      color: "text-[var(--accent-amber)]"
    },
    {
      title: "Núcleos Regionais",
      value: stats?.regionalNucleiCount?.toString() || "0",
      change: "Cobertura estadual completa",
      trend: 'neutral' as const,
      icon: MapPin,
      color: "text-[var(--accent-amber)]"
    }
  ];

  // Cards de repasse
  const repasseCards = [
    {
      title: "Municípios com Repasse Concluído",
      value: stats?.repasseStats?.municipiosRepasseConcluido?.toLocaleString('pt-BR') || '0',
      change: "Valor repassado igual ao concedente",
      trend: "up" as const,
      icon: TrendingUp,
      color: "text-[var(--accent-green)]"
    },
    {
      title: "Municípios com 1ª Parcela Paga (Parcial)",
      value: stats?.repasseStats?.municipiosPrimeiraParcela?.toLocaleString('pt-BR') || '0',
      change: "Já receberam parte do valor, mas ainda há saldo a repassar",
      trend: "neutral" as const,
      icon: TrendingDown,
      color: "text-[var(--accent-amber)]"
    }
  ];

  // Cards de contratos assinados
  const contratosAssinados = stats?.contratosAssinados || 0;
  const valorContratos = stats?.valorContratos || 0;
  const insightsCards = [
    {
      title: "Contratos Assinados",
      value: contratosAssinados.toLocaleString('pt-BR'),
      change: `${(stats?.pctProcessosContratoAssinado || 0).toFixed(1)}% dos processos com contrato assinado`,
      trend: "up" as const,
      icon: FileText,
      color: "text-[var(--accent-green)]"
    },
    {
      title: "Valores dos Contratos",
      value: formatCurrency(valorContratos),
      change: "Soma dos valores concedente dos contratos",
      trend: "up" as const,
      icon: DollarSign,
      color: "text-[var(--accent-green)]"
    }
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
      {/* Cards de repasse e insights juntos */}
      <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-4">
        {repasseCards.concat(insightsCards).map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </>
  );
}
