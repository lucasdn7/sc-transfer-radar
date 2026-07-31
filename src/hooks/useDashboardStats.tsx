
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const isArchivedContract = (value: unknown) => value === "arquivado";

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
  repasseStats?: {
    municipiosRepasseConcluido: number;
    municipiosPrimeiraParcela: number;
  };
  contratosAssinados: number;
  valorContratos: number;
  pctContratosAssinadosPorValor: number;
  saldoARepassar: number;
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
          statusResult,
          obrasDashboardResult
        ] = await Promise.all([
          supabase
            .from('processes')
            .select(`
              total_portaria_value, 
              total_concedente_value,
              municipality_id, 
              status_id,
              contrato_assinado,
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
            .select('id, nome'),
          (supabase as any)
            .from('vw_dashboard_obras')
            .select('pct_processos_contrato_assinado')
            .maybeSingle()
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

        const processes = (processesResult.data || []).filter((process: any) => !isArchivedContract(process.contrato_assinado));
        const municipalities = municipalitiesResult.data || [];
        const regionalNuclei = regionalNucleiResult.data || [];
        const statusList = statusResult.data || [];

        // Calcular estatísticas
        const totalProcesses = processes.length;
        const totalValue = processes.reduce((sum, process) => 
          sum + (process.total_concedente_value || 0), 0
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

        // Nova lógica para indicadores de status - ATUALIZADA para usar apenas "Executado/Finalizado"
        const statusNomes = {
          concluido: ["Executado/Finalizado"],
          execucao: [
            "Contrato assinado",
            "Em pagamento",
            "Termo de aditivo",
            "Prestação de contas"
          ]
        };

        let completed = 0;
        let inProgress = 0;
        let notStarted = 0;

        processes.forEach((process: any) => {
          const nomeStatus = process.status_processos?.nome || statusMap[process.status_id] || 'Não definido';
          if (statusNomes.concluido.includes(nomeStatus)) {
            completed++;
          } else if (statusNomes.execucao.includes(nomeStatus)) {
            inProgress++;
          } else {
            notStarted++;
          }
        });

        const executionStats = {
          notStarted,
          inProgress,
          completed
        };

        // Indicadores de repasse por processo
        let processosRepasseConcluido = 0;
        let processosPrimeiraParcela = 0;
        let valorRepassadoContratosAssinados = 0;

        processes.forEach((process: any) => {
          const parcels = process.process_parcels || [];
          const paidParcels = parcels.filter((parcel: any) => parcel.payment_date);
          const paidValue = paidParcels.reduce((sum: number, parcel: any) => sum + (parcel.value || 0), 0);
          if (process.contrato_assinado === true) {
            valorRepassadoContratosAssinados += paidValue;
          }

          if (parcels.length > 0 && paidParcels.length === parcels.length) {
            processosRepasseConcluido++;
          }

          if (paidValue > 0 && (process.total_concedente_value || 0) - paidValue > 0) {
            processosPrimeiraParcela++;
          }
        });

        const repasseStats = {
          municipiosRepasseConcluido: processosRepasseConcluido,
          municipiosPrimeiraParcela: processosPrimeiraParcela
        };

        // Contratos assinados
        const contratosAssinados = processes.filter((p: any) => p.contrato_assinado === true).length;
        const valorContratos = processes
          .filter((p: any) => p.contrato_assinado === true)
          .reduce((sum: number, p: any) => sum + (p.total_concedente_value || 0), 0);
        const pctContratosAssinadosPorValor = valorContratos > 0 ? (valorRepassadoContratosAssinados / valorContratos) * 100 : 0;
        const saldoARepassar = valorContratos - valorRepassadoContratosAssinados;

        return {
          totalProcesses,
          totalValue,
          activeMunicipalities: uniqueMunicipalities,
          regionalNucleiCount: regionalNuclei.length,
          statusDistribution,
          statusData,
          regionalData,
          executionStats,
          repasseStats,
          contratosAssinados,
          valorContratos,
          pctContratosAssinadosPorValor,
          saldoARepassar,
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
          repasseStats: {
            municipiosRepasseConcluido: 0,
            municipiosPrimeiraParcela: 0,
          },
          contratosAssinados: 0,
          valorContratos: 0,
          pctContratosAssinadosPorValor: 0,
          saldoARepassar: 0,
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
