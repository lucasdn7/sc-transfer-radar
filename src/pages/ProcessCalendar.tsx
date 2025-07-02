
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getStatusColor, formatCurrency } from '@/utils/processUtils';

export default function ProcessCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { data: processes, isLoading, error } = useQuery({
    queryKey: ['process-calendar', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: async () => {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('processes')
        .select(`
          *,
          municipalities(name, region),
          regional_nuclei(name, acronym)
        `)
        .gte('vigencia_date', startOfMonth.toISOString().split('T')[0])
        .lte('vigencia_date', endOfMonth.toISOString().split('T')[0])
        .order('vigencia_date');
      
      if (error) throw error;
      return data || [];
    },
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
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
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

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

  return (
    <div className="space-y-6">
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
                    {dayProcesses.map(process => (
                      <div 
                        key={process.id}
                        className="text-xs p-1 rounded bg-gray-100 hover:bg-gray-200 cursor-pointer"
                        title={`${process.process_number} - ${process.municipalities?.name}`}
                      >
                        <div className="font-medium truncate">
                          {process.process_number}
                        </div>
                        <div className="text-gray-600 truncate">
                          {process.municipalities?.name}
                        </div>
                        <div className="text-green-600 font-medium">
                          {formatCurrency(process.total_portaria_value)}
                        </div>
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
                <div key={process.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{process.process_number}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {process.municipalities?.name}
                    </div>
                    <Badge className={getStatusColor(process.current_status)}>
                      {process.current_status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatCurrency(process.total_portaria_value)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Vigência: {new Date(process.vigencia_date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
