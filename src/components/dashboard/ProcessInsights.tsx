
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/utils/processUtils";
import { Calendar, TrendingUp, AlertCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ProcessStatus = Database['public']['Enums']['process_status'];

export function ProcessInsights() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['process-insights'],
    queryFn: async () => {
      console.log('Fetching process insights...');
      
      // Processos recentes
      const { data: recentProcesses, error: recentError } = await supabase
        .from('processes')
        .select(`
          *,
          municipalities (name, region)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      // Processos com vigência próxima
      const { data: expiringProcesses, error: expiringError } = await supabase
        .from('processes')
        .select(`
          *,
          municipalities (name)
        `)
        .gte('vigencia_date', new Date().toISOString().split('T')[0])
        .lte('vigencia_date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('vigencia_date', { ascending: true })
        .limit(5);

      if (expiringError) throw expiringError;

      return {
        recent: recentProcesses || [],
        expiring: expiringProcesses || []
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Processos Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Processos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights?.recent?.map((process) => (
              <div key={process.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{process.process_number}</p>
                  <p className="text-xs text-gray-600 truncate">{process.municipalities?.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(process.total_portaria_value)}</p>
                </div>
                <Badge className={getStatusColor(process.current_status as ProcessStatus)}>
                  {getStatusLabel(process.current_status as ProcessStatus)}
                </Badge>
              </div>
            ))}
            
            {(!insights?.recent || insights.recent.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                Nenhum processo recente encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processos com Vigência Próxima */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
            Vigências Próximas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights?.expiring?.map((process) => (
              <div key={process.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{process.process_number}</p>
                  <p className="text-xs text-gray-600 truncate">{process.municipalities?.name}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(process.vigencia_date)}
                  </div>
                </div>
                <Badge variant="outline" className="border-orange-300 text-orange-700">
                  {Math.ceil((new Date(process.vigencia_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                </Badge>
              </div>
            ))}
            
            {(!insights?.expiring || insights.expiring.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                Nenhum processo com vigência próxima
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
