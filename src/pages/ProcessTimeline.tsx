
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getStatusColor, getStatusLabel, formatCurrency } from '@/utils/processUtils';
import type { Database } from '@/integrations/supabase/types';

type ProcessStatus = Database['public']['Enums']['process_status'];

export default function ProcessTimeline() {
  const { data: processes, isLoading, error } = useQuery({
    queryKey: ['process-timeline'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          *,
          municipalities(name, region),
          regional_nuclei(name, acronym)
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

    if (diffDays < 0) return { status: 'expired', label: 'Vencido', color: 'bg-red-500' };
    if (diffDays <= 7) return { status: 'critical', label: 'Crítico', color: 'bg-red-400' };
    if (diffDays <= 30) return { status: 'warning', label: 'Atenção', color: 'bg-yellow-400' };
    return { status: 'normal', label: 'Normal', color: 'bg-green-400' };
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Timeline de Processos</h1>
        <p className="text-muted-foreground">
          Cronograma de vigência dos processos organizados por mês
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedProcesses).map(([month, monthProcesses]) => (
          <div key={month} className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold capitalize">{month}</h2>
              <Badge variant="outline">{monthProcesses.length} processos</Badge>
            </div>
            
            <div className="space-y-4 ml-7">
              {monthProcesses.map((process) => {
                const timelineStatus = getTimelineStatus(process.vigencia_date);
                const daysUntilExpiry = Math.ceil(
                  (new Date(process.vigencia_date).getTime() - new Date().getTime()) / 
                  (1000 * 60 * 60 * 24)
                );
                
                return (
                  <Card key={process.id} className="relative">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${timelineStatus.color}`} />
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <CardTitle className="text-lg">{process.process_number}</CardTitle>
                          <div className="flex gap-2">
                            <Badge className={getStatusColor(process.current_status)}>
                              {getStatusLabel(process.current_status)}
                            </Badge>
                            <Badge variant={timelineStatus.status === 'expired' ? 'destructive' : 'secondary'}>
                              {timelineStatus.label}
                            </Badge>
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
                          <span>{process.municipalities?.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Vigência: {new Date(process.vigencia_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className={daysUntilExpiry < 0 ? 'text-red-600' : daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-gray-600'}>
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
