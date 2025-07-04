import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Phone, Mail, Users, Plus, Edit } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTechnicalAuth } from "@/hooks/useTechnicalAuth";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RegionalNucleusForm } from "@/components/forms/RegionalNucleusForm";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";

export default function RegionalNuclei() {
  const { isAuthenticated } = useTechnicalAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNucleus, setEditingNucleus] = useState<any>(null);

  const { data: regionalNuclei, isLoading, error, refetch } = useQuery({
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

  // Buscar estatísticas dos processos por núcleo regional
  const { data: nucleiStats } = useQuery({
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingNucleus(null);
    refetch();
  };

  const handleEdit = (nucleus: any) => {
    setEditingNucleus(nucleus);
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
        <p className="text-red-600">Erro ao carregar núcleos regionais: {error.message}</p>
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
            <BreadcrumbPage>Núcleos Regionais</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Núcleos Regionais</h1>
          <p className="text-gray-600">
            Gerenciar núcleos regionais de Santa Catarina ({regionalNuclei?.length || 0} encontrados)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
        {isAuthenticated && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingNucleus(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Núcleo Regional
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {editingNucleus ? 'Editar Núcleo Regional' : 'Novo Núcleo Regional'}
                </DialogTitle>
              </DialogHeader>
              <RegionalNucleusForm
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingNucleus(null);
                }}
                initialData={editingNucleus}
                isEdit={!!editingNucleus}
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
              placeholder="Buscar núcleo regional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Nuclei Grid com Gráficos e Resumos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regionalNuclei?.map((nucleus) => {
          const stats = nucleiStats?.[nucleus.id];
          
          return (
            <Card key={nucleus.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{nucleus.name}</CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {nucleus.acronym}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/municipalities?nucleus=${nucleus.id}`}>
                        Ver Municípios
                      </Link>
                    </Button>
                    {isAuthenticated && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(nucleus)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Resumo do Núcleo */}
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

                {/* Gráfico de Distribuição de Municípios */}
                {nucleus.municipalities && nucleus.municipalities.length > 0 && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {nucleus.municipalities.length}
                    </div>
                    <div className="text-xs text-purple-600">Municípios</div>
                  </div>
                )}

                {nucleus.regioes && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{nucleus.regioes.nome}</span>
                  </div>
                )}

                {nucleus.technical_responsible_name && (
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {nucleus.technical_responsible_name}
                    </div>
                    <div className="text-xs text-gray-500">Responsável Técnico</div>
                  </div>
                )}

                <div className="space-y-2">
                  {nucleus.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span>{nucleus.phone}</span>
                    </div>
                  )}

                  {nucleus.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span>{nucleus.email}</span>
                    </div>
                  )}
                </div>

                {/* Municípios do Núcleo */}
                {nucleus.municipalities && nucleus.municipalities.length > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">Municípios ({nucleus.municipalities.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {nucleus.municipalities.map((municipality: any) => (
                        <Badge key={municipality.id} variant="secondary" className="text-xs">
                          {municipality.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Distribuição de Status dos Processos */}
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

                {nucleus.observations && (
                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600">
                      {nucleus.observations}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {regionalNuclei?.length === 0 && (
        <div className="text-center py-8">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum núcleo regional encontrado' : 'Nenhum núcleo regional cadastrado'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Tente alterar os termos de busca.' 
              : 'Não há núcleos regionais cadastrados no sistema.'
            }
          </p>
          {isAuthenticated && !searchTerm && (
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Núcleo Regional
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
