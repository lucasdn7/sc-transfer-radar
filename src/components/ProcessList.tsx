
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Eye, Download, MapPin } from "lucide-react";

export function ProcessList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
      
      return data;
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'created': 'bg-blue-100 text-blue-800',
      'in_analysis': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'in_execution': 'bg-purple-100 text-purple-800',
      'finished': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'created': 'Criado',
      'in_analysis': 'Em Análise',
      'approved': 'Aprovado',
      'in_execution': 'Em Execução',
      'finished': 'Finalizado',
      'cancelled': 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar processos: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processos</h1>
          <p className="text-gray-600">Gerenciar processos de transferência</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Buscar por número do processo ou objeto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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

      {/* Processes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Processos ({processes?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>Objeto</TableHead>
                  <TableHead>Valor Portaria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processes?.map((process) => (
                  <TableRow key={process.id}>
                    <TableCell className="font-medium">
                      {process.process_number}
                      {process.portaria_number && (
                        <div className="text-xs text-gray-500">
                          Portaria: {process.portaria_number}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="font-medium">{process.municipalities?.name}</div>
                          {process.municipalities?.region && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {process.municipalities.region}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={process.object}>
                        {process.object}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(process.total_portaria_value)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(process.current_status)}>
                        {getStatusLabel(process.current_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(process.vigencia_date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {processes?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum processo encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
