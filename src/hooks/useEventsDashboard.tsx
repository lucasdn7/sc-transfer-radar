import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type EventDashboardRow = Record<string, any> & {
  id: number;
  nome?: string | null;
  numero_processo?: string | null;
  objeto?: string | null;
  ano?: number | string | null;
  data_inicio?: string | null;
  data_final?: string | null;
  valor_concedente?: number | string | null;
  valor_proponente?: number | string | null;
  municipio_id?: number | null;
};

type MunicipalityLookup = {
  id: number;
  name?: string | null;
  regional_nucleus_id?: number | null;
};

type RegionalNucleusLookup = {
  id: number;
  name?: string | null;
  acronym?: string | null;
};

type EventDashboardItem = {
  id: number;
  name: string;
  processNumber: string | null;
  repasseType: string;
  year: number | null;
  startDate: string | null;
  endDate: string | null;
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

const normalizeEvent = (
  event: EventDashboardRow,
  municipalitiesById: Map<number, MunicipalityLookup>,
  regionalNucleiById: Map<number, RegionalNucleusLookup>,
): EventDashboardItem => {
  const municipalityId = firstDefined(event.municipio_id, event.municipality_id) || null;
  const municipality = municipalityId ? municipalitiesById.get(municipalityId) : undefined;
  const regionalNucleus = municipality?.regional_nucleus_id ? regionalNucleiById.get(municipality.regional_nucleus_id) : undefined;

  return {
    id: event.id,
    name: firstDefined(event.nome, event.name, event.titulo, event.title) || "Evento sem nome",
    processNumber: firstDefined(event.numero_processo, event.process_number, event.processo, event.numeroProcesso) || null,
    repasseType: firstDefined(event.tipo_repasse, event.tipo_de_repasse, event.tipo, event.objeto, event.categoria) || "Não definido",
    year: asNumber(event.ano) || null,
    startDate: event.data_inicio || null,
    endDate: event.data_final || null,
    transferredValue: asNumber(event.valor_concedente),
    proponentValue: asNumber(event.valor_proponente),
    municipalityId,
    municipalityName: firstDefined(municipality?.name, event.municipio, event.municipio_nome, event.nome_municipio) || "Não definido",
    regionalNucleusName: firstDefined(regionalNucleus?.name, event.nucleo_regional, event.nucleo_regional_nome, event.nome_nucleo_regional, event.nucleo) || "Não definido",
    raw: event,
  };
};

const DASHBOARD_YEARS = [2023, 2024, 2025, 2026];

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
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*");

      if (eventsError) throw eventsError;

      const eventRows = (eventsData || []) as EventDashboardRow[];
      const municipalityIds = Array.from(new Set(
        eventRows
          .map(event => firstDefined(event.municipio_id, event.municipality_id))
          .filter((id): id is number => typeof id === "number")
      ));

      let municipalities: MunicipalityLookup[] = [];
      if (municipalityIds.length > 0) {
        const { data: municipalitiesData } = await supabase
          .from("municipalities")
          .select("id, name, regional_nucleus_id")
          .in("id", municipalityIds);
        municipalities = (municipalitiesData || []) as MunicipalityLookup[];
      }

      const regionalNucleusIds = Array.from(new Set(
        municipalities
          .map(municipality => municipality.regional_nucleus_id)
          .filter((id): id is number => typeof id === "number")
      ));

      let regionalNuclei: RegionalNucleusLookup[] = [];
      if (regionalNucleusIds.length > 0) {
        const { data: regionalNucleiData } = await supabase
          .from("regional_nuclei")
          .select("id, name, acronym")
          .in("id", regionalNucleusIds);
        regionalNuclei = (regionalNucleiData || []) as RegionalNucleusLookup[];
      }

      const municipalitiesById = new Map(municipalities.map(municipality => [municipality.id, municipality]));
      const regionalNucleiById = new Map(regionalNuclei.map(regionalNucleus => [regionalNucleus.id, regionalNucleus]));
      const events = eventRows
        .map(event => normalizeEvent(event, municipalitiesById, regionalNucleiById))
        .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
      const valueByYear = DASHBOARD_YEARS.map(year => ({
        name: year.toString(),
        value: events
          .filter(event => event.year === year)
          .reduce((sum, event) => sum + event.transferredValue, 0),
      }));
      const eventsByYear = DASHBOARD_YEARS.map(year => ({
        name: year.toString(),
        value: events.filter(event => event.year === year).length,
      }));
      const activeMunicipalities = new Set(events.map(event => event.municipalityId || event.municipalityName).filter(Boolean));
      const activeRegionalNuclei = new Set(events.map(event => event.regionalNucleusName).filter(name => name && name !== "Não definido"));

      return {
        events,
        stats: {
          totalProcesses: events.length,
          transferredValue: events.reduce((sum, event) => sum + event.transferredValue, 0),
          municipalitiesCount: activeMunicipalities.size,
          regionalNucleiCount: activeRegionalNuclei.size,
        },
        byRepasseType: groupEvents(events, event => event.repasseType),
        valueByYear,
        eventsByYear,
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 2,
  });
}

export type { EventDashboardItem, EventDashboardRow };
