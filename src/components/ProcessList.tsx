
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
      console.log('Fetching processes with filters:', { searchTerm, statusFilter });
      
      let query = supabase
        .from('processes')
        .select(`
          *,
          municipalities (name, region),
          regional_nuclei (name, acronym)
        `)
        .order('created_at', { ascending: false });

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
    }
  });

  if (isLoading) {
    return <ProcessListLoading />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar processos: {(error as Error).message}</p>
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
    </div>
  );
}
