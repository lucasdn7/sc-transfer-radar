import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, Building, MapPin, Users, Phone, Mail, Edit } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTechnicalAuth } from "@/hooks/useTechnicalAuth";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MunicipalityForm } from "@/components/forms/MunicipalityForm";

export default function Municipalities() {
  const { isAuthenticated } = useTechnicalAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMunicipality, setEditingMunicipality] = useState<any>(null);

  const { data: municipalities, isLoading, error, refetch } = useQuery({
    queryKey: ['municipalities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('municipalities')
        .select(`
          *,
          regional_nuclei(name, acronym),
          processes(count)
        `)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const filteredMunicipalities = municipalities?.filter(municipality =>
    municipality.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    municipality.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    municipality.mayor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Municípios</h1>
          <p className="text-muted-foreground">
            Carregando municípios...
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <h1 className="text-3xl font-bold tracking-tight">Municípios</h1>
          <p className="text-red-600">
            Erro ao carregar municípios: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Municípios</h1>
          <p className="text-muted-foreground">
            Gestão de municípios de Santa Catarina
          </p>
        </div>
        {isAuthenticated && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMunicipality(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Município
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

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, região ou prefeito..."
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMunicipalities.length > 0 ? (
          filteredMunicipalities.map((municipality) => (
            <Card key={municipality.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {municipality.name}
                    </CardTitle>
                    {municipality.region && (
                      <Badge variant="secondary" className="mt-1">
                        {municipality.region}
                      </Badge>
                    )}
                  </div>
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
              </CardHeader>
              <CardContent className="space-y-4">
                {municipality.mayor_name && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Prefeito: {municipality.mayor_name}</span>
                  </div>
                )}

                {municipality.secretary_name && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Secretário: {municipality.secretary_name}</span>
                  </div>
                )}

                {municipality.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{municipality.phone}</span>
                  </div>
                )}

                {municipality.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{municipality.email}</span>
                  </div>
                )}

                {municipality.population && (
                  <div className="text-sm text-gray-600">
                    <strong>População:</strong> {municipality.population.toLocaleString('pt-BR')}
                  </div>
                )}

                {municipality.classification && (
                  <div className="text-sm text-gray-600">
                    <strong>Classificação:</strong> {municipality.classification}
                  </div>
                )}

                {municipality.regional_nuclei && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>
                      {municipality.regional_nuclei.name} ({municipality.regional_nuclei.acronym})
                    </span>
                  </div>
                )}

                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>CNPJ:</strong> {municipality.cnpj}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
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
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4" onClick={() => setEditingMunicipality(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeiro Município
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Novo Município</DialogTitle>
                  </DialogHeader>
                  <MunicipalityForm
                    onSuccess={handleFormSuccess}
                    onCancel={() => setIsFormOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
