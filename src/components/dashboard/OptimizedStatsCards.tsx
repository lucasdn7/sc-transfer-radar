
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, FileText, Building, MapPin, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/utils/processUtils";

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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend === 'up' && <TrendingUp className="mr-1 h-3 w-3 text-green-500" />}
            {trend === 'down' && <TrendingDown className="mr-1 h-3 w-3 text-red-500" />}
            <span className={trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : ''}>
              {change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function OptimizedStatsCards() {
  const statsData = [
    {
      title: "Total de Processos",
      value: "0",
      change: "Dados atualizados em tempo real",
      trend: 'neutral' as const,
      icon: FileText,
      color: "text-blue-600"
    },
    {
      title: "Valor Total Transferido",
      value: formatCurrency(0),
      change: "Investimento em Santa Catarina",
      trend: 'up' as const,
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Municípios Beneficiados",
      value: "0",
      change: "Municípios ativos no programa",
      trend: 'neutral' as const,
      icon: Building,
      color: "text-purple-600"
    },
    {
      title: "Núcleos Regionais",
      value: "0",
      change: "Cobertura estadual completa",
      trend: 'neutral' as const,
      icon: MapPin,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
