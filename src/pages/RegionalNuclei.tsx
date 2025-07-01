
import { useState } from 'react';
import { Plus, Search, Edit, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RegionalNucleusForm } from '@/components/forms/RegionalNucleusForm';
import { useAuth } from '@/hooks/useAuth';

export default function RegionalNuclei() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNucleus, setEditingNucleus] = useState(null);
  const { toast } = useToast();
  const { isTechnical } = useAuth();
  const queryClient = useQueryClient();

  const { data: nuclei = [], isLoading } = useQuery({
    queryKey: ['regional-nuclei'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regional_nuclei')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('regional_nuclei')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regional-nuclei'] });
      toast({
        title: 'Núcleo regional excluído',
        description: 'O núcleo regional foi removido com sucesso.',
      });
    },
  });

  const filteredNuclei = nuclei.filter(nucleus => 
    nucleus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nucleus.acronym.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (nucleus: any) => {
    setEditingNucleus(nucleus);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o núcleo regional "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingNucleus(null);
    queryClient.invalidateQueries({ queryKey: ['regional-nuclei'] });
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingNucleus(null);
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
          <MapPin className="h-6 w-6 text-gray-700" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Núcleos Regionais</h1>
            <p className="text-gray-600">Gerenciar núcleos regionais de Santa Catarina</p>
          </div>
        </div>
        
        {isTechnical && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingNucleus(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Núcleo Regional
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <RegionalNucleusForm
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
                initialData={editingNucleus}
                isEdit={!!editingNucleus}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou sigla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Nuclei Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNuclei.map((nucleus) => (
          <Card key={nucleus.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{nucleus.name}</CardTitle>
                  <CardDescription>
                    Sigla: {nucleus.acronym}
                  </CardDescription>
                </div>
                {isTechnical && (
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(nucleus)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(nucleus.id, nucleus.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {nucleus.geographic_region && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Região Geográfica:</span>
                  <p className="text-sm text-gray-900">{nucleus.geographic_region}</p>
                </div>
              )}

              {nucleus.technical_responsible_name && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Responsável Técnico:</span>
                  <p className="text-sm text-gray-900">{nucleus.technical_responsible_name}</p>
                </div>
              )}

              {nucleus.phone && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Telefone:</span>
                  <p className="text-sm text-gray-900">{nucleus.phone}</p>
                </div>
              )}

              {nucleus.email && (
                <div>
                  <span className="text-sm font-medium text-gray-600">E-mail:</span>
                  <p className="text-sm text-gray-900">{nucleus.email}</p>
                </div>
              )}

              {nucleus.observations && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Observações:</span>
                  <p className="text-sm text-gray-900">{nucleus.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNuclei.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum núcleo regional encontrado
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Nenhum núcleo regional cadastrado no sistema.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
