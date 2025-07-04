
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Users } from "lucide-react";
import { useTechnicalAuth } from "@/hooks/useTechnicalAuth";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RegionalNucleusForm } from "@/components/forms/RegionalNucleusForm";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { RegionalNucleusCard } from "@/components/regional-nuclei/RegionalNucleusCard";
import { useRegionalNuclei, useNucleiStats } from "@/hooks/useRegionalNuclei";

export default function RegionalNuclei() {
  const { isAuthenticated } = useTechnicalAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNucleus, setEditingNucleus] = useState<any>(null);

  const { data: regionalNuclei, isLoading, error, refetch } = useRegionalNuclei(searchTerm);
  const { data: nucleiStats } = useNucleiStats();

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regionalNuclei?.map((nucleus) => (
          <RegionalNucleusCard
            key={nucleus.id}
            nucleus={nucleus}
            stats={nucleiStats?.[nucleus.id]}
            isAuthenticated={isAuthenticated}
            onEdit={handleEdit}
          />
        ))}
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
