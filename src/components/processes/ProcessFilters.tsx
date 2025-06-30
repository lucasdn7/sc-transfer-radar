
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ProcessStatus = Database['public']['Enums']['process_status'];

interface ProcessFiltersProps {
  searchTerm: string;
  statusFilter: ProcessStatus | "all";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ProcessStatus | "all") => void;
}

export function ProcessFilters({ 
  searchTerm, 
  statusFilter, 
  onSearchChange, 
  onStatusChange 
}: ProcessFiltersProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Buscar por número do processo ou objeto..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="created">Criado</SelectItem>
              <SelectItem value="in_analysis">Em Análise</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="in_execution">Em Execução</SelectItem>
              <SelectItem value="finished">Finalizado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
