
import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MunicipalityForm } from '@/components/forms/MunicipalityForm';
import { useAuth } from '@/hooks/useAuth';

export default function Municipalities() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMunicipality, setEditingMunicipality] = useState(null);
  const { toast } = useToast();
  const { isTechnical } = useAuth();
  const queryClient = useQueryClient();

  const { data: municipalities = [], isLoading } = useQuery({
    queryKey: ['municipalities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('municipalities')
        .select(`
          *,
          regional_nuclei(id, name, acronym)
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('municipalities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['municipalities'] });
      toast({
        title: 'Município excluído',
        description: 'O município foi removido com sucesso.',
      });
    },
  });

  const filteredMunicipalities = municipalities.filter(municipality => {
    const matchesSearch = municipality.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         municipality.cnpj.includes(searchTerm);
    const matchesRegion = !selectedRegion || municipality.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const regions = [...new Set(municipalities.map(m => m.region).filter(Boolean))];

  const handleEdit = (municipality: any) => {
    setEditingMunicipality(municipality);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o município "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingMunicipality(null);
    queryClient.invalidateQueries({ queryKey: ['municipalities'] });
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingMunicipality(null);
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
          <Building className="h-6 w-6 text-gray-700" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Municípios</h1>
            <p className="text-gray-600">Gerenciar municípios de Santa Catarina</p>
          </div>
        </div>
        
        {isTechnical && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMunicipality(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Município
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <MunicipalityForm
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
                initialData={editingMunicipality}
                isEdit={!!editingMunicipality}
              />
            </DialogContent>
          </Dialog>
        )}
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
                placeholder="Buscar por nome ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Todas as regiões</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Municipalities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMunicipalities.map((municipality) => (
          <Card key={municipality.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{municipality.name}</CardTitle>
                  <CardDescription>
                    CNPJ: {municipality.cnpj}
                  </CardDescription>
                </div>
                {isTechnical && (
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(municipality)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(municipality.id, municipality.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {municipality.region && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Região:</span>
                  <Badge className="ml-2">{municipality.region}</Badge>
                </div>
              )}
              
              {municipality.regional_nuclei && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Núcleo Regional:</span>
                  <Badge variant="outline" className="ml-2">
                    {municipality.regional_nuclei.acronym}
                  </Badge>
                </div>
              )}

              {municipality.mayor_name && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Prefeito:</span>
                  <p className="text-sm text-gray-900">{municipality.mayor_name}</p>
                </div>
              )}

              {municipality.phone && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Telefone:</span>
                  <p className="text-sm text-gray-900">{municipality.phone}</p>
                </div>
              )}

              {municipality.email && (
                <div>
                  <span className="text-sm font-medium text-gray-600">E-mail:</span>
                  <p className="text-sm text-gray-900">{municipality.email}</p>
                </div>
              )}

              {municipality.population && (
                <div>
                  <span className="text-sm font-medium text-gray-600">População:</span>
                  <p className="text-sm text-gray-900">
                    {municipality.population.toLocaleString('pt-BR')} habitantes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMunicipalities.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum município encontrado
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedRegion 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Nenhum município cadastrado no sistema.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
