
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRegionalNuclei(searchTerm: string) {
  return useQuery({
    queryKey: ['regional-nuclei', searchTerm],
    queryFn: async () => {
      console.log('Fetching regional nuclei with search:', searchTerm);
      
      let query = supabase
        .from('regional_nuclei')
        .select(`
          *,
          regioes (nome, sigla),
          municipalities (id, name)
        `)
        .order('name', { ascending: true });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching regional nuclei:', error);
        throw error;
      }
      
      console.log('Regional nuclei fetched:', data);
      return data || [];
    }
  });
}

export function useNucleiStats() {
  return useQuery({
    queryKey: ['nuclei-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          regional_nucleus_id,
          total_portaria_value,
          status_processos (nome)
        `);
      
      if (error) throw error;
      
      const stats = data?.reduce((acc: any, process) => {
        const nucleusId = process.regional_nucleus_id;
        if (!nucleusId) return acc;
        
        if (!acc[nucleusId]) {
          acc[nucleusId] = {
            totalProcesses: 0,
            totalValue: 0,
            statuses: {}
          };
        }
        acc[nucleusId].totalProcesses += 1;
        acc[nucleusId].totalValue += process.total_portaria_value || 0;
        
        const status = process.status_processos?.nome || 'Não definido';
        acc[nucleusId].statuses[status] = (acc[nucleusId].statuses[status] || 0) + 1;
        
        return acc;
      }, {});
      
      return stats || {};
    }
  });
}
