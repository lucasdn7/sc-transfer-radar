
import { OptimizedStatsCards } from "@/components/dashboard/OptimizedStatsCards";
import { StatusDistribution } from "@/components/dashboard/StatusDistribution";
import { ProcessInsights } from "@/components/dashboard/ProcessInsights";
import { ProcessChart, RegionChart } from "@/components/dashboard/Charts";
import { DashboardMetricsSelector } from "@/components/dashboard/DashboardMetricsSelector";
import { TransferProgressBar } from "@/components/dashboard/TransferProgressBar";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

export default function Dashboard() {
  const { selectedMetrics, setSelectedMetrics, metricsData, isLoading } = useDashboardMetrics();

  const enabledMetrics = selectedMetrics.filter(m => m.enabled);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das transferências financeiras do Estado de SC para os municípios
        </p>
      </div>

      <OptimizedStatsCards />

      {/* Barra de Progressão das Transferências */}
      <TransferProgressBar />

      {/* Seletor de Métricas */}
      <DashboardMetricsSelector
        metrics={selectedMetrics}
        onMetricsChange={setSelectedMetrics}
      />

      {/* Gráficos Personalizáveis */}
      {enabledMetrics.length > 0 && (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {enabledMetrics.map((metric) => (
            <Card key={metric.key}>
              <CardHeader>
                <CardTitle className="text-base">{metric.label}</CardTitle>
                <p className="text-sm text-muted-foreground">{metric.description}</p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Carregando...</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    {metric.key === 'percentual_executado' ? (
                      <PieChart>
                        <Pie
                          data={metricsData[metric.key] || []}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {(metricsData[metric.key] || []).map((entry: any, index: number) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280"][index % 5]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, 'Percentual']} />
                      </PieChart>
                    ) : (
                      <BarChart data={metricsData[metric.key] || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis 
                          tickFormatter={(value) => 
                            new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            }).format(value)
                          }
                        />
                        <Tooltip 
                          formatter={(value) => [
                            new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(Number(value)),
                            metric.label
                          ]}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#3b82f6" 
                          radius={[4, 4, 0, 0]} 
                          name={metric.label}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProcessChart />
        </div>
        <div className="lg:col-span-1">
          <StatusDistribution />
        </div>
      </div>

      <ProcessInsights />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <RegionChart regionalData={[]} />
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sobre o Sistema</h3>
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">SC</span>
            </div>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              O Transfer Radar é o sistema oficial de monitoramento das transferências 
              financeiras do Estado de Santa Catarina para os municípios.
            </p>
            <p>
              Desenvolvido pela GEINFRA/SETUR, oferece transparência e controle 
              sobre os recursos públicos investidos em infraestrutura municipal.
            </p>
            <div className="pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-600 font-medium">
                Portal desenvolvido pela GEINFRA/SETUR - Governo do Estado de SC
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
