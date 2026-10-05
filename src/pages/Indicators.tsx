import * as React from "react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, FileText, Building, MapPin, BarChart3, RefreshCw, Calendar, CheckCircle2, Clock, AlertTriangle, XCircle, MapPinOff, Layers, Search } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { formatCurrency } from "@/utils/processUtils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CategorySelector } from "@/components/transfers/CategorySelector";
import { useCategory } from "@/contexts/CategoryContext";
import { useIndicatorsObras } from "@/hooks/useIndicatorsObras";
import { useIndicatorsEventos } from "@/hooks/useIndicatorsEventos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
    <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`rounded-lg bg-slate-100 p-2 dark:bg-slate-800 ${color}`} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {change && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend === 'up' && <TrendingUp className="mr-1 h-3 w-3 text-emerald-600" aria-hidden="true" />}
            {trend === 'down' && <TrendingDown className="mr-1 h-3 w-3 text-rose-600" aria-hidden="true" />}
            <span className={trend === 'up' ? 'text-emerald-600 font-medium' : trend === 'down' ? 'text-rose-600 font-medium' : ''}>
              {change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatPercentValue(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(1)}%`;
}

function EventosIndicators() {
  const { data, isLoading, error, refetch } = useIndicatorsEventos();

  if (isLoading) {
    return (
      <div className="space-y-6 mt-6" role="status" aria-live="polite" aria-label="Carregando indicadores de eventos">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Skeleton key={item} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6" role="alert" aria-live="assertive">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <p className="text-red-600">Erro ao carregar indicadores de eventos</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4" aria-label="Tentar carregar indicadores de eventos novamente">
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mt-6">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhum dado de eventos encontrado.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { visaoGeral, statusContratos, evolucaoAnual, tiposInstrumento, regioesTuristicas, nucleosRegionais, topMunicipios, engajamento } = data;

  const summaryBadges = [
    { label: "Eventos", value: visaoGeral.totalEventos.toLocaleString('pt-BR') },
    { label: "Valor publicado", value: formatCurrency(visaoGeral.valorPublicado) },
    { label: "Taxa de pagamento", value: formatPercentValue(visaoGeral.taxaPagamento) },
  ];
  const statusCards = [
    { status: "Assinados", quantidade: statusContratos.assinados, percentual: statusContratos.percAssinados },
    { status: "Pendentes", quantidade: statusContratos.pendentes, percentual: statusContratos.percPendentes },
    { status: "Arquivados", quantidade: statusContratos.arquivados, percentual: statusContratos.percArquivados },
    { status: "Não definido", quantidade: statusContratos.naoDefinido, percentual: statusContratos.percNaoDefinido },
  ];

  return (
    <div className="space-y-8 mt-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Painel de eventos</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">Indicadores de eventos turísticos</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {summaryBadges.map((item) => (
              <Badge key={item.label} variant="secondary" className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 dark:border-emerald-900 dark:bg-slate-900/70 dark:text-slate-200">
                {item.label}: {item.value}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <section aria-labelledby="eventos-visao-geral">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="eventos-visao-geral" className="text-xl font-semibold">Visão geral</h2>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">6 indicadores</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total de eventos</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoGeral.totalEventos.toLocaleString('pt-BR')}</div>
              <div className="text-xs text-muted-foreground mt-1">{visaoGeral.municipiosAtendidos.toLocaleString('pt-BR')} municípios atendidos</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Municípios atendidos</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visaoGeral.municipiosAtendidos.toLocaleString('pt-BR')}</div>
              <div className="text-xs text-muted-foreground mt-1">Registros com município identificado</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Valor publicado</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(visaoGeral.valorPublicado)}</div>
              <div className="text-xs text-muted-foreground mt-1">Total apoiado em eventos</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Valor contratado</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(visaoGeral.valorContratado)}</div>
              <div className="text-xs text-muted-foreground mt-1">Eventos com contrato assinado</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Valor pago</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(visaoGeral.valorPago)}</div>
              <div className="text-xs text-muted-foreground mt-1">Total pago aos eventos</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Taxa de pagamento</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentValue(visaoGeral.taxaPagamento)}</div>
              <div className="text-xs text-muted-foreground mt-1">Percentual de eventos pagos</div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="eventos-status-contratos">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="eventos-status-contratos" className="text-xl font-semibold">Status dos contratos</h2>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">4 status</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {statusCards.map((status) => (
            <Card key={status.status} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{status.status}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold tracking-tight">{status.quantidade.toLocaleString('pt-BR')}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <p className="mr-2">{formatPercentValue(status.percentual)}</p>
                  <Progress value={status.percentual} className="h-1.5 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="eventos-evolucao-anual">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="eventos-evolucao-anual" className="text-xl font-semibold">Evolução anual</h2>
          <Button variant="outline" size="icon" aria-label="Atualizar dados de evolução anual">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {evolucaoAnual.map((ano) => (
            <Card key={ano.ano} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{ano.ano}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold tracking-tight">
                  {(ano.assinados + ano.pendentes + ano.arquivados + ano.naoDefinido).toLocaleString('pt-BR')}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <p>{ano.assinados.toLocaleString('pt-BR')} contratos assinados</p>
                  <span className="ml-auto font-medium">{formatCurrency(ano.valorAssinado)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="eventos-top-municipios">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="eventos-top-municipios" className="text-xl font-semibold">Municípios em destaque</h2>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">{topMunicipios.length} municípios</Badge>
        </div>
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <h3 className="text-lg font-semibold">Eventos e valores por município</h3>
          </CardHeader>
          <CardContent>
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Posição</TableHead>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Município</TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Eventos</TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor apoiado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topMunicipios.map((municipio, index) => (
                  <TableRow key={municipio.municipio} className="hover:bg-slate-50">
                    <TableCell className="text-center text-xs font-medium">{index + 1}</TableCell>
                    <TableCell className="text-left text-xs font-medium whitespace-nowrap">
                      {municipio.municipio}
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium">{municipio.eventos.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{formatCurrency(municipio.valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ObrasIndicators() {
  const { data, isLoading, error, refetch } = useIndicatorsObras();

  if (isLoading) {
    return (
      <div className="space-y-6 mt-6" role="status" aria-live="polite" aria-label="Carregando indicadores de obras">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Skeleton key={item} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6" role="alert" aria-live="assertive">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <p className="text-red-600">Erro ao carregar indicadores de obras</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4" aria-label="Tentar carregar indicadores de obras novamente">
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mt-6">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhum dado de obras encontrado.
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    visaoFinanceira,
    execucaoParcelas,
    parcelasAgrupadas,
    situacaoContratos,
    distribuicaoStatus,
    categorias,
    completudeCategoria,
  } = data;
  const totalProcessos = distribuicaoStatus.reduce((total, status) => total + status.quantidade, 0);
  const percentualContratos = totalProcessos > 0
    ? (situacaoContratos.comContrato / totalProcessos) * 100
    : 0;

  const summaryBadges = [
    { label: "Processos", value: totalProcessos.toLocaleString('pt-BR') },
    { label: "Valor concedente", value: formatCurrency(visaoFinanceira.totalConcedente) },
    { label: "Com contrato", value: formatPercentValue(percentualContratos) },
  ];

  return (
    <div className="space-y-8 mt-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Painel de obras</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">Indicadores de obras e serviços</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {summaryBadges.map((item) => (
              <Badge key={item.label} variant="secondary" className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 dark:border-emerald-900 dark:bg-slate-900/70 dark:text-slate-200">
                {item.label}: {item.value}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <section aria-labelledby="obras-visao-geral">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="obras-visao-geral" className="text-xl font-semibold">Visão geral</h2>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">6 indicadores</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Total de processos"
            value={totalProcessos.toLocaleString('pt-BR')}
            icon={Building}
            color="text-blue-600"
          />
          <StatCard
            title="Valor concedente"
            value={formatCurrency(visaoFinanceira.totalConcedente)}
            icon={DollarSign}
            color="text-indigo-600"
          />
          <StatCard
            title="Valor de portaria"
            value={formatCurrency(visaoFinanceira.totalPortaria)}
            icon={FileText}
            color="text-emerald-600"
          />
          <StatCard
            title="Valor proponente"
            value={formatCurrency(visaoFinanceira.totalProponente)}
            icon={DollarSign}
            color="text-sky-600"
          />
          <StatCard
            title="Contratos assinados"
            value={situacaoContratos.comContrato.toLocaleString('pt-BR')}
            change={formatPercentValue(percentualContratos)}
            trend="neutral"
            icon={CheckCircle2}
            color="text-emerald-600"
          />
          <StatCard
            title="Aditivos registrados"
            value={situacaoContratos.totalAditivos.toLocaleString('pt-BR')}
            icon={Layers}
            color="text-gray-600"
          />
        </div>
      </section>

      <section aria-labelledby="obras-status">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="obras-status" className="text-xl font-semibold">Status das obras</h2>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">{distribuicaoStatus.length} status</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {distribuicaoStatus.map((status) => (
            <Card key={status.nome} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{status.nome}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold tracking-tight">{status.quantidade.toLocaleString('pt-BR')}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <p className="mr-2">{formatPercentValue(status.percentual)}</p>
                  <Progress value={status.percentual} className="h-1.5 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="obras-tipos">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="obras-tipos" className="text-xl font-semibold">Processos por categoria</h2>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">{categorias.length} categorias</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {categorias.map((tipo) => (
            <Card key={tipo.categoria} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{tipo.categoria}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold tracking-tight">{tipo.quantidade.toLocaleString('pt-BR')}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <p className="mr-2">{formatPercentValue(tipo.percValor)} do valor</p>
                  <Progress value={tipo.percValor} className="h-1.5 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Categorias preenchidas: {completudeCategoria.comCategoria.toLocaleString('pt-BR')} de {completudeCategoria.totalProcessos.toLocaleString('pt-BR')} ({formatPercentValue(completudeCategoria.percCompletude)})
        </p>
      </section>

      <section aria-labelledby="obras-investimento-mensal">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="obras-investimento-mensal" className="text-xl font-semibold">Execução de parcelas</h2>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">{execucaoParcelas.totalParcelas.toLocaleString('pt-BR')} parcelas</Badge>
        </div>
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Valores pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-5 space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-2xl font-semibold tracking-tight">{formatCurrency(execucaoParcelas.valorPago)}</span>
                <span className="text-sm text-muted-foreground">de {formatCurrency(execucaoParcelas.valorTotal)}</span>
              </div>
              <Progress value={execucaoParcelas.percValorPago} className="h-2" />
              <p className="text-xs text-muted-foreground">{formatPercentValue(execucaoParcelas.percValorPago)} do valor total das parcelas</p>
            </div>
            <div className="space-y-3">
              {parcelasAgrupadas.map((parcela) => (
                <div key={parcela.parcelNumber} className="border-b border-slate-200/70 pb-3 last:border-0 last:pb-0 dark:border-slate-700">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">Parcela {parcela.parcelNumber}</span>
                    <span className="text-muted-foreground">{parcela.pagas} pagas · {parcela.pendentes} pendentes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={parcela.percPago} className="h-1.5 flex-1" />
                    <span className="min-w-24 text-right text-xs font-medium">{formatCurrency(parcela.valorPago)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default function Indicators() {
  const { data: dashboardData, isLoading: dashboardIsLoading, error: dashboardError } = useDashboardStats();
  const { category } = useCategory();

  const [activeTab, setActiveTab] = React.useState<'obras' | 'eventos'>('obras');

  if (dashboardIsLoading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Transfer Radar SC</h1>
          <p className="text-muted-foreground">Carregando indicadores...</p>
          <div className="mt-6 flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-32 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Transfer Radar SC</h1>
          <p className="text-red-600">Erro ao carregar indicadores</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
      <div className="indicators-page space-y-8 rounded-xl bg-slate-50 p-4 text-slate-900 sm:p-6 dark:bg-slate-950/40 dark:text-slate-100">
        <style>{`
          .indicators-page .bg-card {
            background-color: #fff;
          }
          .dark .indicators-page .bg-card {
            background-color: #111c2d;
          }
          .indicators-page .rounded-lg.border.bg-card {
            border-color: #dce4eb;
            border-radius: 0.875rem;
            box-shadow: 0 1px 2px rgb(23 43 77 / 0.04);
          }
          .dark .indicators-page .rounded-lg.border.bg-card {
            border-color: #29384c;
            box-shadow: 0 1px 2px rgb(0 0 0 / 0.18);
          }
          .indicators-page section > div:first-child h2 {
            color: #172b4d;
            font-size: 1.125rem;
            font-weight: 650;
            letter-spacing: -0.02em;
          }
          .dark .indicators-page section > div:first-child h2 {
            color: #e2e8f0;
          }
          .indicators-page table thead tr {
            border-bottom-color: #dce4eb;
            background: #f5f8fa;
          }
          .dark .indicators-page table thead tr {
            border-bottom-color: #29384c;
            background: #172337;
          }
        `}</style>
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Indicadores de Transferências
        </h1>
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          <Button
            variant={activeTab === 'obras' ? 'default' : 'outline'}
            onClick={() => setActiveTab('obras')}
            className="rounded-lg font-medium shadow-none transition-colors"
          >
            Obras e Serviços
          </Button>
          <Button
            variant={activeTab === 'eventos' ? 'default' : 'outline'}
            onClick={() => setActiveTab('eventos')}
            className="rounded-lg font-medium shadow-none transition-colors"
          >
            Eventos Turísticos
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'obras' ? <ObrasIndicators /> : <EventosIndicators />}
      </div>

      <div className="mt-2 border-t border-slate-200 pt-4 text-right text-muted-foreground dark:border-slate-800">
        <p className="text-xs">
          Última atualização: {new Date(dashboardData?.ultimaAtualizacao || Date.now()).toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  );
}
