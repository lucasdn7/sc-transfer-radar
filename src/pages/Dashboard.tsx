import { Component, MouseEvent, ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";
import { OptimizedStatsCards } from "@/components/dashboard/OptimizedStatsCards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { TransferProgressBar } from "@/components/dashboard/TransferProgressBar";
import { ProcessStatusOverview } from "@/components/dashboard/ProcessStatusOverview";
import { CollapsibleCard } from "@/components/dashboard/CollapsibleCard";
import { EventStatsCards } from "@/components/dashboard/EventStatsCards";
import { EventDashboardCharts } from "@/components/dashboard/EventDashboardCharts";
import { EventCalendar } from "@/components/dashboard/EventCalendar";
import { TotalStatsCards } from "@/components/dashboard/TotalStatsCards";
import { TotalDashboardCharts } from "@/components/dashboard/TotalDashboardCharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const indicatorDestinations: Record<string, string> = {
  "Total de Processos": "/processes",
  "Total das Portarias": "/processes?filter=portarias",
  "Municípios Beneficiados": "/municipalities",
  "Núcleos Regionais": "/regional-nuclei",
  "Processos com Repasse Concluído": "/processes?transfer=completed",
  "Processos com 1ª Parcela Paga (Parcial)": "/processes?transfer=partial",
  "Processos com a 1ª parcela paga": "/processes?transfer=partial",
  "Processos com 1ª Parcela Paga": "/processes?transfer=partial",
  "Saldo a Repassar": "/processes?transfer=pending",
  "Saldo a repassar": "/processes?transfer=pending",
  "Contratos Assinados": "/processes?contract=signed",
  "Valores dos Contratos": "/processes?contract=signed",
  "Valor Total Contratado": "/processes?contract=signed",
};

class DashboardErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar o dashboard</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>Atualize a página para tentar novamente.</span>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Atualizar página
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

function DashboardIndicatorNavigation({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const handleIndicatorClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, button")) return;

    const card = target.closest(".rounded-2xl.border.bg-card");
    const title = card?.querySelector(".metric-label")?.textContent?.trim();
    const destination = title ? indicatorDestinations[title] : undefined;

    if (destination) navigate(destination);
  };

  return <div onClick={handleIndicatorClick}>{children}</div>;
}

export default function Dashboard() {
  const [dashboardMode, setDashboardMode] = useState<"obras" | "eventos" | "total">("obras");

  return (
    <div className="w-full min-w-0 space-y-6 px-4 sm:px-5 md:px-6 lg:px-8" role="main" aria-label="Dashboard de transferências">
      <div>
        <div className="rounded-2xl border border-border bg-card p-4 md:p-6 lg:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <p className="metric-label mb-3">Visão geral</p>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">Seu painel de transferências quer te contar uns segredos...</h1>
              <p className="mt-3 max-w-3xl text-sm md:text-base text-muted-foreground">
                Visão geral das transferências financeiras do Estado de SC para os municípios
              </p>
            </div>
            <Tabs value={dashboardMode} onValueChange={(value) => setDashboardMode(value as "obras" | "eventos" | "total")} className="mt-4 md:mt-0">
              <TabsList aria-label="Alternar visão do dashboard">
                <TabsTrigger value="obras">Obras</TabsTrigger>
                <TabsTrigger value="eventos">Eventos</TabsTrigger>
                <TabsTrigger value="total">Total</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <DashboardErrorBoundary>
        <DashboardIndicatorNavigation>
          {dashboardMode === "obras" ? (
            <>
              <CollapsibleCard id="stats-cards"><OptimizedStatsCards /></CollapsibleCard>
              <CollapsibleCard id="transfer-progress"><TransferProgressBar /></CollapsibleCard>
              <CollapsibleCard id="process-status"><ProcessStatusOverview /></CollapsibleCard>
              <CollapsibleCard id="dashboard-charts"><DashboardCharts /></CollapsibleCard>
            </>
          ) : dashboardMode === "eventos" ? (
            <>
              <CollapsibleCard id="event-stats-cards"><EventStatsCards /></CollapsibleCard>
              <CollapsibleCard id="event-dashboard-charts"><EventDashboardCharts /></CollapsibleCard>
              <CollapsibleCard id="event-calendar"><EventCalendar /></CollapsibleCard>
            </>
          ) : (
            <>
              <CollapsibleCard id="total-stats-cards"><TotalStatsCards /></CollapsibleCard>
              <CollapsibleCard id="total-dashboard-charts"><TotalDashboardCharts /></CollapsibleCard>
            </>
          )}
        </DashboardIndicatorNavigation>
      </DashboardErrorBoundary>

      {/* ÁREA PROTEGIDA — NÃO ALTERAR nesta fase do projeto (reorganização de navegação).
          Qualquer mudança necessária aqui deve ser registrada como sugestão futura, não implementada. */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
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
