
import { useState } from 'react';
import { Plus, Search, Edit, Trash2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProcessForm } from '@/components/forms/ProcessForm';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/utils/processUtils';

export default function Processes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState(null);
  const { toast } = useToast();
  const { isTechnical } = useAuth();
  const queryClient = useQueryClient();

  const { data: processes = [], isLoading } = useQuery({
    queryKey: ['processes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          *,
          municipalities(name),
          regional_nuclei(name, acronym)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('processes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({
        title: 'Processo excluído',
        description: 'O processo foi removido com sucesso.',
      });
    },
  });

  const filteredProcesses = processes.filter(process => {
    const matchesSearch = process.process_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.municipalities?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || process.current_status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'created', label: 'Criado' },
    { value: 'in_analysis', label: 'Em Análise' },
    { value: 'approved', label: 'Aprovado' },
    { value: 'in_execution', label: 'Em Execução' },
    { value: 'finished', label: 'Finalizado' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  const handleEdit = (process: any) => {
    setEditingProcess(process);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number, processNumber: string) => {
    if (confirm(`Tem certeza que deseja excluir o processo "${processNumber}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingProcess(null);
    queryClient.invalidateQueries({ queryKey: ['processes'] });
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingProcess(null);
  };

  const exportToCSV = () => {
    const headers = [
      'Número do Processo',
      'Objeto',
      'Município',
      'Status',
      'Valor Total',
      'Data de Vigência'
    ];

    const csvData = filteredProcesses.map(process => [
      process.process_number,
      process.object,
      process.municipalities?.name || '',
      getStatusLabel(process.current_status),
      process.total_portaria_value,
      process.vigencia_date
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `processos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-gray-700" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Processos</h1>
            <p className="text-gray-600">Gerenciar processos de transferência</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          
          {isTechnical && (
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingProcess(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Processo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <ProcessForm
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                  initialData={editingProcess}
                  isEdit={!!editingProcess}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por número, objeto ou município..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Processes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProcesses.map((process) => (
          <Card key={process.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{process.process_number}</CardTitle>
                  <CardDescription className="mt-1">
                    {process.object.length > 100 
                      ? `${process.object.substring(0, 100)}...` 
                      : process.object}
                  </CardDescription>
                </div>
                {isTechnical && (
                  <div className="flex space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(process)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(process.id, process.process_number)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <Badge className={getStatusColor(process.current_status)}>
                  {getStatusLabel(process.current_status)}
                </Badge>
              </div>

              {process.municipalities && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Município:</span>
                  <span className="text-sm text-gray-900">{process.municipalities.name}</span>
                </div>
              )}

              {process.regional_nuclei && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Núcleo Regional:</span>
                  <Badge variant="outline">
                    {process.regional_nuclei.acronym}
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Valor Total:</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(process.total_portaria_value)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Vigência:</span>
                <span className="text-sm text-gray-900">
                  {formatDate(process.vigencia_date)}
                </span>
              </div>

              {process.portaria_number && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Portaria:</span>
                  <span className="text-sm text-gray-900">{process.portaria_number}</span>
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Concedente:</span>
                    <p className="font-medium text-blue-600">
                      {formatCurrency(process.total_concedente_value)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Proponente:</span>
                    <p className="font-medium text-orange-600">
                      {formatCurrency(process.total_proponente_value)}
                    </p>
                  </div>
                  {process.licitado_value && (
                    <div>
                      <span className="text-gray-600">Licitado:</span>
                      <p className="font-medium text-purple-600">
                        {formatCurrency(process.licitado_value)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProcesses.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum processo encontrado
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedStatus 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Nenhum processo cadastrado no sistema.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
