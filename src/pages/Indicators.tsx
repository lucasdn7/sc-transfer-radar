import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, FileText, Building, MapPin, BarChart3, RefreshCw } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { formatCurrency } from "@/utils/processUtils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color?: string;
}

function StatCard({ title, value, change, trend, icon: Icon, color = "text-blue-600" }: StatCardProps) {
  return (
    <Card className="overflow-hidden hover:border-blue-400/40 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend === 'up' && <TrendingUp className="mr-1 h-3 w-3 text-green-600" aria-hidden="true" />}
            {trend === 'down' && <TrendingDown className="mr-1 h-3 w-3 text-red-600" aria-hidden="true" />}
            <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : ''}>
              {change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Indicators() {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite" aria-label="Carregando indicadores">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Início</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Indicadores</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Indicadores</h1>
          <p className="text-muted-foreground">
            Métricas e KPIs do sistema de transferências
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse" aria-hidden="true">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6" role="alert" aria-live="assertive">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Início</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Indicadores</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Indicadores</h1>
          <p className="text-muted-foreground">
            Métricas e KPIs do sistema de transferências
          </p>
        </div>
        <Card className="border-red-200">
          <CardContent className="p-6">
            <p className="text-red-600">Erro ao carregar indicadores</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4" aria-label="Tentar carregar indicadores novamente">
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
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
      color: "text-blue-600"
    },
    {
      title: "Total das Portarias",
      value: formatCurrency(stats?.totalValue || 0),
      change: "Soma dos valores concedentes",
      trend: 'up' as const,
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Municípios Beneficiados",
      value: stats?.activeMunicipalities?.toString() || "0",
      change: "Municípios ativos no programa",
      trend: 'neutral' as const,
      icon: Building,
      color: "text-purple-600"
    },
    {
      title: "Núcleos Regionais",
      value: stats?.regionalNucleiCount?.toString() || "0",
      change: "Cobertura estadual completa",
      trend: 'neutral' as const,
      icon: MapPin,
      color: "text-orange-600"
    }
  ];

  const repasseCards = [
    {
      title: "Processos com Repasse Concluído",
      value: stats?.repasseStats?.municipiosRepasseConcluido?.toLocaleString('pt-BR') || '0',
      change: "Processos com todas as parcelas pagas",
      trend: "up" as const,
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Processos com 1ª Parcela Paga (Parcial)",
      value: stats?.repasseStats?.municipiosPrimeiraParcela?.toLocaleString('pt-BR') || '0',
      change: "Processos com pagamento parcial e saldo a repassar",
      trend: "neutral" as const,
      icon: TrendingDown,
      color: "text-yellow-600"
    }
  ];

  const contratosAssinados = stats?.contratosAssinados || 0;
  const valorContratos = stats?.valorContratos || 0;
  const saldoCards: StatCardProps[] = [
    {
      title: "Saldo a Repassar",
      value: formatCurrency(stats?.saldoARepassar || 0),
      change: "Contratos assinados menos parcelas pagas",
      trend: "down" as const,
      icon: TrendingDown,
      color: "text-red-600"
    }
  ];

  const insightsCards = [
    {
      title: "Contratos Assinados",
      value: contratosAssinados.toLocaleString('pt-BR'),
      change: `${(stats?.pctContratosAssinadosPorValor || 0).toFixed(1)}% do valor total das portarias`,
      trend: "up" as const,
      icon: FileText,
      color: "text-green-600"
    },
    {
      title: "Valores dos Contratos",
      value: formatCurrency(valorContratos),
      change: "Soma dos valores concedente dos contratos",
      trend: "up" as const,
      icon: DollarSign,
      color: "text-green-600"
    }
  ];

  return (
    <div className="space-y-6" role="main" aria-label="Indicadores e métricas">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Indicadores</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Indicadores</h1>
          <p className="text-muted-foreground">
            Métricas e KPIs do sistema de transferências
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Última atualização: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString('pt-BR') : 'N/A'}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" aria-label="Atualizar indicadores">
          <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
          Atualizar
        </Button>
      </div>

      {/* Indicadores Principais */}
      <section aria-labelledby="indicadores-principais">
        <h2 id="indicadores-principais" className="text-xl font-semibold mb-4">Indicadores Principais</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </section>

      {/* Indicadores de Repasse */}
      <section aria-labelledby="indicadores-repasse">
        <h2 id="indicadores-repasse" className="text-xl font-semibold mb-4">Indicadores de Repasse</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...repasseCards, ...saldoCards, ...insightsCards].map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </section>

      {/* Distribuição por Status */}
      {stats?.statusData && stats.statusData.length > 0 && (
        <section aria-labelledby="distribuicao-status">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" id="distribuicao-status">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
                Distribuição por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.statusData.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" aria-hidden="true"></div>
                      <span className="text-sm">{item.status}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{item.count}</span>
                      <span className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Distribuição por Região */}
      {stats?.regionalData && stats.regionalData.length > 0 && (
        <section aria-labelledby="distribuicao-regiao">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" id="distribuicao-regiao">
                <MapPin className="h-5 w-5" aria-hidden="true" />
                Distribuição por Região
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.regionalData.map((item) => (
                  <div key={item.region} className="flex items-center justify-between">
                    <span className="text-sm">{item.region}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{item.count}</span>
                      <span className="text-xs text-muted-foreground">{formatCurrency(item.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
