
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProcessHeader } from "./processes/ProcessHeader";
import { ProcessFilters } from "./processes/ProcessFilters";
import { ProcessTable } from "./processes/ProcessTable";
import { ProcessListLoading } from "./processes/ProcessListLoading";
import type { Database } from "@/integrations/supabase/types";

type ProcessStatus = Database['public']['Enums']['process_status'];

export function ProcessList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | "all">("all");

  const { data: processes, isLoading, error } = useQuery({
    queryKey: ['processes', searchTerm, statusFilter],
    queryFn: async () => {
      console.log('Fetching processes with optimized query:', { searchTerm, statusFilter });
      
      let query = supabase
        .from('processes')
        .select(`
          *,
          municipalities (name, region),
          regional_nuclei (name, acronym)
        `)
        .order('created_at', { ascending: false })
        .limit(100); // Limitar para melhor performance

      if (searchTerm) {
        query = query.or(`process_number.ilike.%${searchTerm}%,object.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('current_status', statusFilter);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching processes:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
  });

  if (isLoading) {
    return <ProcessListLoading />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar processos: {(error as Error).message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProcessHeader />
      
      <ProcessFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
      />

      <ProcessTable processes={processes || []} />
      
      {processes && processes.length >= 100 && (
        <div className="text-center py-4 text-gray-600">
          <p className="text-sm">
            Mostrando os primeiros 100 resultados. Use os filtros para refinar sua busca.
          </p>
        </div>
      )}
    </div>
  );
}
