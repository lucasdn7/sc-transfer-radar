import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { flowchartStatusMap } from './flowchartConfig';

export function useProcessCountsByNode(nucleusFilter?: string) {
  return useQuery({
    queryKey: ['flowchart-counts', nucleusFilter],
    queryFn: async () => {
      let query = supabase
        .from('processes')
        .select('id, status_processos(nome), regional_nucleus_id');

      if (nucleusFilter && nucleusFilter !== 'all') {
        query = query.eq('regional_nucleus_id', Number(nucleusFilter));
      }

      const { data, error } = await query;
      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const p of data || []) {
        const statusName = (p.status_processos as any)?.nome;
        if (!statusName) continue;
        const nodeId = flowchartStatusMap[statusName];
        if (nodeId) {
          counts[nodeId] = (counts[nodeId] || 0) + 1;
        }
      }
      return counts;
    },
    refetchInterval: 30000,
  });
}

export function useSearchProcess(searchTerm: string) {
  return useQuery({
    queryKey: ['flowchart-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return null;

      const { data, error } = await supabase
        .from('processes')
        .select(`
          id, process_number, object, vigencia_date,
          total_portaria_value,
          municipalities(name),
          status_processos(nome, cor),
          regional_nucleus_id
        `)
        .ilike('process_number', `%${searchTerm}%`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: searchTerm.trim().length > 0,
  });
}

export function useProcessesForNode(nodeId: string | null, nucleusFilter?: string) {
  return useQuery({
    queryKey: ['flowchart-node-processes', nodeId, nucleusFilter],
    queryFn: async () => {
      if (!nodeId) return [];

      // Find which statuses map to this node
      const matchingStatuses = Object.entries(flowchartStatusMap)
        .filter(([, nId]) => nId === nodeId)
        .map(([status]) => status);

      if (matchingStatuses.length === 0) return [];

      // Get status IDs from status_processos
      const { data: statusRows } = await supabase
        .from('status_processos')
        .select('id, nome')
        .in('nome', matchingStatuses);

      if (!statusRows || statusRows.length === 0) return [];

      const statusIds = statusRows.map((s) => s.id);

      let query = supabase
        .from('processes')
        .select(`
          id, process_number, total_portaria_value, created_at,
          municipalities(name),
          status_processos(nome)
        `)
        .in('status_id', statusIds);

      if (nucleusFilter && nucleusFilter !== 'all') {
        query = query.eq('regional_nucleus_id', Number(nucleusFilter));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!nodeId,
  });
}
