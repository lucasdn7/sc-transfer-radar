
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
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      console.log('Fetching dashboard statistics...');
      
      try {
        // Buscar estatísticas em paralelo para melhor performance
        const [
          processesResult,
          municipalitiesResult,
          regionalNucleiResult
        ] = await Promise.all([
          supabase
            .from('processes')
            .select('total_portaria_value, current_status, municipality_id'),
          supabase
            .from('municipalities')
            .select('id'),
          supabase
            .from('regional_nuclei')
            .select('id')
        ]);

        // Verificar erros
        if (processesResult.error) {
          console.error('Error fetching processes:', processesResult.error);
        }

        if (municipalitiesResult.error) {
          console.error('Error fetching municipalities:', municipalitiesResult.error);
        }

        if (regionalNucleiResult.error) {
          console.error('Error fetching regional nuclei:', regionalNucleiResult.error);
        }

        const processes = processesResult.data || [];
        const municipalities = municipalitiesResult.data || [];
        const regionalNuclei = regionalNucleiResult.data || [];

        // Calcular estatísticas
        const totalProcesses = processes.length;
        const totalValue = processes.reduce((sum, process) => 
          sum + (process.total_portaria_value || 0), 0
        );
        
        // Contar municípios únicos que têm processos
        const uniqueMunicipalities = new Set(
          processes.map(p => p.municipality_id).filter(Boolean)
        ).size;
        
        // Distribuição por status
        const statusDistribution = processes.reduce((acc, process) => {
          const status = process.current_status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log('Dashboard stats calculated:', {
          totalProcesses,
          totalValue,
          activeMunicipalities: uniqueMunicipalities,
          regionalNucleiCount: regionalNuclei.length,
          statusDistribution
        });

        return {
          totalProcesses,
          totalValue,
          activeMunicipalities: uniqueMunicipalities,
          regionalNucleiCount: regionalNuclei.length,
          statusDistribution,
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error in useDashboardStats:', error);
        // Retornar valores padrão em caso de erro
        return {
          totalProcesses: 0,
          totalValue: 0,
          activeMunicipalities: 0,
          regionalNucleiCount: 0,
          statusDistribution: {},
          lastUpdated: new Date().toISOString()
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // Atualizar a cada 10 minutos
    retry: 3,
    retryDelay: 1000,
  });
}
