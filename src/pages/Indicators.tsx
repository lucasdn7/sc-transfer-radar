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

  return (
    <div className="space-y-8 mt-6">
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-4 dark:from-emerald-950/20 dark:to-slate-900 dark:border-emerald-900/60">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Painel de eventos</p>
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
              <div className="text-xs text-muted-foreground mt-1">Pagamentos consolidados</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Taxa de pagamento</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentValue(visaoGeral.taxaPagamento)}</div>
              <div className="text-xs text-muted-foreground mt-1">Valor pago / valor contratado</div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="eventos-status-contratos">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="eventos-status-contratos" className="text-xl font-semibold">Status dos contratos</h2>
          <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300">Distribuição</Badge>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                { label: 'Assinados', value: statusContratos.assinados, percentage: statusContratos.percAssinados, color: '#1A7340', badge: 'text-green-700 bg-green-100' },
                { label: 'Pendentes', value: statusContratos.pendentes, percentage: statusContratos.percPendentes, color: '#C9903A', badge: 'text-amber-700 bg-amber-100' },
                { label: 'Arquivados', value: statusContratos.arquivados, percentage: statusContratos.percArquivados, color: '#888888', badge: 'text-slate-700 bg-slate-100' },
                { label: 'Não definido', value: statusContratos.naoDefinido, percentage: statusContratos.percNaoDefinido, color: '#D1D5DB', badge: 'text-slate-700 bg-slate-100' },
              ].map((status) => (
                <div key={status.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: status.color }} aria-hidden="true" />
                      <span className="font-medium">{status.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{status.value}</span>
                      <Badge className={status.badge}>{formatPercentValue(status.percentage)}</Badge>
                    </div>
                  </div>
                  <Progress value={status.percentage} className="h-2" style={{ backgroundColor: '#e5e7eb' }} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="eventos-evolucao-ano">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="eventos-evolucao-ano" className="text-xl font-semibold">Evolução por ano</h2>
          <Badge variant="outline" className="border-sky-200 text-sky-700 dark:border-sky-800 dark:text-sky-300">2023–2026</Badge>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ano</TableHead>
                    <TableHead className="text-right">Assinados</TableHead>
                    <TableHead className="text-right">Pendentes</TableHead>
                    <TableHead className="text-right">Arquivados</TableHead>
                    <TableHead className="text-right">Valor assinado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evolucaoAnual.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Sem dados de evolução anual.</TableCell>
                    </TableRow>
                  ) : (
                    evolucaoAnual.map((row) => (
                      <TableRow key={row.ano}>
                        <TableCell className="font-medium">{row.ano}</TableCell>
                        <TableCell className="text-right">{row.assinados}</TableCell>
                        <TableCell className="text-right">{row.pendentes}</TableCell>
                        <TableCell className="text-right">{row.arquivados}</TableCell>
                        <TableCell className="text-right text-green-700 font-medium">{formatCurrency(row.valorAssinado)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="eventos-tipos-instrumento">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="eventos-tipos-instrumento" className="text-xl font-semibold">Por tipo de instrumento</h2>
          <Badge variant="outline" className="border-violet-200 text-violet-700 dark:border-violet-800 dark:text-violet-300">{tiposInstrumento.length} grupos</Badge>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Valor total</TableHead>
                    <TableHead className="text-right">% quantidade</TableHead>
                    <TableHead className="text-right">% valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiposInstrumento.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Nenhum tipo de instrumento encontrado.</TableCell>
                    </TableRow>
                  ) : (
                    tiposInstrumento.map((item) => (
                      <TableRow key={item.tipo}>
                        <TableCell className="font-medium">{item.tipo}</TableCell>
                        <TableCell className="text-right">{item.quantidade}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.valor)}</TableCell>
                        <TableCell className="text-right">{formatPercentValue(item.percQuantidade)}</TableCell>
                        <TableCell className="text-right">{formatPercentValue(item.percValor)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="eventos-regiao-turistica">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="eventos-regiao-turistica" className="text-xl font-semibold">Por região turística</h2>
          <Badge variant="outline" className="border-cyan-200 text-cyan-700 dark:border-cyan-800 dark:text-cyan-300">{regioesTuristicas.length} regiões</Badge>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Região</TableHead>
                    <TableHead className="text-right">Eventos</TableHead>
                    <TableHead className="text-right">Valor apoiado</TableHead>
                    <TableHead className="text-right">Média por evento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regioesTuristicas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Nenhuma região cadastrada.</TableCell>
                    </TableRow>
                  ) : (
                    regioesTuristicas.map((item) => (
                      <TableRow key={item.regiao}>
                        <TableCell className="font-medium">{item.regiao}</TableCell>
                        <TableCell className="text-right">{item.eventos}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.valorApoiado)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.mediaPorEvento)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="eventos-nucleos-regionais">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="eventos-nucleos-regionais" className="text-xl font-semibold">Por núcleo regional</h2>
          <Badge variant="outline" className="border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300">{nucleosRegionais.length} núcleos</Badge>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sigla</TableHead>
                    <TableHead>Núcleo</TableHead>
                    <TableHead className="text-right">Eventos</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nucleosRegionais.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Nenhum núcleo regional cadastrado.</TableCell>
                    </TableRow>
                  ) : (
                    nucleosRegionais.map((item) => (
                      <TableRow key={`${item.sigla}-${item.nome}`}>
                        <TableCell className="font-medium">{item.sigla}</TableCell>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell className="text-right">{item.eventos}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.valor)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="eventos-top-municipios">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="eventos-top-municipios" className="text-xl font-semibold">Top 15 municípios por valor de eventos</h2>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">Top 15</Badge>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Município</TableHead>
                    <TableHead>Região</TableHead>
                    <TableHead className="text-right">Eventos</TableHead>
                    <TableHead className="text-right">Valor recebido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topMunicipios.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Nenhum município encontrado.</TableCell></TableRow>
                  ) : (
                    topMunicipios.map((municipio) => (
                      <TableRow key={`${municipio.posicao}-${municipio.municipio}`}>
                        <TableCell className="text-center font-medium text-muted-foreground">{municipio.posicao}</TableCell>
                        <TableCell className="font-medium">{municipio.municipio}</TableCell>
                        <TableCell>{municipio.regiao}</TableCell>
                        <TableCell className="text-right">{municipio.eventos}</TableCell>
                        <TableCell className="text-right text-green-700 font-medium">{formatCurrency(municipio.valor)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="eventos-engajamento-combinado">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="eventos-engajamento-combinado" className="text-xl font-semibold">Municípios com mais engajamento: obras + eventos</h2>
          <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300">Interações</Badge>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Município</TableHead>
                    <TableHead>Região</TableHead>
                    <TableHead className="text-right">Obras</TableHead>
                    <TableHead className="text-right">Eventos</TableHead>
                    <TableHead className="text-right">Total interações</TableHead>
                    <TableHead className="text-right">Valor total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {engajamento.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Nenhum município com engajamento combinado.</TableCell></TableRow>
                  ) : (
                    engajamento.map((item) => (
                      <TableRow key={`${item.posicao}-${item.municipio}`}>
                        <TableCell className="text-center font-medium text-muted-foreground">{item.posicao}</TableCell>
                        <TableCell className="font-medium">{item.municipio}</TableCell>
                        <TableCell>{item.regiao}</TableCell>
                        <TableCell className="text-right">{item.obras}</TableCell>
                        <TableCell className="text-right">{item.eventos}</TableCell>
                        <TableCell className="text-right">{item.totalInteracoes}</TableCell>
                        <TableCell className="text-right text-blue-700 font-medium">{formatCurrency(item.valorTotal)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ObrasIndicators() {
  const { data: stats, isLoading, error, refetch } = useIndicatorsObras();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 mt-6">
        <CardContent className="p-6">
          <p className="text-red-600">Erro ao carregar indicadores de obras</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const { visaoFinanceira, execucaoParcelas, parcelasAgrupadas, situacaoContratos, semaforoVigencia } = stats;

  return (
    <div className="space-y-8 mt-6">
      {/* Bloco 1 — Visão geral financeira */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Visão Geral Financeira</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Valor Total da Portaria"
            value={formatCurrency(visaoFinanceira.totalPortaria)}
            icon={DollarSign}
            color="text-blue-600"
          />
          <StatCard
            title="Valor Concedente"
            value={formatCurrency(visaoFinanceira.totalConcedente)}
            icon={DollarSign}
            color="text-green-600"
          />
          <StatCard
            title="Valor Contrapartida"
            value={formatCurrency(visaoFinanceira.totalProponente)}
            icon={DollarSign}
            color="text-orange-600"
          />
          <StatCard
            title="Valor Licitado"
            value={visaoFinanceira.hasLicitado ? formatCurrency(visaoFinanceira.totalLicitado) : "Sem dados"}
            icon={DollarSign}
            color="text-purple-600"
          />
        </div>
      </section>

      {/* Bloco 2 — Execução financeira das parcelas */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Execução Financeira das Parcelas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total de Parcelas"
            value={execucaoParcelas.totalParcelas.toLocaleString('pt-BR')}
            icon={Layers}
            color="text-blue-500"
          />
          <StatCard
            title="Parcelas Pagas"
            value={execucaoParcelas.pagas.toLocaleString('pt-BR')}
            change={`${execucaoParcelas.percQuantidadePaga.toFixed(1)}% do total`}
            trend="up"
            icon={CheckCircle2}
            color="text-green-600"
          />
          <StatCard
            title="Parcelas Pendentes"
            value={execucaoParcelas.pendentes.toLocaleString('pt-BR')}
            change={`${execucaoParcelas.percQuantidadePendente.toFixed(1)}% do total`}
            trend="neutral"
            icon={Clock}
            color="text-amber-500"
          />
          <StatCard
            title="Valor Total das Parcelas"
            value={formatCurrency(execucaoParcelas.valorTotal)}
            icon={DollarSign}
            color="text-blue-600"
          />
          <StatCard
            title="Valor Pago"
            value={formatCurrency(execucaoParcelas.valorPago)}
            change={`${execucaoParcelas.percValorPago.toFixed(1)}% do valor`}
            trend="up"
            icon={DollarSign}
            color="text-green-600"
          />
          <StatCard
            title="Valor Pendente"
            value={formatCurrency(execucaoParcelas.valorPendente)}
            change={`${execucaoParcelas.percValorPendente.toFixed(1)}% do valor`}
            trend="neutral"
            icon={DollarSign}
            color="text-amber-500"
          />
        </div>
        {execucaoParcelas.valorTotal > 0 && (
          <div className="mt-4 p-4 bg-white rounded-xl border">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-slate-700">Progresso de Pagamento</span>
              <span className="font-bold text-blue-600">{execucaoParcelas.percValorPago.toFixed(1)}%</span>
            </div>
            <Progress value={execucaoParcelas.percValorPago} className="h-3" />
          </div>
        )}
      </section>

      {/* Bloco 3 — Execução por número de parcela */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Execução por Número de Parcela</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcela</TableHead>
                    <TableHead className="text-right">Processos</TableHead>
                    <TableHead className="text-right">Pagas</TableHead>
                    <TableHead className="text-right">Pendentes</TableHead>
                    <TableHead className="text-right">% Pago</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Valor Pago</TableHead>
                    <TableHead className="text-right">Valor Pendente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parcelasAgrupadas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground h-24">Nenhuma parcela encontrada</TableCell>
                    </TableRow>
                  ) : (
                    parcelasAgrupadas.map(g => (
                      <TableRow key={g.parcelNumber}>
                        <TableCell className="font-medium">{g.parcelNumber}ª Parcela</TableCell>
                        <TableCell className="text-right">{g.totalProcessos}</TableCell>
                        <TableCell className="text-right">{g.pagas}</TableCell>
                        <TableCell className="text-right">{g.pendentes}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={g.percPago === 100 ? "default" : "secondary"}>
                            {g.percPago.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(g.valorTotal)}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">{formatCurrency(g.valorPago)}</TableCell>
                        <TableCell className="text-right text-amber-600">{formatCurrency(g.valorPendente)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Bloco 4 — Situação dos contratos */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Situação dos Contratos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Contrato Assinado"
            value={situacaoContratos.comContrato.toString()}
            icon={CheckCircle2}
            color="text-green-600"
          />
          <StatCard
            title="Sem Contrato"
            value={situacaoContratos.semContrato.toString()}
            icon={XCircle}
            color="text-red-500"
          />
          <StatCard
            title="Em Prestação de Contas"
            value={situacaoContratos.prestacaoContas.toString()}
            icon={Search}
            color="text-purple-600"
          />
          <StatCard
            title="Processos Finalizados"
            value={situacaoContratos.finalizados.toString()}
            icon={CheckCircle2}
            color="text-blue-600"
          />
          <StatCard
            title="Com Termo Aditivo"
            value={situacaoContratos.comAditivo.toString()}
            icon={FileText}
            color="text-orange-600"
          />
          <StatCard
            title="Total de Aditivos"
            value={situacaoContratos.totalAditivos.toString()}
            icon={Layers}
            color="text-orange-500"
          />
          <StatCard
            title="Com Localização"
            value={situacaoContratos.comLocalizacao.toString()}
            icon={MapPin}
            color="text-green-500"
          />
        </div>
      </section>

      {/* Bloco 5 — Vigência: semáforo de prazos */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Vigência de Prazos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Vencidos"
            value={semaforoVigencia.vencidos.toString()}
            icon={AlertTriangle}
            color="text-[#C0392B]"
          />
          <StatCard
            title="Vencem em até 30 dias"
            value={semaforoVigencia.ate30.toString()}
            icon={Clock}
            color="text-orange-500"
          />
          <StatCard
            title="Vencem em até 60 dias"
            value={semaforoVigencia.ate60.toString()}
            icon={Calendar}
            color="text-amber-500"
          />
          <StatCard
            title="Vencem em até 90 dias"
            value={semaforoVigencia.ate90.toString()}
            icon={Calendar}
            color="text-amber-500"
          />
          <StatCard
            title="Em dia (> 90 dias)"
            value={semaforoVigencia.emDia.toString()}
            icon={CheckCircle2}
            color="text-[#1A7340]"
          />
          <StatCard
            title="Sem Vigência"
            value={semaforoVigencia.semVigencia.toString()}
            icon={Calendar}
            color="text-slate-400"
          />
        </div>
      </section>
      {/* Bloco 6 — Distribuição por status */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Processos</TableHead>
                    <TableHead className="text-right">Percentual</TableHead>
                    <TableHead className="text-right">Valor Concedente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.distribuicaoStatus.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.cor || '#888888' }} />
                          <span className="font-medium">{s.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{s.quantidade}</TableCell>
                      <TableCell className="text-right">{s.percentual.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(s.valorTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Bloco 7 — Por núcleo regional */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Por Núcleo Regional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sigla</TableHead>
                    <TableHead>Núcleo</TableHead>
                    <TableHead className="text-right">Processos</TableHead>
                    <TableHead className="text-right">Valor Concedente</TableHead>
                    <TableHead className="text-right">Contratos Assinados</TableHead>
                    <TableHead className="text-right">% Contratos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.nucleosRegionais.map((n, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{n.sigla}</TableCell>
                      <TableCell>{n.nome}</TableCell>
                      <TableCell className="text-right">{n.processos}</TableCell>
                      <TableCell className="text-right">{formatCurrency(n.valorConcedente)}</TableCell>
                      <TableCell className="text-right">{n.contratosAssinados}</TableCell>
                      <TableCell className="text-right">{n.percContratosAssinados.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Bloco 8 — Por região turística */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Por Região Turística</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Região</TableHead>
                    <TableHead className="text-right">Processos</TableHead>
                    <TableHead className="text-right">Municípios Atendidos</TableHead>
                    <TableHead className="text-right">Valor Concedente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.regioesTuristicas.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{r.regiao}</TableCell>
                      <TableCell className="text-right">{r.processos}</TableCell>
                      <TableCell className="text-right">{r.municipiosAtendidos}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.valorConcedente)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Bloco 9 — Top 15 municípios por valor */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Top 15 Municípios (por Valor Concedente)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Município</TableHead>
                    <TableHead>Região</TableHead>
                    <TableHead className="text-right">Processos</TableHead>
                    <TableHead className="text-right">Valor Concedente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topMunicipios.map(m => (
                    <TableRow key={m.posicao}>
                      <TableCell className="text-center font-medium text-muted-foreground">{m.posicao}</TableCell>
                      <TableCell className="font-medium">{m.municipio}</TableCell>
                      <TableCell>{m.regiao}</TableCell>
                      <TableCell className="text-right">{m.processos}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">{formatCurrency(m.valorConcedente)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Bloco 10 — Categoria do objeto */}
      <section>
        <div className="flex flex-col md:flex-row gap-6 mb-4">
          <h2 className="text-xl font-semibold flex-1">Categoria do Objeto</h2>
          
          <Card className="flex-1 bg-slate-50">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-2">Completude do Cadastro (Categorias)</div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-2xl font-bold">{stats.completudeCategoria.percCompletude.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.completudeCategoria.comCategoria} classificados de {stats.completudeCategoria.totalProcessos} processos totais
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-amber-600">{stats.completudeCategoria.semCategoria} sem categoria</div>
                </div>
              </div>
              <Progress value={stats.completudeCategoria.percCompletude} className="h-2 mt-3" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Processos</TableHead>
                    <TableHead className="text-right">Valor Concedente</TableHead>
                    <TableHead className="text-right min-w-[200px]">
                      Percentual do valor entre os processos com categoria preenchida
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.categorias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                        Nenhuma categoria preenchida cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.categorias.map((c, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{c.categoria}</TableCell>
                        <TableCell className="text-right">{c.quantidade}</TableCell>
                        <TableCell className="text-right">{formatCurrency(c.valorConcedente)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="w-12 text-right">{c.percValor.toFixed(1)}%</span>
                            <Progress value={c.percValor} className="w-24 h-2" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default function Indicators() {
  const { category } = useCategory();
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  if (category === 'promo') {
    return (
      <div className="min-h-screen p-6 px-7 max-w-[1280px] mx-auto" style={{ backgroundColor: 'var(--transfers-bg)' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--transfers-text-primary)' }}>Indicadores</h1>
          <p className="text-sm" style={{ color: 'var(--transfers-text-muted)' }}>Análise detalhada</p>
        </div>
        <CategorySelector />
        <div className="mt-6">
          <div className="rounded-3xl p-12 px-6 text-center" style={{
            backgroundColor: 'var(--transfers-surface)',
            border: '1px dashed var(--transfers-border-strong)',
          }}>
            <div className="mb-4 flex justify-center" style={{ fontSize: '48px', opacity: 0.25, color: 'var(--transfers-text-muted)' }}>
              🏗️
            </div>
            <div className="text-[15px] mb-2" style={{ color: 'var(--transfers-text-secondary)' }}>
              Ainda não há dados de promoção turística cadastrados
            </div>
            <div className="text-[13px]" style={{ color: 'var(--transfers-text-muted)' }}>
              Os indicadores aparecerão automaticamente quando os dados forem inseridos
            </div>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen p-6 px-7 max-w-[1280px] mx-auto" style={{ backgroundColor: 'var(--transfers-bg)' }} role="main" aria-label="Indicadores e métricas">
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

      {/* CategorySelector */}
      <CategorySelector />

      {/* Conteúdo baseado na categoria */}
      <div className="mt-6">
        {category === 'todos' && (
          <>
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
          </>
        )}
        
        {/* Indicadores de obras */}
        {category === 'obras' && <ObrasIndicators />}
        
        {category === 'eventos' && <EventosIndicators />}
      </div>
    </div>
  );
}
