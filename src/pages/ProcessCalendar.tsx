
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, MapPin, ExternalLink, Plus, FileText, Clock, ArrowRight, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/processUtils';
import { ProcessDetailModal } from '@/components/calendar/ProcessDetailModal';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect } from 'react';

export default function ProcessCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isParcelModalOpen, setIsParcelModalOpen] = useState(false);
  
  // Buscar processos
  const { data: processes, isLoading, error, refetch } = useQuery({
    queryKey: ['process-calendar', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: async () => {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const { data, error } = await supabase
        .from('processes')
        .select(`*, municipalities(name), regional_nuclei(name, acronym), status_processos(nome, cor)`)
        .gte('vigencia_date', startOfMonth.toISOString().split('T')[0])
        .lte('vigencia_date', endOfMonth.toISOString().split('T')[0])
        .order('vigencia_date');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000, // Atualização automática a cada 10s
  });

  // Buscar parcelas pagas do mês
  const { data: paidParcels = [] } = useQuery({
    queryKey: ['calendar-parcels', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: async () => {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const { data, error } = await supabase
        .from('process_parcels')
        .select('*, processes(id, process_number, total_concedente_value, municipalities(name), regional_nuclei(name, acronym), process_parcels(id, parcel_number, value, payment_date))')
        .gte('payment_date', startOfMonth.toISOString().split('T')[0])
        .lte('payment_date', endOfMonth.toISOString().split('T')[0]);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getProcessesForDay = (day: number) => {
    if (!processes) return [];
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString().split('T')[0];
    return processes.filter(process => process.vigencia_date === dateStr);
  };

  // Função para obter parcelas pagas de um dia
  const getParcelsForDay = (day: number) => {
    if (!paidParcels) return [];
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString().split('T')[0];
    return paidParcels.filter(parcel => parcel.payment_date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'finalizado':
        return 'bg-green-500';
      case 'em andamento':
      case 'aprovado':
        return 'bg-yellow-500';
      case 'em análise':
        return 'bg-blue-500';
      case 'cancelado':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const addToGoogleCalendar = (process: any) => {
    const startDate = new Date(process.vigencia_date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);
    
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(process.process_number)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(process.object)}&location=${encodeURIComponent(process.municipalities?.name || '')}`;
    
    window.open(googleUrl, '_blank');
  };

  const handleProcessClick = (process: any) => {
    setSelectedProcess(process);
    setIsModalOpen(true);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const monthlyStats = processes ? {
    total: processes.length,
    totalValue: processes.reduce((sum, p) => sum + (p.total_portaria_value || 0), 0),
    byStatus: processes.reduce((acc, p) => {
      const status = p.status_processos?.nome || 'Não definido';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  } : null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendário de Processos</h1>
          <p className="text-muted-foreground">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendário de Processos</h1>
          <p className="text-red-600">Erro ao carregar calendário: {error.message}</p>
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
            <Link to="/process-timeline">
              <Clock className="h-3 w-3 mr-1" />
              Timeline
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

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Início</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Calendário de Processos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Navegação contextual para outras telas de Monitoramento */}
        {navigationCard}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendário de Processos</h1>
            <p className="text-muted-foreground">
              Visualização das datas de vigência dos processos
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats do mês */}
        {monthlyStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{monthlyStats.total}</div>
                <div className="text-sm text-gray-600">Processos no Mês</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(monthlyStats.totalValue)}
                </div>
                <div className="text-sm text-gray-600">Valor Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-1">
                  {Object.entries(monthlyStats.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between text-sm">
                      <span>{status}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Button size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Processo
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Legenda */}
        <div className="flex gap-4 items-center mb-2">
          <div className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded bg-blue-500"></span> Processos Vigentes</div>
          <div className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded bg-green-500"></span> Parcelas Repassadas</div>
          <div className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded bg-red-500"></span> Processos Vencidos</div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendário Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center font-medium text-gray-600 bg-gray-50 rounded">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((day, index) => {
                if (day === null) {
                  return <div key={index} className="h-32 bg-gray-50 rounded opacity-50" />;
                }
                
                const dayProcesses = getProcessesForDay(day);
                const dayParcels = getParcelsForDay(day);
                const isToday = new Date().getDate() === day && 
                              new Date().getMonth() === currentDate.getMonth() && 
                              new Date().getFullYear() === currentDate.getFullYear();
                
                return (
                  <div 
                    key={day} 
                    className={`h-32 border rounded p-1 overflow-y-auto ${
                      isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {day}
                    </div>
                    
                    <div className="space-y-1">
                      {/* Processos Vigentes */}
                      {dayProcesses.map(process => {
                        const isVencido = new Date(process.vigencia_date) < new Date();
                        return (
                          <div
                            key={process.id}
                            className={`text-xs p-1 rounded cursor-pointer transition-colors ${isVencido ? 'bg-red-500' : 'bg-blue-500'} text-white hover:opacity-80`}
                            onClick={() => handleProcessClick(process)}
                          >
                            <div className="font-medium truncate">{process.process_number}</div>
                            <div className="truncate opacity-90">{process.municipalities?.name || 'N/A'}</div>
                          </div>
                        );
                      })}
                      {/* Parcelas Repassadas */}
                      {dayParcels.map(parcel => (
                        <div
                          key={parcel.id}
                          className="text-xs p-1 rounded cursor-pointer transition-colors bg-green-500 text-white hover:opacity-80 border border-green-700"
                          onClick={() => { setSelectedParcel(parcel); setIsParcelModalOpen(true); }}
                        >
                          <div className="font-medium truncate">Parcela {parcel.parcel_number}</div>
                          <div className="truncate opacity-90">R$ {formatCurrency(parcel.value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {processes && processes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Processos do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processes.map(process => (
                  <div 
                    key={process.id} 
                    className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleProcessClick(process)}
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{process.process_number}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {process.municipalities?.name || 'N/A'}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(process.status_processos?.nome || '')} text-white border-0`}
                      >
                        {process.status_processos?.nome || 'Não definido'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatCurrency(process.total_portaria_value)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Vigência: {formatDateDisplay(process.vigencia_date)}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToGoogleCalendar(process);
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Google Calendar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <ProcessDetailModal 
          process={selectedProcess}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
        {/* Modal de parcela repassada */}
        {isParcelModalOpen && selectedParcel && (
          (() => {
            // Corrigir para usar as parcelas do processo relacionadas
            const allParcels = selectedParcel.processes?.process_parcels || [];
            const totalParcels = allParcels.length;
            // Ordenar por número da parcela
            allParcels.sort((a: any, b: any) => (a.parcel_number || 0) - (b.parcel_number || 0));
            // Parcelas pagas
            const paidParcels = allParcels.filter((p: any) => p.payment_date);
            const paidCount = paidParcels.length;
            const paidValue = paidParcels.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
            const concedenteValue = selectedParcel.processes?.total_concedente_value || 0;
            const saldoARepassar = concedenteValue - paidValue;
            // Descobrir o índice da parcela atual (1-based)
            const parcelaAtual = selectedParcel.parcel_number;
            return (
              <div className="fixed z-50 left-0 top-0 w-full h-full flex items-center justify-center bg-black bg-opacity-40">
                <Card className="w-full max-w-md shadow-2xl">
                  <CardHeader>
                    <CardTitle>Detalhes da Parcela Repassada</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><b>Valor repassado:</b> {formatCurrency(selectedParcel.value)}</div>
                    <div><b>Data do repasse:</b> {formatDateDisplay(selectedParcel.payment_date)}</div>
                    <div><b>Número da parcela:</b> {parcelaAtual}ª</div>
                    <div><b>Município:</b> {selectedParcel.processes?.municipalities?.name || 'N/A'}</div>
                    <div><b>Núcleo Regional:</b> {selectedParcel.processes?.regional_nuclei?.name || 'N/A'}</div>
                    <div><b>Processo relacionado:</b> {selectedParcel.processes?.process_number || 'N/A'}</div>
                    <div><b>Total de parcelas:</b> {totalParcels}</div>
                    <div><b>Progresso:</b> {paidCount}/{totalParcels}</div>
                    <div><b>Já repassado para o município:</b> {formatCurrency(paidValue)}</div>
                    <div><b>Saldo a repassar:</b> {formatCurrency(saldoARepassar > 0 ? saldoARepassar : 0)}</div>
                  </CardContent>
                  <div className="flex justify-end p-4 pt-0">
                    <Button onClick={() => { setIsParcelModalOpen(false); setSelectedParcel(null); }}>Fechar</Button>
                  </div>
                </Card>
              </div>
            );
          })()
        )}
      </div>
    </TooltipProvider>
  );
}
