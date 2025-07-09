
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  DollarSign, 
  Building, 
  MapPin, 
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

interface EnhancedStatsCardsProps {
  stats: {
    totalProcesses: number;
    totalValue: number;
    activeMunicipalities: number;
    regionalNucleiCount: number;
    monthlyGrowth?: {
      processes: number;
      value: number;
    };
    executionStats?: {
      notStarted: number;
      inProgress: number;
      completed: number;
    };
  };
}

export function EnhancedStatsCards({ stats }: EnhancedStatsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value}%`;
  };

  // Calcular taxa de conclusão
  const totalExecutionProcesses = (stats.executionStats?.notStarted || 0) + 
                                 (stats.executionStats?.inProgress || 0) + 
                                 (stats.executionStats?.completed || 0);
  
  const completionRate = totalExecutionProcesses > 0 
    ? Math.round(((stats.executionStats?.completed || 0) / totalExecutionProcesses) * 100)
    : 0;

  const inProgressRate = totalExecutionProcesses > 0 
    ? Math.round(((stats.executionStats?.inProgress || 0) / totalExecutionProcesses) * 100)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Processos
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProcesses.toLocaleString('pt-BR')}</div>
          {stats.monthlyGrowth && (
            <p className="text-xs text-muted-foreground">
              <span className={stats.monthlyGrowth.processes >= 0 ? "text-green-600" : "text-red-600"}>
                {formatPercentage(stats.monthlyGrowth.processes)}
              </span>
              {" "}em relação ao mês anterior
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Valor Total
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          {stats.monthlyGrowth && (
            <p className="text-xs text-muted-foreground">
              <span className={stats.monthlyGrowth.value >= 0 ? "text-green-600" : "text-red-600"}>
                {formatPercentage(stats.monthlyGrowth.value)}
              </span>
              {" "}em relação ao mês anterior
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Taxa de Conclusão
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.executionStats?.completed || 0} de {totalExecutionProcesses} processos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Em Execução
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inProgressRate}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.executionStats?.inProgress || 0} processos em andamento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
