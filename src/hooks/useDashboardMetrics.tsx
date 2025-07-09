
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MetricOption } from "@/components/dashboard/DashboardMetricsSelector";

interface ProcessMetrics {
  total_portaria_value: number;
  total_concedente_value: number;
  total_proponente_value: number;
  licitado_value: number;
  created_at: string;
  municipalities?: { name: string };
  regional_nuclei?: { name: string };
  process_parcels?: Array<{
    value: number;
    payment_date: string | null;
  }>;
}

export function useDashboardMetrics() {
  const [selectedMetrics, setSelectedMetrics] = useState<MetricOption[]>([
    {
      key: "valor_total_portaria",
      label: "Valor Total Portaria",
      description: "Valor total definido na portaria do processo",
      enabled: true
    },
    {
      key: "valor_concedente",
      label: "Valor Concedente",
      description: "Valor a ser repassado pelo concedente (Estado)",
      enabled: true
    },
    {
      key: "valor_contrapartida",
      label: "Valor de Contrapartida",
      description: "Valor de contrapartida do proponente (Município)",
      enabled: false
    },
    {
      key: "valor_licitacao",
      label: "Valor Licitação",
      description: "Valor final após processo licitatório",
      enabled: false
    },
    {
      key: "saldo_repassar",
      label: "Saldo a Repassar",
      description: "Diferença entre valor concedente e parcelas pagas",
      enabled: false
    },
    {
      key: "percentual_executado",
      label: "Percentual Executado",
      description: "Percentual do valor concedente já pago em parcelas",
      enabled: false
    }
  ]);

  // Buscar dados dos processos
  const { data: processesData } = useQuery({
    queryKey: ['dashboard-metrics-processes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          total_portaria_value,
          total_concedente_value,
          total_proponente_value,
          licitado_value,
          created_at,
          municipalities (name),
          regional_nuclei (name),
          process_parcels (
            value,
            payment_date
          )
        `);
      
      if (error) throw error;
      return data as ProcessMetrics[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Calcular métricas baseadas nos dados
  const calculateMetrics = () => {
    if (!processesData) return {};

    const metrics: Record<string, any[]> = {};

    // Agrupar por mês
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const groupByMonth = (data: ProcessMetrics[], valueExtractor: (item: ProcessMetrics) => number) => {
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        name: monthNames[i],
        value: 0
      }));

      data.forEach(process => {
        const month = new Date(process.created_at).getMonth();
        monthlyData[month].value += valueExtractor(process);
      });

      return monthlyData.filter(item => item.value > 0);
    };

    // Valor Total Portaria
    metrics.valor_total_portaria = groupByMonth(
      processesData, 
      (p) => p.total_portaria_value || 0
    );

    // Valor Concedente
    metrics.valor_concedente = groupByMonth(
      processesData, 
      (p) => p.total_concedente_value || 0
    );

    // Valor Contrapartida
    metrics.valor_contrapartida = groupByMonth(
      processesData, 
      (p) => p.total_proponente_value || 0
    );

    // Valor Licitação
    metrics.valor_licitacao = groupByMonth(
      processesData.filter(p => p.licitado_value), 
      (p) => p.licitado_value || 0
    );

    // Saldo a Repassar
    metrics.saldo_repassar = groupByMonth(
      processesData,
      (p) => {
        const valorConcedente = p.total_concedente_value || 0;
        const valorPago = (p.process_parcels || [])
          .filter(parcel => parcel.payment_date)
          .reduce((sum, parcel) => sum + parcel.value, 0);
        return valorConcedente - valorPago;
      }
    );

    // Percentual Executado
    metrics.percentual_executado = processesData.map(p => {
      const valorConcedente = p.total_concedente_value || 0;
      const valorPago = (p.process_parcels || [])
        .filter(parcel => parcel.payment_date)
        .reduce((sum, parcel) => sum + parcel.value, 0);
      
      const percentual = valorConcedente > 0 ? (valorPago / valorConcedente) * 100 : 0;
      
      return {
        name: p.municipalities?.name || 'Não definido',
        value: Math.round(percentual)
      };
    }).filter(item => item.value > 0);

    return metrics;
  };

  return {
    selectedMetrics,
    setSelectedMetrics,
    metricsData: calculateMetrics(),
    isLoading: !processesData
  };
}
