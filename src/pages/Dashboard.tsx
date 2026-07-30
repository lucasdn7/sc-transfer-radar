
import { OptimizedStatsCards } from "@/components/dashboard/OptimizedStatsCards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { TransferProgressBar } from "@/components/dashboard/TransferProgressBar";
import { ProcessStatusOverview } from "@/components/dashboard/ProcessStatusOverview";
import { ContractStatusOverview } from "@/components/dashboard/ContractStatusOverview";
import { CollapsibleCard } from "@/components/dashboard/CollapsibleCard";
import { EventStatsCards } from "@/components/dashboard/EventStatsCards";
import { EventDashboardCharts } from "@/components/dashboard/EventDashboardCharts";
import { EventCalendar } from "@/components/dashboard/EventCalendar";
import { TotalStatsCards } from "@/components/dashboard/TotalStatsCards";
import { TotalDashboardCharts } from "@/components/dashboard/TotalDashboardCharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function Dashboard() {
  const [dashboardMode, setDashboardMode] = useState<"obras" | "eventos" | "total">("obras");

  return (
    <div className="space-y-6">
      <div>
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="metric-label mb-3">Visão geral</p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Seu painel de transferências quer te contar uns segredos...</h1>
              <p className="mt-3 max-w-3xl text-muted-foreground">
                Visão geral das transferências financeiras do Estado de SC para os municípios
              </p>
            </div>
            <Tabs value={dashboardMode} onValueChange={(value) => setDashboardMode(value as "obras" | "eventos" | "total")}>
              <TabsList aria-label="Alternar visão do dashboard">
                <TabsTrigger value="obras">Obras</TabsTrigger>
                <TabsTrigger value="eventos">Eventos</TabsTrigger>
                <TabsTrigger value="total">Total</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {dashboardMode === "obras" ? (
        <>
          <CollapsibleCard id="stats-cards">
            <OptimizedStatsCards />
          </CollapsibleCard>

          {/* Status dos Contratos Firmados */}
          <CollapsibleCard id="contract-status">
            <ContractStatusOverview />
          </CollapsibleCard>

          {/* Barra de Progressão das Transferências */}
          <CollapsibleCard id="transfer-progress">
            <TransferProgressBar />
          </CollapsibleCard>

          {/* Status dos Processos */}
          <CollapsibleCard id="process-status">
            <ProcessStatusOverview />
          </CollapsibleCard>

          {/* Gráficos Personalizáveis */}
          <CollapsibleCard id="dashboard-charts">
            <DashboardCharts />
          </CollapsibleCard>
        </>
      ) : dashboardMode === "eventos" ? (
        <>
          <CollapsibleCard id="event-stats-cards">
            <EventStatsCards />
          </CollapsibleCard>

          <CollapsibleCard id="event-dashboard-charts">
            <EventDashboardCharts />
          </CollapsibleCard>

          <CollapsibleCard id="event-calendar">
            <EventCalendar />
          </CollapsibleCard>
        </>
      ) : (
        <>
          <CollapsibleCard id="total-stats-cards">
            <TotalStatsCards />
          </CollapsibleCard>

          <CollapsibleCard id="total-dashboard-charts">
            <TotalDashboardCharts />
          </CollapsibleCard>
        </>
      )}

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
