import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, AlertTriangle, ArrowLeft, Download, CheckCircle, XCircle, PlayCircle, FileText, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/processUtils';
import { formatDateDisplay } from '@/utils/dateUtils';
import { Link } from 'react-router-dom';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export default function ProcessTimeline() {
  const { data: processes, isLoading, error } = useQuery({
    queryKey: ['process-timeline'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          *,
          municipalities(name),
          regional_nuclei(name, acronym),
          status_processos(nome, cor)
        `)
        .order('vigencia_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const getTimelineStatus = (vigenciaDate: string) => {
    const today = new Date();
    const vigencia = new Date(vigenciaDate);
    const diffTime = vigencia.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { 
      status: 'expired', 
      label: 'Vencido', 
      color: 'bg-red-500',
      icon: XCircle,
      textColor: 'text-red-600'
    };
    if (diffDays <= 7) return { 
      status: 'critical', 
      label: 'Crítico', 
      color: 'bg-red-400',
      icon: AlertTriangle,
      textColor: 'text-red-500'
    };
    if (diffDays <= 30) return { 
      status: 'warning', 
      label: 'Atenção', 
      color: 'bg-yellow-400',
      icon: Clock,
      textColor: 'text-yellow-600'
    };
    return { 
      status: 'normal', 
      label: 'Normal', 
      color: 'bg-green-400',
      icon: CheckCircle,
      textColor: 'text-green-600'
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'finalizado':
        return { icon: CheckCircle, color: 'text-green-600' };
      case 'em análise':
        return { icon: PlayCircle, color: 'text-blue-600' };
      case 'cancelado':
        return { icon: XCircle, color: 'text-red-600' };
      default:
        return { icon: Clock, color: 'text-yellow-600' };
    }
  };

  const exportToPDF = () => {
    // Implementar exportação para PDF
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timeline de Processos</h1>
          <p className="text-muted-foreground">Carregando timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timeline de Processos</h1>
          <p className="text-red-600">Erro ao carregar timeline: {error.message}</p>
        </div>
      </div>
    );
  }

  {/* Navegação contextual para outras telas de Monitoramento */}
  const navigationCard = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Navegação Rápida - Monitoramento</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/processes">
              <FileText className="h-3 w-3 mr-1" />
              Processos
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/process-calendar">
              <Calendar className="h-3 w-3 mr-1" />
              Calendário
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/monitoring/alerts">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Alertas e Vencimentos
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const groupedProcesses = processes?.reduce((acc, process) => {
    const month = new Date(process.vigencia_date).toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long' 
    });
    if (!acc[month]) acc[month] = [];
    acc[month].push(process);
    return acc;
  }, {} as Record<string, typeof processes>) || {};

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
            <BreadcrumbPage>Timeline de Processos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Navegação contextual para outras telas de Monitoramento */}
      {navigationCard}

      {/* Header fixo */}
      <div className="sticky top-0 bg-white z-10 pb-4 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/processes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos Processos
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Timeline de Processos</h1>
              <p className="text-muted-foreground">
                Cronograma de vigência dos processos organizados por mês
              </p>
            </div>
          </div>
          <Button onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedProcesses).map(([month, monthProcesses]) => (
          <div key={month} className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold capitalize">{month}</h2>
              <Badge variant="outline">{monthProcesses.length} processos</Badge>
            </div>
            
            <div className="space-y-4 ml-7 relative">
              {/* Linha vertical da timeline */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {monthProcesses.map((process, index) => {
                const timelineStatus = getTimelineStatus(process.vigencia_date);
                const statusIcon = getStatusIcon(process.status_processos?.nome || '');
                const daysUntilExpiry = Math.ceil(
                  (new Date(process.vigencia_date).getTime() - new Date().getTime()) / 
                  (1000 * 60 * 60 * 24)
                );
                
                return (
                  <Card key={process.id} className="relative ml-6 hover:shadow-lg transition-shadow">
                    {/* Ícone da timeline */}
                    <div className={`absolute -left-8 top-6 w-4 h-4 rounded-full ${timelineStatus.color} border-2 border-white shadow-sm flex items-center justify-center`}>
                      <timelineStatus.icon className="h-2 w-2 text-white" />
                    </div>
                    
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <statusIcon.icon className={`h-5 w-5 ${statusIcon.color}`} />
                            {process.process_number}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="secondary">
                              {process.status_processos?.nome || 'Não definido'}
                            </Badge>
                            <Badge variant={timelineStatus.status === 'expired' ? 'destructive' : 'secondary'}>
                              {timelineStatus.label}
                            </Badge>
                            {daysUntilExpiry <= 30 && daysUntilExpiry >= 0 && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                Prazo Crítico
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(process.total_portaria_value)}
                          </div>
                          <div className="text-sm text-gray-500">Valor Total</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-gray-600 text-sm">{process.object}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{process.municipalities?.name || 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Vigência: {formatDateDisplay(process.vigencia_date)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className={timelineStatus.textColor}>
                            {daysUntilExpiry < 0 
                              ? `Vencido há ${Math.abs(daysUntilExpiry)} dias`
                              : `${daysUntilExpiry} dias restantes`
                            }
                          </span>
                          {daysUntilExpiry <= 30 && daysUntilExpiry >= 0 && (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        
                        {process.regional_nuclei && (
                          <div className="text-gray-600">
                            <strong>Núcleo:</strong> {process.regional_nuclei.acronym}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {processes?.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum processo encontrado
          </h3>
          <p className="text-gray-600">
            Não há processos cadastrados no sistema.
          </p>
        </div>
      )}
    </div>
  );
}
