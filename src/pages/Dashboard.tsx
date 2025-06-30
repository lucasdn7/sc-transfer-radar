
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ProcessChart, StatusChart, RegionChart } from "@/components/dashboard/Charts";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das transferências financeiras do Estado de SC para os municípios
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProcessChart />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <StatusChart />
        <RegionChart />
      </div>
    </div>
  );
}
