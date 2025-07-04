
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  DollarSign, 
  Building, 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { formatCurrency } from "@/utils/processUtils";

interface StatsCardsProps {
  stats: {
    totalProcesses: number;
    totalValue: number;
    activeMunicipalities: number;
    regionalNucleiCount: number;
    monthlyGrowth?: {
      processes: number;
      value: number;
    };
    statusDistribution?: Record<string, number>;
  };
}

export function EnhancedStatsCards({ stats }: StatsCardsProps) {
  const growthData = stats.monthlyGrowth || { processes: 0, value: 0 };
  
  const cards = [
    {
      title: "Total de Processos Ativos",
      value: stats.totalProcesses,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      growth: growthData.processes,
      subtitle: "processos cadastrados"
    },
    {
      title: "Valor Total Repassado",
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      growth: growthData.value,
      subtitle: "em recursos transferidos"
    },
    {
      title: "Municípios Beneficiados",
      value: stats.activeMunicipalities,
      icon: Building,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      subtitle: "municípios atendidos"
    },
    {
      title: "Núcleos Regionais",
      value: stats.regionalNucleiCount,
      icon: MapPin,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      subtitle: "núcleos operantes"
    }
  ];

  const renderGrowthIndicator = (growth: number) => {
    if (growth === 0) return null;
    
    const isPositive = growth > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    const colorClass = isPositive ? "text-green-600" : "text-red-600";
    
    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">
          {Math.abs(growth)}% vs mês anterior
        </span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">
                    {typeof card.value === 'number' && card.title !== "Valor Total Repassado" 
                      ? card.value.toLocaleString('pt-BR')
                      : card.value
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {card.subtitle}
                  </p>
                </div>
                {card.growth !== undefined && renderGrowthIndicator(card.growth)}
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
