
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalProcesses: number;
  totalValue: number;
  activeMunicipalities: number;
  regionalNucleiCount: number;
  statusDistribution: Record<string, number>;
  lastUpdated: string;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats-cached'],
    queryFn: async (): Promise<DashboardStats> => {
      console.log('Fetching cached dashboard statistics...');
      
      const { data: stats, error } = await supabase
        .from('dashboard_stats')
        .select('*');
      
      if (error) {
        console.error('Error fetching cached stats:', error);
        throw error;
      }

      // Converter dados cached para formato esperado
      const statsMap = stats?.reduce((acc, stat) => {
        acc[stat.stat_key] = stat.stat_value;
        return acc;
      }, {} as Record<string, any>) || {};

      return {
        totalProcesses: statsMap.total_processes || 0,
        totalValue: statsMap.total_value || 0,
        activeMunicipalities: statsMap.active_municipalities || 0,
        regionalNucleiCount: statsMap.regional_nuclei_count || 0,
        statusDistribution: statsMap.status_distribution || {},
        lastUpdated: stats?.[0]?.last_updated || new Date().toISOString()
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // Atualizar a cada 10 minutos
  });
}
