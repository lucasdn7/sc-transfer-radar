
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, FileText, MapPin, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTechnicalAuth } from "@/hooks/useTechnicalAuth";
import { getStatusColor, getStatusLabel, formatCurrency } from "@/utils/processUtils";
import type { Database } from "@/integrations/supabase/types";
import { useState } from "react";

type ProcessStatus = Database['public']['Enums']['process_status'];

export default function Processes() {
  const { isAuthenticated } = useTechnicalAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: processes, isLoading, error } = useQuery({
    queryKey: ['processes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          *,
          municipalities(name, region),
          regional_nuclei(name, acronym)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const filteredProcesses = processes?.filter(process =>
    process.process_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    process.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
    process.municipalities?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Processos</h1>
          <p className="text-muted-foreground">
            Carregando processos...
          </p>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Processos</h1>
          <p className="text-red-600">
            Erro ao carregar processos: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Processos</h1>
          <p className="text-muted-foreground">
            Gestão de processos de transferências financeiras
          </p>
        </div>
        {isAuthenticated && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Processo
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por número do processo, objeto ou município..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="grid gap-6">
        {filteredProcesses.length > 0 ? (
          filteredProcesses.map((process) => (
            <Card key={process.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {process.process_number}
                    </CardTitle>
                    <Badge className={getStatusColor(process.current_status)}>
                      {getStatusLabel(process.current_status)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(process.total_portaria_value)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Valor Total
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Objeto:</h3>
                  <p className="text-gray-600">{process.object}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>
                      {process.municipalities?.name} 
                      {process.municipalities?.region && ` - ${process.municipalities.region}`}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      Vigência: {new Date(process.vigencia_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {process.portaria_number && (
                  <div className="text-sm text-gray-600">
                    <strong>Portaria:</strong> {process.portaria_number}
                  </div>
                )}

                {process.regional_nuclei && (
                  <div className="text-sm text-gray-600">
                    <strong>Núcleo Regional:</strong> {process.regional_nuclei.name} ({process.regional_nuclei.acronym})
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(process.total_concedente_value)}
                    </div>
                    <div className="text-xs text-gray-500">Concedente</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(process.total_proponente_value)}
                    </div>
                    <div className="text-xs text-gray-500">Proponente</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {process.licitado_value ? formatCurrency(process.licitado_value) : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Licitado</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum processo encontrado' : 'Nenhum processo cadastrado'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Tente alterar os termos de busca.' 
                : 'Não há processos cadastrados no sistema.'
              }
            </p>
            {isAuthenticated && !searchTerm && (
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Processo
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
