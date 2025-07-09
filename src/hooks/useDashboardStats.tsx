
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalProcesses: number;
  totalValue: number;
  activeMunicipalities: number;
  regionalNucleiCount: number;
  statusDistribution: Record<string, number>;
  statusData?: Array<{ status: string; count: number; percentage: number }>;
  regionalData?: Array<{ region: string; count: number; value: number }>;
  executionStats?: {
    notStarted: number;
    inProgress: number;
    completed: number;
  };
  processes?: Array<any>;
  lastUpdated: string;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
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
            .select(`
              total_portaria_value, 
              municipality_id, 
              status_id,
              municipalities (name),
              regional_nuclei (name, acronym),
              status_processos (nome, cor),
              process_parcels (
                value,
                payment_date
              )
            `),
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
          throw processesResult.error;
        }

        if (municipalitiesResult.error) {
          throw municipalitiesResult.error;
        }

        if (regionalNucleiResult.error) {
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

        // Preparar dados para gráficos
        const statusData = Object.entries(statusDistribution).map(([status, count]) => ({
          status,
          count: count as number,
          percentage: Math.round(((count as number) / totalProcesses) * 100)
        }));

        const regionalDistribution = processes.reduce((acc: any, process) => {
          const region = process.regional_nuclei?.name || 'Não definido';
          if (!acc[region]) {
            acc[region] = { count: 0, value: 0 };
          }
          acc[region].count += 1;
          acc[region].value += process.total_portaria_value || 0;
          return acc;
        }, {});

        const regionalData = Object.entries(regionalDistribution).map(([region, data]: [string, any]) => ({
          region: region.length > 15 ? region.substring(0, 15) + '...' : region,
          count: data.count,
          value: data.value
        }));

        // Calcular estatísticas de execução baseadas nos status
        // Assumindo que alguns status representam diferentes estados de execução
        const executionStats = {
          notStarted: statusDistribution['Em Análise'] || 0,
          inProgress: (statusDistribution['Em Execução'] || 0) + (statusDistribution['Aprovados'] || 0),
          completed: statusDistribution['Finalizados'] || 0,
        };

        return {
          totalProcesses,
          totalValue,
          activeMunicipalities: uniqueMunicipalities,
          regionalNucleiCount: regionalNuclei.length,
          statusDistribution,
          statusData,
          regionalData,
          executionStats,
          processes,
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        // Em caso de erro, retornar valores padrão para não quebrar a UI
        return {
          totalProcesses: 0,
          totalValue: 0,
          activeMunicipalities: 0,
          regionalNucleiCount: 0,
          statusDistribution: {},
          statusData: [],
          regionalData: [],
          executionStats: {
            notStarted: 0,
            inProgress: 0,
            completed: 0,
          },
          processes: [],
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
