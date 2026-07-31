import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { dashboardEntityKey, isSponsorshipOrigin } from "@/hooks/dashboardIdentityUtils";

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
  municipio_id?: number | string | null;
  nucleo_origem_id?: number | string | null;
  municipio_nome?: string | null;
  nucleo_origem_texto?: string | null;
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
  regionalNucleusId: number | null;
  municipalityName: string;
  regionalNucleusName: string;
  raw: EventDashboardRow;
};

const firstDefined = <T,>(...values: Array<T | null | undefined>) => values.find(value => value !== null && value !== undefined && value !== "") as T | undefined;

export type EventDashboardSummary = {
  valorContratoAssinado: number;
  valorRepassado: number;
  saldoARepassar: number;
  totalProcesses: number;
  totalContratosAssinados: number;
};

const isArchivedContract = (value: unknown) => value === "arquivado";

const asNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const asId = (value: unknown) => {
  const parsed = asNumber(value);
  return parsed > 0 ? parsed : null;
};

const normalizeEvent = (
  event: EventDashboardRow,
  municipalitiesById: Map<number, MunicipalityLookup>,
  regionalNucleiById: Map<number, RegionalNucleusLookup>,
): EventDashboardItem => {
  const municipalityId = asId(firstDefined(event.municipio_id, event.municipality_id));
  const regionalNucleusId = asId(firstDefined(event.nucleo_origem_id, event.regional_nucleus_id));
  const municipality = municipalityId ? municipalitiesById.get(municipalityId) : undefined;
  const regionalNucleus = regionalNucleusId ? regionalNucleiById.get(regionalNucleusId) : undefined;

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
    regionalNucleusId,
    municipalityName: firstDefined(municipality?.name, event.municipio_nome, event.municipio, event.nome_municipio) || "Não definido",
    regionalNucleusName: firstDefined(regionalNucleus?.name, event.nucleo_origem_texto, event.nucleo_regional, event.nucleo_regional_nome, event.nome_nucleo_regional, event.nucleo) || "Não definido",
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
      const { data: eventsData, error: eventsError } = await (supabase as any)
        .from("events")
        .select("*");

      if (eventsError) throw eventsError;

      const eventRows = (eventsData || []) as EventDashboardRow[];
      const municipalityIds = Array.from(new Set(
        eventRows
          .map(event => asId(firstDefined(event.municipio_id, event.municipality_id)))
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
        eventRows
          .map(event => asId(firstDefined(event.nucleo_origem_id, event.regional_nucleus_id)))
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
      const activeEventRows = eventRows.filter(event => !isArchivedContract(event.contrato_assinado));
      const events = activeEventRows
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
      const activeMunicipalities = new Set(events.map(event => dashboardEntityKey("municipio", event.municipalityId, event.municipalityName)).filter(Boolean));
      const activeRegionalNuclei = new Set(events.map(event => isSponsorshipOrigin(event.regionalNucleusName) ? null : dashboardEntityKey("nucleo", event.regionalNucleusId, event.regionalNucleusName)).filter(Boolean));

      const totalPortarias = activeEventRows.reduce((sum, event) => sum + asNumber(event.valor_concedente), 0);
      const valorPago = activeEventRows
        .filter(event => event.foi_pago === true)
        .reduce((sum, event) => sum + asNumber(event.valor_concedente), 0);
      const totalContratoConsiderado = activeEventRows
        .filter(event => event.contrato_assinado === "sim" || event.contrato_assinado === "não")
        .reduce((sum, event) => sum + asNumber(event.valor_concedente), 0);
      const valorContratosAssinados = activeEventRows
        .filter(event => event.contrato_assinado === "sim")
        .reduce((sum, event) => sum + asNumber(event.valor_concedente), 0);

      return {
        events,
        stats: {
          totalProcesses: activeEventRows.length,
          transferredValue: totalPortarias,
          valorRepassado: valorPago,
          saldoARepassar: valorContratosAssinados - valorPago,
          totalContratosAssinados: activeEventRows.filter(event => event.contrato_assinado === "sim").length,
          processosRepasseConcluido: valorPago,
          municipiosPrimeiraParcela: valorPago,
          pctContratosAssinadosPorValor: valorContratosAssinados > 0 ? (valorPago / valorContratosAssinados) * 100 : 0,
          pctPortariaPaga: totalContratoConsiderado > 0 ? (valorPago / totalContratoConsiderado) * 100 : 0,
          valorContratosAssinados,
          totalContratoConsiderado,
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
