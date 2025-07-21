import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MapPin, Phone, Mail, Users, Plus, Edit, List, LayoutGrid } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MunicipalityForm } from "@/components/forms/MunicipalityForm";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export default function Municipalities() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMunicipality, setEditingMunicipality] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);
  const { data: municipalities, isLoading, error, refetch } = useQuery({
    queryKey: ['municipalities', debouncedSearchTerm],
    queryFn: async () => {
      let query = supabase
        .from('municipalities')
        .select(`
          *,
          regional_nuclei (name, acronym),
          regioes (nome, sigla),
          municipality_classifications (name)
        `)
        .order('name', { ascending: true });

      if (debouncedSearchTerm) {
        query = query.ilike('name', `%${debouncedSearchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    }
  });

  // Buscar estatísticas dos processos por município
  const { data: municipalityStats } = useQuery({
    queryKey: ['municipality-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          municipality_id,
          total_portaria_value,
          status_processos (nome)
        `);
      
      if (error) throw error;
      
      const stats = data?.reduce((acc: any, process) => {
        const municipalityId = process.municipality_id;
        if (!acc[municipalityId]) {
          acc[municipalityId] = {
            totalProcesses: 0,
            totalValue: 0,
            statuses: {}
          };
        }
        acc[municipalityId].totalProcesses += 1;
        acc[municipalityId].totalValue += process.total_portaria_value || 0;
        
        const status = process.status_processos?.nome || 'Não definido';
        acc[municipalityId].statuses[status] = (acc[municipalityId].statuses[status] || 0) + 1;
        
        return acc;
      }, {});
      
      return stats || {};
    }
  });

  const getRegularityIndicator = (stats: any) => {
    if (!stats || stats.totalProcesses === 0) {
      return { color: 'bg-gray-400', label: 'Sem dados' };
    }
    
    const finalizados = stats.statuses['Finalizado'] || 0;
    const total = stats.totalProcesses;
    const rate = finalizados / total;
    
    if (rate >= 0.8) return { color: 'bg-green-500', label: 'Excelente' };
    if (rate >= 0.6) return { color: 'bg-yellow-500', label: 'Bom' };
    return { color: 'bg-red-500', label: 'Atenção' };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingMunicipality(null);
    refetch();
  };

  const handleEdit = (municipality: any) => {
    setEditingMunicipality(municipality);
    setIsFormOpen(true);
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
        <p className="text-red-600">Erro ao carregar municípios: {error.message}</p>
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
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Municípios</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Municípios</h1>
          <p className="text-gray-600">Gerenciar municípios de Santa Catarina ({municipalities?.length || 0} encontrados)</p>
          <p className="text-xs text-muted-foreground mt-1">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
        {isAuthenticated && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMunicipality(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Município
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {editingMunicipality ? 'Editar Município' : 'Novo Município'}
                </DialogTitle>
              </DialogHeader>
              <MunicipalityForm
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingMunicipality(null);
                }}
                initialData={editingMunicipality}
                isEdit={!!editingMunicipality}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar município..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 mb-2">
        <Button variant={viewMode === 'cards' ? 'default' : 'outline'} onClick={() => setViewMode('cards')}><LayoutGrid className="h-4 w-4 mr-1" /> Cards</Button>
        <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}><List className="h-4 w-4 mr-1" /> Lista</Button>
      </div>
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {municipalities?.map((municipality) => {
            const stats = municipalityStats?.[municipality.id];
            const regularity = getRegularityIndicator(stats);
            
            return (
              <Card key={municipality.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{municipality.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${regularity.color}`}></div>
                        <span className="text-sm text-gray-600">{regularity.label}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/map?municipality=${municipality.id}`}>
                          <MapPin className="h-4 w-4" />
                        </Link>
                      </Button>
                      {isAuthenticated && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(municipality)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mini Cards de Resumo */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {stats?.totalProcesses || 0}
                      </div>
                      <div className="text-xs text-blue-600">Processos</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm font-bold text-green-600">
                        {stats ? formatCurrency(stats.totalValue) : 'R$ 0,00'}
                      </div>
                      <div className="text-xs text-green-600">Valor Total</div>
                    </div>
                  </div>

                  {/* Informações do Município */}
                  <div className="space-y-2">
                    {municipality.regioes && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{municipality.regioes.nome}</span>
                      </div>
                    )}

                    {municipality.regional_nuclei && (
                      <div>
                        <Badge variant="outline">
                          {municipality.regional_nuclei.acronym}
                        </Badge>
                      </div>
                    )}

                    {municipality.mayor_name && (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {municipality.mayor_name}
                        </div>
                        <div className="text-xs text-gray-500">Prefeito</div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      CNPJ: {municipality.cnpj}
                    </div>
                  </div>

                  {/* Contatos */}
                  <div className="space-y-1">
                    {municipality.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span>{municipality.phone}</span>
                      </div>
                    )}

                    {municipality.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span>{municipality.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Distribuição de Status */}
                  {stats && stats.statuses && Object.keys(stats.statuses).length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="text-sm font-medium mb-2">Status dos Processos</div>
                      <div className="space-y-1">
                        {Object.entries(stats.statuses).map(([status, count]: [string, any]) => (
                          <div key={status} className="flex justify-between text-xs">
                            <span>{status}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border px-2 py-1 bg-gray-100">Município</th>
                <th className="border px-2 py-1 bg-gray-100">Região</th>
                <th className="border px-2 py-1 bg-gray-100">Núcleo</th>
                <th className="border px-2 py-1 bg-gray-100">Classificação</th>
                <th className="border px-2 py-1 bg-gray-100">Telefone</th>
                <th className="border px-2 py-1 bg-gray-100">E-mail</th>
                <th className="border px-2 py-1 bg-gray-100">Ações</th>
              </tr>
            </thead>
            <tbody>
              {municipalities && municipalities.length > 0 ? (
                municipalities.map((m: any) => (
                  <tr key={m.id}>
                    <td className="border px-2 py-1">{m.name}</td>
                    <td className="border px-2 py-1">{m.regioes?.nome}</td>
                    <td className="border px-2 py-1">{m.regional_nuclei?.name}</td>
                    <td className="border px-2 py-1">{m.municipality_classifications?.name}</td>
                    <td className="border px-2 py-1">{m.phone}</td>
                    <td className="border px-2 py-1">{m.email}</td>
                    <td className="border px-2 py-1">
                      {/* Adicione aqui botões de ações como visualizar, editar, etc. */}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 border px-2 py-1">Nenhum município disponível</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {municipalities?.length === 0 && (
        <div className="text-center py-8">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum município encontrado' : 'Nenhum município cadastrado'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Tente alterar os termos de busca.' 
              : 'Não há municípios cadastrados no sistema.'
            }
          </p>
          {isAuthenticated && !searchTerm && (
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Município
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
