import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEventsDashboard, type EventDashboardItem } from "@/hooks/useEventsDashboard";
import { formatCurrency } from "@/utils/processUtils";

export function EventCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<EventDashboardItem | null>(null);
  const { data, isLoading, error } = useEventsDashboard();

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "prev" ? -1 : 1));
      return newDate;
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Array<number | null> = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let day = 1; day <= lastDay.getDate(); day++) days.push(day);
    return days;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split("T")[0];
    return (data?.events || []).filter(event => event.date === dateStr);
  };

  if (error) {
    return <div className="text-center py-8"><p className="text-[var(--accent-red)]">Erro ao carregar calendário de eventos</p></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Calendário de Eventos</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="text-lg font-semibold min-w-[200px] text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</div>
          <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-center mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-purple-500" /> Eventos</div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dayNames.map(day => <div key={day} className="p-2 text-center font-medium text-gray-600 bg-gray-50 rounded">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth().map((day, index) => {
            if (day === null) return <div key={index} className="h-32 bg-gray-50 rounded opacity-50" />;
            const dayEvents = getEventsForDay(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
            return (
              <div key={day} className={`h-32 border rounded p-1 overflow-y-auto ${isToday ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}>
                <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : "text-gray-900"}`}>{day}</div>
                <div className="space-y-1">
                  {isLoading ? null : dayEvents.map(event => (
                    <button key={event.id} className="w-full text-left text-xs p-1 rounded cursor-pointer transition-colors bg-purple-500 text-white hover:opacity-80" onClick={() => setSelectedEvent(event)}>
                      <div className="font-medium truncate">{event.name}</div>
                      <div className="truncate opacity-90">{event.municipalityName}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      {selectedEvent && (
        <div className="fixed z-50 left-0 top-0 w-full h-full flex items-center justify-center bg-black bg-opacity-40">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader><CardTitle>Detalhes do Evento</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div><b>Nome:</b> {selectedEvent.name}</div>
              <div><b>Tipo de repasse:</b> {selectedEvent.repasseType}</div>
              <div><b>Valor:</b> {formatCurrency(selectedEvent.transferredValue)}</div>
              <div><b>Município:</b> {selectedEvent.municipalityName}</div>
              <div><b>Núcleo regional:</b> {selectedEvent.regionalNucleusName}</div>
              <div><b>Data:</b> {selectedEvent.date ? new Date(`${selectedEvent.date}T00:00:00`).toLocaleDateString("pt-BR") : "N/A"}</div>
              <div><b>Processo:</b> {selectedEvent.processNumber || "N/A"}</div>
            </CardContent>
            <div className="flex justify-end p-4 pt-0"><Button onClick={() => setSelectedEvent(null)}>Fechar</Button></div>
          </Card>
        </div>
      )}
    </Card>
  );
}
