import { useState, useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CategorySelector } from "@/components/transfers/CategorySelector";
import { KpiCard } from "@/components/transfers/KpiCard";
import { AlertBanner } from "@/components/transfers/AlertBanner";
import { EmptyState } from "@/components/transfers/EmptyState";
import { useCategory } from "@/contexts/CategoryContext";
import { getDashboardData } from "@/lib/queries";
import { formatCurrencyShort, formatPercent } from "@/utils/processUtils";
import { AlertTriangle, Calendar, DollarSign, FileText, Building2 } from "lucide-react";

interface DashboardData {
  obras: {
    total_processos: number;
    municipios: number;
    valor_concedente: number;
    valor_contrapartida: number;
    valor_portaria: number;
    contratos_assinados: number;
    em_prestacao: number;
  };
  parcelas: {
    total_parcelas: number;
    valor_total: number;
    valor_pago: number;
    valor_pendente: number;
    parcelas_pagas: number;
    parcelas_pendentes: number;
  };
  eventos: {
    total_eventos: number;
    municipios: number;
    valor_total: number;
    valor_assinado: number;
    valor_pago: number;
    assinados: number;
    pendentes: number;
    arquivados: number;
    em_prestacao: number;
  };
  alertas: {
    vencidos: number;
    vence_30d: number;
    vence_60d: number;
    vence_90d: number;
    sem_vigencia: number;
    em_dia: number;
  };
}

export default function Dashboard() {
  const { category } = useCategory();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const dashboardData = await getDashboardData();
        setData(dashboardData);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar dados do dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4" role="alert" aria-live="assertive">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Erro ao carregar o Dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => { setError(null); window.location.reload(); }}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--accent-green)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--accent-green)]/90 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 px-7 max-w-[1280px] mx-auto" style={{ backgroundColor: 'var(--transfers-bg)' }} role="main" aria-label="Dashboard de transferências">
      {/* Título da página */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--transfers-text-primary)' }}>Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--transfers-text-muted)' }}>Visão executiva geral</p>
      </div>

      {/* CategorySelector */}
      <CategorySelector />

      {/* Conteúdo baseado na categoria */}
      <div className="mt-6">
        {category === 'promo' && (
          <EmptyState
            icon={<Building2 />}
            title="Ainda não há dados de promoção turística cadastrados"
            subtitle="Os indicadores aparecerão automaticamente quando os dados forem inseridos"
          />
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-3xl p-4 px-4.5 animate-pulse" style={{
                backgroundColor: 'var(--transfers-surface)',
                border: '1px solid var(--transfers-border)',
              }}>
                <div className="h-3 bg-gray-200 rounded mb-2" style={{ width: '60%' }}></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded" style={{ width: '80%' }}></div>
              </div>
            ))}
          </div>
        )}

        {!loading && data && (
          <>
            {/* Aba Todos */}
            {category === 'todos' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <KpiCard
                    label="INVESTIMENTO TOTAL"
                    value={formatCurrencyShort(data.obras.valor_concedente + data.eventos.valor_total)}
                    subtext="Obras + Eventos + Promoção turística"
                    badge={{ text: "Concedente", variant: "info" }}
                    accent="var(--transfers-color-todos)"
                  />
                  <KpiCard
                    label="OBRAS TURÍSTICAS"
                    value={data.obras.total_processos.toString()}
                    subtext={`${formatCurrencyShort(data.obras.valor_concedente)} em ${data.obras.municipios} municípios`}
                    badge={{ text: `${data.obras.contratos_assinados} com contrato`, variant: "info" }}
                    accent="var(--transfers-color-obras)"
                  />
                  <KpiCard
                    label="EVENTOS APOIADOS"
                    value={data.eventos.total_eventos.toString()}
                    subtext={`${formatCurrencyShort(data.eventos.valor_total)} em ${data.eventos.municipios} municípios`}
                    badge={{ text: `${data.eventos.assinados} assinados`, variant: "success" }}
                    accent="var(--transfers-color-eventos)"
                  />
                  <KpiCard
                    label="PROMOÇÃO TURÍSTICA"
                    value="—"
                    subtext="Em breve"
                    badge={{ text: "Sem dados", variant: "warning" }}
                    accent="var(--transfers-color-promo)"
                  />
                  <KpiCard
                    label="REPASSES REALIZADOS — OBRAS"
                    value={formatCurrencyShort(data.parcelas.valor_pago)}
                    subtext={`de ${formatCurrencyShort(data.parcelas.valor_total)} em parcelas`}
                    progress={{
                      paid: Math.round((data.parcelas.valor_pago / data.parcelas.valor_total) * 100),
                      pending: Math.round((data.parcelas.valor_pendente / data.parcelas.valor_total) * 100),
                    }}
                    accent="var(--transfers-success)"
                  />
                  <KpiCard
                    label="REPASSES REALIZADOS — EVENTOS"
                    value={formatCurrencyShort(data.eventos.valor_pago)}
                    subtext={`de ${formatCurrencyShort(data.eventos.valor_assinado)} contratados`}
                    progress={{
                      paid: Math.round((data.eventos.valor_pago / data.eventos.valor_assinado) * 100),
                      pending: Math.round(((data.eventos.valor_assinado - data.eventos.valor_pago) / data.eventos.valor_assinado) * 100),
                    }}
                    accent="var(--transfers-color-eventos)"
                  />
                </div>

                {/* Alertas - Todos */}
                <div className="space-y-2 mt-6">
                  {data.alertas.vencidos > 0 && (
                    <AlertBanner
                      icon={<AlertTriangle />}
                      message={`${data.alertas.vencidos} processos com vigência vencida`}
                      linkText="Ver processos"
                      onLinkClick={() => {}}
                      variant="danger"
                    />
                  )}
                  {data.alertas.vence_30d > 0 && (
                    <AlertBanner
                      icon={<Calendar />}
                      message={`${data.alertas.vence_30d} processos vencem nos próximos 30 dias`}
                      linkText="Ver processos"
                      onLinkClick={() => {}}
                      variant="warning"
                    />
                  )}
                  {data.parcelas.valor_pendente > 0 && (
                    <AlertBanner
                      icon={<DollarSign />}
                      message={`R$ ${formatCurrencyShort(data.parcelas.valor_pendente)} em parcelas pendentes de pagamento (${data.parcelas.parcelas_pendentes} parcelas)`}
                      linkText="Ver parcelas"
                      onLinkClick={() => {}}
                      variant="warning"
                    />
                  )}
                  {data.obras.em_prestacao > 0 && (
                    <AlertBanner
                      icon={<FileText />}
                      message={`${data.obras.em_prestacao} processos em análise de prestação de contas`}
                      linkText="Ver processos"
                      onLinkClick={() => {}}
                      variant="info"
                    />
                  )}
                </div>
              </>
            )}

            {/* Aba Obras turísticas */}
            {category === 'obras' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <KpiCard
                    label="TOTAL DE PROCESSOS"
                    value={data.obras.total_processos.toString()}
                    subtext={`${data.obras.municipios} municípios atendidos`}
                    accent="var(--transfers-color-obras)"
                  />
                  <KpiCard
                    label="VALOR DO CONCEDENTE"
                    value={formatCurrencyShort(data.obras.valor_concedente)}
                    subtext={`Contrapartida: ${formatCurrencyShort(data.obras.valor_contrapartida)}`}
                    accent="var(--transfers-color-obras)"
                  />
                  <KpiCard
                    label="VALOR PAGO — PARCELAS"
                    value={formatCurrencyShort(data.parcelas.valor_pago)}
                    subtext={`${data.parcelas.parcelas_pagas} de ${data.parcelas.total_parcelas} parcelas pagas`}
                    progress={{
                      paid: Math.round((data.parcelas.valor_pago / data.parcelas.valor_total) * 100),
                      pending: Math.round((data.parcelas.valor_pendente / data.parcelas.valor_total) * 100),
                    }}
                    accent="var(--transfers-success)"
                  />
                  <KpiCard
                    label="VALOR PENDENTE"
                    value={formatCurrencyShort(data.parcelas.valor_pendente)}
                    subtext={`${data.parcelas.parcelas_pendentes} parcelas aguardando pagamento`}
                    badge={{ text: "Atenção", variant: "warning" }}
                    accent="var(--transfers-warning)"
                  />
                  <KpiCard
                    label="CONTRATOS ASSINADOS"
                    value={data.obras.contratos_assinados.toString()}
                    subtext={`de ${data.obras.total_processos} processos (${formatPercent(data.obras.contratos_assinados, data.obras.total_processos)})`}
                    accent="var(--transfers-color-obras)"
                  />
                  <KpiCard
                    label="EM PRESTAÇÃO DE CONTAS"
                    value={data.obras.em_prestacao.toString()}
                    subtext="processos ativos"
                    badge={{ text: "Em análise", variant: "warning" }}
                    accent="var(--transfers-warning)"
                  />
                </div>

                {/* Alertas - Obras */}
                <div className="space-y-2 mt-6">
                  {data.alertas.vencidos > 0 && (
                    <AlertBanner
                      icon={<AlertTriangle />}
                      message={`${data.alertas.vencidos} processos com vigência vencida`}
                      linkText="Ver processos"
                      onLinkClick={() => {}}
                      variant="danger"
                    />
                  )}
                  {data.alertas.vence_30d > 0 && (
                    <AlertBanner
                      icon={<Calendar />}
                      message={`${data.alertas.vence_30d} processos vencem nos próximos 30 dias`}
                      linkText="Ver processos"
                      onLinkClick={() => {}}
                      variant="warning"
                    />
                  )}
                  {data.parcelas.valor_pendente > 0 && (
                    <AlertBanner
                      icon={<DollarSign />}
                      message={`R$ ${formatCurrencyShort(data.parcelas.valor_pendente)} em parcelas pendentes de pagamento (${data.parcelas.parcelas_pendentes} parcelas)`}
                      linkText="Ver parcelas"
                      onLinkClick={() => {}}
                      variant="warning"
                    />
                  )}
                  {data.obras.em_prestacao > 0 && (
                    <AlertBanner
                      icon={<FileText />}
                      message={`${data.obras.em_prestacao} processos em análise de prestação de contas`}
                      linkText="Ver processos"
                      onLinkClick={() => {}}
                      variant="info"
                    />
                  )}
                </div>
              </>
            )}

            {/* Aba Eventos */}
            {category === 'eventos' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <KpiCard
                    label="TOTAL DE EVENTOS"
                    value={data.eventos.total_eventos.toString()}
                    subtext={`${data.eventos.municipios} municípios contemplados`}
                    accent="var(--transfers-color-eventos)"
                  />
                  <KpiCard
                    label="VALOR TOTAL CONTRATADO"
                    value={formatCurrencyShort(data.eventos.valor_assinado)}
                    subtext={`de ${formatCurrencyShort(data.eventos.valor_total)} publicados`}
                    accent="var(--transfers-color-eventos)"
                  />
                  <KpiCard
                    label="VALOR PAGO"
                    value={formatCurrencyShort(data.eventos.valor_pago)}
                    subtext={`${formatPercent(data.eventos.valor_pago, data.eventos.valor_assinado)} do contratado`}
                    progress={{
                      paid: Math.round((data.eventos.valor_pago / data.eventos.valor_assinado) * 100),
                      pending: Math.round(((data.eventos.valor_assinado - data.eventos.valor_pago) / data.eventos.valor_assinado) * 100),
                    }}
                    accent="var(--transfers-success)"
                  />
                  <KpiCard
                    label="CONTRATOS ASSINADOS"
                    value={data.eventos.assinados.toString()}
                    subtext={`${formatPercent(data.eventos.assinados, data.eventos.total_eventos)} do total de eventos`}
                    badge={{ text: "Ativos", variant: "success" }}
                    accent="var(--transfers-color-eventos)"
                  />
                  <KpiCard
                    label="PENDENTES DE ASSINATURA"
                    value={data.eventos.pendentes.toString()}
                    subtext="aguardando formalização"
                    badge={{ text: "Atenção", variant: "warning" }}
                    accent="var(--transfers-warning)"
                  />
                  <KpiCard
                    label="ARQUIVADOS"
                    value={data.eventos.arquivados.toString()}
                    subtext={`${formatPercent(data.eventos.arquivados, data.eventos.total_eventos)} dos processos`}
                    accent="var(--transfers-text-muted)"
                  />
                </div>

                {/* Alertas - Eventos */}
                <div className="space-y-2 mt-6">
                  {data.eventos.pendentes > 0 && (
                    <AlertBanner
                      icon={<FileText />}
                      message={`${data.eventos.pendentes} eventos pendentes de assinatura de contrato`}
                      linkText="Ver eventos"
                      onLinkClick={() => {}}
                      variant="warning"
                    />
                  )}
                  {(data.eventos.valor_assinado - data.eventos.valor_pago) > 0 && (
                    <AlertBanner
                      icon={<DollarSign />}
                      message={`R$ ${formatCurrencyShort(data.eventos.valor_assinado - data.eventos.valor_pago)} em eventos contratados ainda não pagos`}
                      linkText="Ver eventos"
                      onLinkClick={() => {}}
                      variant="info"
                    />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ÁREA PROTEGIDA — NÃO ALTERAR nesta fase do projeto (reorganização de navegação).
          Qualquer mudança necessária aqui deve ser registrada como sugestão futura, não implementada. */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Sobre o Sistema</h3>
            <div className="h-8 w-8 rounded-full bg-[var(--accent-green)] flex items-center justify-center">
              <span className="text-white text-sm font-bold">SC</span>
            </div>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              O Transfer Radar é o sistema oficial de monitoramento das transferências 
              financeiras do Estado de Santa Catarina para os municípios.
            </p>
            <p>
              Desenvolvido pela GEINFRA/SETUR, oferece transparência e controle 
              sobre os recursos públicos investidos em infraestrutura municipal.
            </p>
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-[var(--accent-green)] font-medium">
                Portal desenvolvido pela GEINFRA/SETUR - Governo do Estado de SC
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
