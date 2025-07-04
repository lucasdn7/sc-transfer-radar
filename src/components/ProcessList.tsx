
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProcessHeader } from "./processes/ProcessHeader";
import { ProcessFilters } from "./processes/ProcessFilters";
import { ProcessTable } from "./processes/ProcessTable";
import { ProcessListLoading } from "./processes/ProcessListLoading";
import type { Database } from "@/integrations/supabase/types";

type TransferStatus = Database['public']['Enums']['transfer_status'];

export function ProcessList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransferStatus | "all">("all");
  const [advancedFilters, setAdvancedFilters] = useState({
    municipality: "",
    regionalNucleus: "",
    minValue: "",
    maxValue: "",
    deadline: null as Date | null
  });

  const { data: processes, isLoading, error } = useQuery({
    queryKey: ['processes', searchTerm, statusFilter, advancedFilters],
    queryFn: async () => {
      console.log('Fetching processes with filters:', { searchTerm, statusFilter, advancedFilters });
      
      let query = supabase
        .from('processes')
        .select(`
          *,
          municipalities (name),
          regional_nuclei (name, acronym),
          status_processos (nome, cor)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (searchTerm) {
        query = query.or(`process_number.ilike.%${searchTerm}%,object.ilike.%${searchTerm}%`);
      }

      if (advancedFilters.municipality) {
        query = query.ilike('municipalities.name', `%${advancedFilters.municipality}%`);
      }

      if (advancedFilters.minValue) {
        query = query.gte('total_portaria_value', parseFloat(advancedFilters.minValue));
      }

      if (advancedFilters.maxValue) {
        query = query.lte('total_portaria_value', parseFloat(advancedFilters.maxValue));
      }

      if (advancedFilters.deadline) {
        query = query.lte('vigencia_date', advancedFilters.deadline.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching processes:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
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
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
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
