
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Phone, Mail, Plus, Edit } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTechnicalAuth } from "@/hooks/useTechnicalAuth";

export default function RegionalNuclei() {
  const { isAuthenticated } = useTechnicalAuth();

  const { data: regionalNuclei, isLoading, error } = useQuery({
    queryKey: ['regional-nuclei'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regional_nuclei')
        .select(`
          *,
          municipalities(count)
        `)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Núcleos Regionais</h1>
          <p className="text-muted-foreground">
            Carregando informações dos núcleos regionais...
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
          <h1 className="text-3xl font-bold tracking-tight">Núcleos Regionais</h1>
          <p className="text-red-600">
            Erro ao carregar núcleos regionais: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Núcleos Regionais</h1>
          <p className="text-muted-foreground">
            Gestão dos núcleos regionais do Estado de Santa Catarina
          </p>
        </div>
        {isAuthenticated && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Núcleo
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {regionalNuclei && regionalNuclei.length > 0 ? (
          regionalNuclei.map((nucleus) => (
            <Card key={nucleus.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{nucleus.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {nucleus.acronym}
                    </Badge>
                  </div>
                  {isAuthenticated && (
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {nucleus.geographic_region && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {nucleus.geographic_region}
                  </div>
                )}

                {nucleus.technical_responsible_name && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {nucleus.technical_responsible_name}
                  </div>
                )}

                {nucleus.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {nucleus.phone}
                  </div>
                )}

                {nucleus.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {nucleus.email}
                  </div>
                )}

                {nucleus.observations && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {nucleus.observations}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum núcleo regional encontrado
            </h3>
            <p className="text-gray-600">
              Não há núcleos regionais cadastrados no sistema.
            </p>
            {isAuthenticated && (
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Núcleo
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
