import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, FileText, MapPin, Calendar, Edit, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';
import { getStatusColor, getStatusLabel, formatCurrency } from "@/utils/processUtils";
import type { Database } from "@/integrations/supabase/types";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProcessForm } from "@/components/forms/ProcessForm";
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TransferStatus = Database['public']['Enums']['transfer_status'];

export default function Processes() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<any>(null);
  const [parcelsMap, setParcelsMap] = useState<Record<number, any[]>>({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMunicipality, setFilterMunicipality] = useState('all');
  const [filterNucleus, setFilterNucleus] = useState('all');
  const [sortField, setSortField] = useState('total_portaria_value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: processes, isLoading, error, refetch } = useQuery({
    queryKey: ['processes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          *,
          municipalities(name, regioes(nome)),
          regional_nuclei(name, acronym),
          status_processos(nome, cor)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);
  // Filtros aplicados
  const filteredProcesses = (processes || [])
    .filter(process =>
      (filterStatus === 'all' || process.status_processos?.nome === filterStatus) &&
      (filterMunicipality === 'all' || process.municipalities?.name === filterMunicipality) &&
      (filterNucleus === 'all' || process.regional_nuclei?.name === filterNucleus) &&
      (
        process.process_number.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        process.object.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        process.municipalities?.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      const aValue = a[sortField] || 0;
      const bValue = b[sortField] || 0;
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  useEffect(() => {
    async function fetchAllParcels() {
      if (!processes) return;
      const ids = processes.map((p: any) => p.id);
      const { data } = await supabase
        .from('process_parcels')
        .select('*')
        .in('process_id', ids);
      const map: Record<number, any[]> = {};
      (data || []).forEach((parcel) => {
        if (!map[parcel.process_id]) map[parcel.process_id] = [];
        map[parcel.process_id].push(parcel);
      });
      setParcelsMap(map);
    }
    fetchAllParcels();
  }, [processes]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingProcess(null);
    refetch();
  };

  const handleEdit = (process: any) => {
    setEditingProcess(process);
    setIsFormOpen(true);
  };

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
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProcess(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Processo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProcess ? 'Editar Processo' : 'Novo Processo'}
                </DialogTitle>
              </DialogHeader>
              <ProcessForm
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingProcess(null);
                }}
                initialData={editingProcess}
                isEdit={!!editingProcess}
              />
            </DialogContent>
          </Dialog>
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
        {/* Botão de Filtros */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <label className="text-xs font-semibold">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Aprovados">Aprovados</SelectItem>
                  <SelectItem value="Em Execução">Em Execução</SelectItem>
                  <SelectItem value="Finalizados">Finalizados</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <label className="text-xs font-semibold">Município</label>
              <Select value={filterMunicipality} onValueChange={setFilterMunicipality}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(processes || []).map(p => p.municipalities?.name).filter((v, i, arr) => v && arr.indexOf(v) === i).map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="text-xs font-semibold">Núcleo Regional</label>
              <Select value={filterNucleus} onValueChange={setFilterNucleus}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(processes || []).map(p => p.regional_nuclei?.name).filter((v, i, arr) => v && arr.indexOf(v) === i).map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>
        {/* Botão de Ordenação */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              Ordenar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-2">
              <label className="text-xs font-semibold">Campo</label>
              <Select value={sortField} onValueChange={setSortField}>
                <SelectTrigger><SelectValue placeholder="Campo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="total_portaria_value">Valor Total</SelectItem>
                  <SelectItem value="total_proponente_value">Contrapartida</SelectItem>
                  <SelectItem value="total_concedente_value">Concedente</SelectItem>
                  <SelectItem value="licitado_value">Licitado</SelectItem>
                </SelectContent>
              </Select>
              <label className="text-xs font-semibold">Ordem</label>
              <Select value={sortOrder} onValueChange={v => setSortOrder(v as any)}>
                <SelectTrigger><SelectValue placeholder="Ordem" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Maior para menor</SelectItem>
                  <SelectItem value="asc">Menor para maior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-6">
        {filteredProcesses.length > 0 ? (
          filteredProcesses.map((process) => {
            const parcels = parcelsMap[process.id] || [];
            const totalParcels = parcels.length;
            const paidParcels = parcels.filter(p => p.payment_date).length;
            const repassedValue = parcels.filter(p => p.payment_date).reduce((sum, p) => sum + (p.value || 0), 0);
            const saldoARepassar = (process.total_concedente_value || 0) - repassedValue;
            return (
              <Card key={process.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {process.process_number}
                        {/* Botão de link externo */}
                        {process.link_plataforma_governo && (
                          <a
                            href={process.link_plataforma_governo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:text-blue-800"
                            title="Acessar plataforma do governo"
                          >
                            <ExternalLink className="h-5 w-5 inline" />
                          </a>
                        )}
                      </CardTitle>
                      <Badge variant="secondary">
                        {process.status_processos?.nome || 'Não definido'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(process.total_portaria_value)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Valor Total
                        </div>
                      </div>
                      {isAuthenticated && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(process)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
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
                        {process.municipalities?.regioes && ` - ${process.municipalities.regioes.nome}`}
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
                      <div className="text-xs text-gray-500">Contrapartida</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {process.licitado_value ? formatCurrency(process.licitado_value) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Licitado</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {paidParcels}/{totalParcels}
                      </div>
                      <div className="text-xs text-gray-500">Parcelas Pagas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(repassedValue)}
                      </div>
                      <div className="text-xs text-gray-500">Valor Repassado</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(saldoARepassar)}
                      </div>
                      <div className="text-xs text-gray-500">Saldo a Repassar</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
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
