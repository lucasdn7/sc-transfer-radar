import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type EventDashboardRow = {
  id: number;
  nome: string;
  numero_processo: string | null;
  objeto: string;
  data_evento: string;
  valor_concedente: number | null;
  valor_proponente: number | null;
  municipio_id: number | null;
  municipalities?: {
    name: string;
    regional_nuclei?: { name: string; acronym: string | null } | null;
  } | null;
};

const getEventValue = (event: EventDashboardRow) => event.valor_concedente || 0;
const getRepasseType = (event: EventDashboardRow) => event.objeto || event.nome || "Não definido";
const getYear = (date: string) => new Date(`${date}T00:00:00`).getFullYear().toString();

const groupEvents = (events: EventDashboardRow[], getKey: (event: EventDashboardRow) => string) => {
  const grouped = events.reduce((acc, event) => {
    const key = getKey(event);
    if (!acc[key]) {
      acc[key] = { name: key, processos: 0, value: 0 };
    }
    acc[key].processos += 1;
    acc[key].value += getEventValue(event);
    return acc;
  }, {} as Record<string, { name: string; processos: number; value: number }>);

  return Object.values(grouped).sort((a, b) => b.value - a.value || b.processos - a.processos);
};

export function useEventsDashboard() {
  return useQuery({
    queryKey: ["dashboard-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          id,
          nome,
          numero_processo,
          objeto,
          data_evento,
          valor_concedente,
          valor_proponente,
          municipio_id,
          municipalities (
            name,
            regional_nuclei (name, acronym)
          )
        `)
        .order("data_evento", { ascending: true });

      if (error) throw error;

      const events = (data || []) as EventDashboardRow[];
      const municipalities = new Set(events.map(event => event.municipio_id).filter(Boolean));
      const regionalNuclei = new Set(
        events
          .map(event => event.municipalities?.regional_nuclei?.name)
          .filter(Boolean)
      );

      return {
        events,
        stats: {
          totalProcesses: events.length,
          transferredValue: events.reduce((sum, event) => sum + getEventValue(event), 0),
          municipalitiesCount: municipalities.size,
          regionalNucleiCount: regionalNuclei.size,
        },
        byRepasseType: groupEvents(events, getRepasseType),
        byYear: groupEvents(events, event => getYear(event.data_evento)).sort((a, b) => Number(a.name) - Number(b.name)),
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 2,
  });
}

export type { EventDashboardRow };
