
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
          regionalNucleiResult,
          statusResult
        ] = await Promise.all([
          supabase
            .from('processes')
            .select('total_portaria_value, municipality_id, status_id'),
          supabase
            .from('municipalities')
            .select('id'),
          supabase
            .from('regional_nuclei')
            .select('id'),
          supabase
            .from('status_processos')
            .select('id, nome')
        ]);

        // Verificar erros
        if (processesResult.error) {
          console.error('Error fetching processes:', processesResult.error);
          throw processesResult.error;
        }

        if (municipalitiesResult.error) {
          console.error('Error fetching municipalities:', municipalitiesResult.error);
          throw municipalitiesResult.error;
        }

        if (regionalNucleiResult.error) {
          console.error('Error fetching regional nuclei:', regionalNucleiResult.error);
          throw regionalNucleiResult.error;
        }

        const processes = processesResult.data || [];
        const municipalities = municipalitiesResult.data || [];
        const regionalNuclei = regionalNucleiResult.data || [];
        const statusList = statusResult.data || [];

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
        const statusMap = statusList.reduce((acc, status) => {
          acc[status.id] = status.nome;
          return acc;
        }, {} as Record<number, string>);

        const statusDistribution = processes.reduce((acc, process) => {
          const statusName = statusMap[process.status_id] || 'Não definido';
          acc[statusName] = (acc[statusName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log('Dashboard stats calculated successfully:', {
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
        // Em caso de erro, retornar valores padrão para não quebrar a UI
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
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
