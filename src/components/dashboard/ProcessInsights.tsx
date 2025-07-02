
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { formatCurrency } from "@/utils/processUtils";

export function ProcessInsights() {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insights dos Processos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insights dos Processos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Erro ao carregar insights</p>
        </CardContent>
      </Card>
    );
  }

  const statusDistribution = stats?.statusDistribution || {};
  const totalProcesses = stats?.totalProcesses || 0;
  const finishedProcesses = statusDistribution.finished || 0;
  const inExecutionProcesses = statusDistribution.in_execution || 0;
  const completionRate = totalProcesses > 0 ? (finishedProcesses / totalProcesses) * 100 : 0;
  const executionRate = totalProcesses > 0 ? (inExecutionProcesses / totalProcesses) * 100 : 0;

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Taxa de Conclusão</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
          <Progress value={completionRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {finishedProcesses} de {totalProcesses} processos concluídos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Em Execução</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{executionRate.toFixed(1)}%</div>
          <Progress value={executionRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {inExecutionProcesses} processos em execução
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Valor Médio</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalProcesses > 0 ? (stats?.totalValue || 0) / totalProcesses : 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Valor médio por processo
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
