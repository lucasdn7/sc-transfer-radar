import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Mail, Users, ArrowLeft, Map, FileText, DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/utils/processUtils";
import { formatDateDisplay } from "@/utils/dateUtils";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function MunicipalityDetail() {
  const { id } = useParams<{ id: string }>();

  // Buscar dados do município
  const { data: municipality, isLoading: municipalityLoading, error: municipalityError } = useQuery({
    queryKey: ['municipality', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('municipalities')
        .select(`
          *,
          regional_nuclei (name, acronym),
          regioes (nome, sigla),
          municipality_classifications (name)
        `)
        .eq('id', parseInt(id))
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Buscar processos do município
  const { data: processes, isLoading: processesLoading } = useQuery({
    queryKey: ['municipality-processes', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('processes')
        .select(`
          *,
          status_processos (nome, cor)
        `)
        .eq('municipality_id', parseInt(id))
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Buscar repasses do município
  const { data: parcels, isLoading: parcelsLoading } = useQuery({
    queryKey: ['municipality-parcels', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('parcels')
        .select(`
          *,
          processes (process_number)
        `)
        .eq('municipality_id', parseInt(id))
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Calcular estatísticas
  const stats = processes ? {
    totalProcesses: processes.length,
    totalValue: processes.reduce((sum, p) => sum + (p.total_portaria_value || 0), 0),
    statuses: processes.reduce((acc, p) => {
      const status = p.status_processos?.nome || 'Não definido';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  } : null;

  const parcelStats = parcels ? {
    totalRepassed: parcels.reduce((sum, p) => sum + (p.value || 0), 0),
    totalParcels: parcels.length,
  } : null;

  const totalValue = stats?.totalValue || 0;
  const totalRepassed = parcelStats?.totalRepassed || 0;
  const remainingValue = totalValue - totalRepassed;

  const formatPopulation = (population: number) => {
    return new Intl.NumberFormat('pt-BR').format(population);
  };

  if (municipalityLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (municipalityError || !municipality) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar município</p>
        <Link to="/municipalities">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Municípios
          </Button>
        </Link>
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
            <BreadcrumbLink href="/municipalities">Municípios</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{municipality.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/municipalities">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Municípios
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{municipality.name}</h1>
          <p className="text-muted-foreground">
            {municipality.regioes?.nome} - {municipality.regioes?.sigla}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to={`/map?municipality=${municipality.id}`}>
            <Map className="h-4 w-4 mr-2" />
            Ver no Mapa
          </Link>
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Processos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProcesses || 0}</div>
            <p className="text-xs text-muted-foreground">Total de processos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Valor da portaria</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Valor Repassado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRepassed)}</div>
            <p className="text-xs text-muted-foreground">{parcelStats?.totalParcels || 0} parcelas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Saldo a Repassar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(remainingValue)}</div>
            <p className="text-xs text-muted-foreground">Pendente</p>
          </CardContent>
        </Card>
      </div>

      {/* Dados Cadastrais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Cadastrais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>Região: {municipality.regioes?.nome || 'N/A'}</span>
              </div>
              {municipality.regional_nuclei && (
                <div>
                  <Badge variant="outline">
                    {municipality.regional_nuclei.acronym}
                  </Badge>
                  <span className="text-sm text-gray-600 ml-2">{municipality.regional_nuclei.name}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-gray-600">CNPJ:</span> {municipality.cnpj || 'N/A'}
              </div>
              {municipality.population && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>População: {formatPopulation(municipality.population)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {municipality.mayor_name && (
                <div className="text-sm">
                  <span className="text-gray-600">Prefeito:</span> {municipality.mayor_name}
                </div>
              )}
              {municipality.secretary_name && (
                <div className="text-sm">
                  <span className="text-gray-600">Secretário:</span> {municipality.secretary_name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {municipality.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{municipality.phone}</span>
                </div>
              )}
              {municipality.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{municipality.email}</span>
                </div>
              )}
            </div>

            {municipality.municipality_classifications && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-600">Classificação:</span> {municipality.municipality_classifications.name}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status dos Processos */}
      {stats && stats.statuses && Object.keys(stats.statuses).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Status dos Processos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.statuses).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {status.toLowerCase().includes('final') ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : status.toLowerCase().includes('cancel') ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <FileText className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="text-sm">{status}</span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Processos */}
      <Card>
        <CardHeader>
          <CardTitle>Processos Relacionados ({processes?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {processesLoading ? (
            <div className="text-center py-4">Carregando processos...</div>
          ) : processes && processes.length > 0 ? (
            <div className="space-y-4">
              {processes.map((process) => (
                <div key={process.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{process.process_number}</h3>
                        <Badge 
                          variant="outline" 
                          style={{ 
                            borderColor: process.status_processos?.cor,
                            color: process.status_processos?.cor 
                          }}
                        >
                          {process.status_processos?.nome || 'Não definido'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{process.object}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Vigência: {formatDateDisplay(process.vigencia_date)}</span>
                        <span>Valor: {formatCurrency(process.total_portaria_value)}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/processes`}>
                        Ver Detalhes
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum processo encontrado para este município
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Repasses */}
      {parcels && parcels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Repasses Realizados ({parcels.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parcels.map((parcel) => (
                <div key={parcel.id} className="p-3 border rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-medium">{formatCurrency(parcel.value)}</div>
                    <div className="text-xs text-gray-500">
                      {formatDateDisplay(parcel.payment_date)} • {parcel.processes?.process_number}
                    </div>
                  </div>
                  <Badge variant="outline">{parcel.parcel_number}ª parcela</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
