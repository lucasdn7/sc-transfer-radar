
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MapPin, Phone, Mail, Users, Plus, Edit } from "lucide-react";
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
    queryKey: ['municipalities', searchTerm],
    queryFn: async () => {
      console.log('Fetching municipalities with search:', searchTerm);
      
      let query = supabase
        .from('municipalities')
        .select(`
          *,
          regional_nuclei (name, acronym),
          regioes (nome, sigla),
          municipality_classifications (name)
        `)
        .order('name', { ascending: true });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching municipalities:', error);
        throw error;
      }
      
      console.log('Municipalities fetched:', data);
      return data || [];
    }
  });

  const formatPopulation = (population: number) => {
    return new Intl.NumberFormat('pt-BR').format(population);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Municípios</h1>
          <p className="text-gray-600">Gerenciar municípios de Santa Catarina ({municipalities?.length || 0} encontrados)</p>
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

      {/* Municipalities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Municípios ({municipalities?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Município</TableHead>
                  <TableHead>Região</TableHead>
                  <TableHead>Núcleo Regional</TableHead>
                  <TableHead>População</TableHead>
                  <TableHead>Prefeito</TableHead>
                  <TableHead>Contato</TableHead>
                  {isAuthenticated && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {municipalities?.map((municipality) => (
                  <TableRow key={municipality.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{municipality.name}</div>
                        <div className="text-xs text-gray-500">
                          CNPJ: {municipality.cnpj}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{municipality.regioes?.nome || 'Não informado'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {municipality.regional_nuclei ? (
                        <Badge variant="outline">
                          {municipality.regional_nuclei.acronym}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">Não informado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>
                          {municipality.population ? 
                            formatPopulation(municipality.population) : 
                            'Não informado'
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {municipality.mayor_name && (
                          <div className="font-medium">{municipality.mayor_name}</div>
                        )}
                        {municipality.secretary_name && (
                          <div className="text-xs text-gray-500">
                            Sec.: {municipality.secretary_name}
                          </div>
                        )}
                        {!municipality.mayor_name && !municipality.secretary_name && (
                          <span className="text-gray-400">Não informado</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {municipality.phone && (
                          <div className="flex items-center space-x-1 text-xs">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{municipality.phone}</span>
                          </div>
                        )}
                        {municipality.email && (
                          <div className="flex items-center space-x-1 text-xs">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span>{municipality.email}</span>
                          </div>
                        )}
                        {!municipality.phone && !municipality.email && (
                          <span className="text-gray-400 text-xs">Não informado</span>
                        )}
                      </div>
                    </TableCell>
                    {isAuthenticated && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(municipality)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {municipalities?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Nenhum município encontrado para a busca.' : 'Nenhum município cadastrado no sistema.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
