import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { OptimizedStatsCards } from "@/components/dashboard/OptimizedStatsCards";
import { TransferProgressBar } from "@/components/dashboard/TransferProgressBar";
import { ProcessStatusOverview } from "@/components/dashboard/ProcessStatusOverview";
import { CollapsibleCard } from "@/components/dashboard/CollapsibleCard";
import { EventStatsCards } from "@/components/dashboard/EventStatsCards";
import { EventCalendar } from "@/components/dashboard/EventCalendar";
import { TotalStatsCards } from "@/components/dashboard/TotalStatsCards";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CategorySelector } from "@/components/transfers/CategorySelector";
import { useCategory } from "@/contexts/CategoryContext";

export default function Dashboard() {
  const { category } = useCategory();
  const [error, setError] = useState<string | null>(null);

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

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
        {category === 'todos' && (
          <div className="space-y-6">
            <CollapsibleCard id="total-stats-cards"><TotalStatsCards /></CollapsibleCard>
            <CollapsibleCard id="transfer-progress"><TransferProgressBar /></CollapsibleCard>
            <CollapsibleCard id="process-status"><ProcessStatusOverview /></CollapsibleCard>
          </div>
        )}
        {category === 'obras' && (
          <div className="space-y-6">
            <CollapsibleCard id="stats-cards"><OptimizedStatsCards /></CollapsibleCard>
            <CollapsibleCard id="transfer-progress"><TransferProgressBar /></CollapsibleCard>
            <CollapsibleCard id="process-status"><ProcessStatusOverview /></CollapsibleCard>
          </div>
        )}
        {category === 'eventos' && (
          <div className="space-y-6">
            <CollapsibleCard id="event-stats-cards"><EventStatsCards /></CollapsibleCard>
            <CollapsibleCard id="event-calendar"><EventCalendar /></CollapsibleCard>
          </div>
        )}
        {category === 'promo' && (
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
