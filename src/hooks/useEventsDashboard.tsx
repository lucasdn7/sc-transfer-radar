import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type EventDashboardRow = Record<string, any> & {
  id: number;
  nome?: string | null;
  numero_processo?: string | null;
  objeto?: string | null;
  data_evento?: string | null;
  valor_concedente?: number | null;
  valor_proponente?: number | null;
  municipio_id?: number | null;
  municipalities?: {
    name?: string | null;
    regional_nuclei?: { name?: string | null; acronym?: string | null } | null;
  } | null;
};

type EventDashboardItem = {
  id: number;
  name: string;
  processNumber: string | null;
  repasseType: string;
  date: string | null;
  transferredValue: number;
  proponentValue: number;
  municipalityId: number | null;
  municipalityName: string;
  regionalNucleusName: string;
  raw: EventDashboardRow;
};

const firstDefined = <T,>(...values: Array<T | null | undefined>) => values.find(value => value !== null && value !== undefined && value !== "") as T | undefined;

const asNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeEvent = (event: EventDashboardRow): EventDashboardItem => {
  const municipalityName = firstDefined(
    event.municipalities?.name,
    event.municipio,
    event.municipio_nome,
    event.nome_municipio,
  ) || "Não definido";

  const regionalNucleusName = firstDefined(
    event.municipalities?.regional_nuclei?.name,
    event.nucleo_regional,
    event.nucleo_regional_nome,
    event.nome_nucleo_regional,
    event.nucleo,
  ) || "Não definido";

  return {
    id: event.id,
    name: firstDefined(event.nome, event.name, event.titulo, event.title) || "Evento sem nome",
    processNumber: firstDefined(event.numero_processo, event.process_number, event.processo, event.numeroProcesso) || null,
    repasseType: firstDefined(event.tipo_repasse, event.tipo_de_repasse, event.tipo, event.objeto, event.categoria) || "Não definido",
    date: firstDefined(event.data_evento, event.data, event.date, event.event_date) || null,
    transferredValue: asNumber(firstDefined(event.valor_transferido, event.valor_concedente, event.valor_repasse, event.valor, event.value)),
    proponentValue: asNumber(firstDefined(event.valor_proponente, event.valor_contrapartida, event.contrapartida)),
    municipalityId: firstDefined(event.municipio_id, event.municipality_id) || null,
    municipalityName,
    regionalNucleusName,
    raw: event,
  };
};

const getYear = (date: string | null) => (date ? new Date(`${date}T00:00:00`).getFullYear().toString() : "Sem data");

const groupEvents = (events: EventDashboardItem[], getKey: (event: EventDashboardItem) => string) => {
  const grouped = events.reduce((acc, event) => {
    const key = getKey(event);
    if (!acc[key]) {
      acc[key] = { name: key, processos: 0, value: 0 };
    }
    acc[key].processos += 1;
    acc[key].value += event.transferredValue;
    return acc;
  }, {} as Record<string, { name: string; processos: number; value: number }>);

  return Object.values(grouped).sort((a, b) => b.value - a.value || b.processos - a.processos);
};

export function useEventsDashboard() {
  return useQuery({
    queryKey: ["dashboard-events"],
    queryFn: async () => {
      const queryWithRelations = supabase
        .from("events")
        .select(`
          *,
          municipalities (
            name,
            regional_nuclei (name, acronym)
          )
        `)
        .order("data_evento", { ascending: true });

      let { data, error } = await queryWithRelations;

      if (error) {
        const fallback = await supabase
          .from("events")
          .select("*")
          .order("data_evento", { ascending: true });
        data = fallback.data;
        error = fallback.error;
      }

      if (error) throw error;

      const events = ((data || []) as EventDashboardRow[]).map(normalizeEvent);
      const municipalities = new Set(events.map(event => event.municipalityId || event.municipalityName).filter(Boolean));
      const regionalNuclei = new Set(events.map(event => event.regionalNucleusName).filter(name => name && name !== "Não definido"));

      return {
        events,
        stats: {
          totalProcesses: events.length,
          transferredValue: events.reduce((sum, event) => sum + event.transferredValue, 0),
          municipalitiesCount: municipalities.size,
          regionalNucleiCount: regionalNuclei.size,
        },
        byRepasseType: groupEvents(events, event => event.repasseType),
        byYear: groupEvents(events, event => getYear(event.date)).sort((a, b) => Number(a.name) - Number(b.name)),
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 2,
  });
}

export type { EventDashboardItem, EventDashboardRow };
