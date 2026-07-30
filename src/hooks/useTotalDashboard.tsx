import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { dashboardEntityKey, isSponsorshipOrigin } from "@/hooks/dashboardIdentityUtils";

const YEARS = [2023, 2024, 2025, 2026];

const asNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const asId = (value: unknown) => {
  const parsed = asNumber(value);
  return parsed > 0 ? parsed : null;
};

const yearFromDate = (value: unknown) => {
  if (typeof value !== "string" || !value) return null;
  const year = new Date(`${value}T00:00:00`).getFullYear();
  return Number.isFinite(year) ? year : null;
};

export function useTotalDashboard() {
  return useQuery({
    queryKey: ["total-dashboard"],
    queryFn: async () => {
      const [processesResult, eventsResult] = await Promise.all([
        supabase
          .from("processes")
          .select("id, total_concedente_value, vigencia_date, contrato_assinado, municipality_id, regional_nucleus_id, municipalities(name), regional_nuclei(name), process_parcels(value, payment_date)"),
        supabase
          .from("events")
          .select("*"),
      ]);

      if (processesResult.error) throw processesResult.error;
      if (eventsResult.error) throw eventsResult.error;

      const processes = (processesResult.data || []) as any[];
      const eventRows = (eventsResult.data || []) as any[];
      const eventMunicipalityIds = Array.from(new Set(eventRows.map(event => asId(event.municipio_id)).filter((id): id is number => typeof id === "number")));
      const eventNucleusIds = Array.from(new Set(eventRows.map(event => asId(event.nucleo_origem_id)).filter((id): id is number => typeof id === "number")));

      const [eventMunicipalitiesResult, eventNucleiResult] = await Promise.all([
        eventMunicipalityIds.length > 0
          ? supabase.from("municipalities").select("id, name").in("id", eventMunicipalityIds)
          : Promise.resolve({ data: [], error: null }),
        eventNucleusIds.length > 0
          ? supabase.from("regional_nuclei").select("id, name").in("id", eventNucleusIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const eventMunicipalities = new Map(((eventMunicipalitiesResult.data || []) as any[]).map(item => [item.id, item]));
      const eventNuclei = new Map(((eventNucleiResult.data || []) as any[]).map(item => [item.id, item]));

      const eventItems = eventRows.map(event => {
        const municipalityId = asId(event.municipio_id);
        const regionalNucleusId = asId(event.nucleo_origem_id);
        return {
          value: asNumber(event.valor_concedente),
          year: asNumber(event.ano) || null,
          municipalityKey: dashboardEntityKey("municipio", municipalityId, (municipalityId ? eventMunicipalities.get(municipalityId)?.name : undefined) || event.municipio_nome),
          nucleusKey: isSponsorshipOrigin(event.nucleo_origem_texto) ? null : dashboardEntityKey("nucleo", regionalNucleusId, (regionalNucleusId ? eventNuclei.get(regionalNucleusId)?.name : undefined) || event.nucleo_origem_texto),
          nucleusName: isSponsorshipOrigin(event.nucleo_origem_texto) ? null : ((regionalNucleusId ? eventNuclei.get(regionalNucleusId)?.name : undefined) || event.nucleo_origem_texto || "Não definido"),
        };
      });

      const totalRepassedProcesses = processes.reduce((sum, process) => {
        const paid = (process.process_parcels || [])
          .filter((parcel: any) => parcel.payment_date)
          .reduce((parcelSum: number, parcel: any) => parcelSum + asNumber(parcel.value), 0);
        return sum + paid;
      }, 0);
      const totalConcedenteProcesses = processes.reduce((sum, process) => sum + asNumber(process.total_concedente_value), 0);
      const totalConcedenteEvents = eventItems.reduce((sum, event) => sum + event.value, 0);
      const totalRepassed = totalRepassedProcesses + totalConcedenteEvents;
      const totalGranted = totalConcedenteProcesses + totalConcedenteEvents;

      const municipalityKeys = new Set<string>();
      const nucleusKeys = new Set<string>();
      processes.forEach(process => {
        const municipalityKey = dashboardEntityKey("municipio", process.municipality_id, process.municipalities?.name);
        const nucleusKey = dashboardEntityKey("nucleo", process.regional_nucleus_id, process.regional_nuclei?.name);
        if (municipalityKey) municipalityKeys.add(municipalityKey);
        if (nucleusKey) nucleusKeys.add(nucleusKey);
      });
      eventItems.forEach(event => {
        if (event.municipalityKey) municipalityKeys.add(event.municipalityKey);
        if (event.nucleusKey) nucleusKeys.add(event.nucleusKey);
      });

      const valuesByYear = YEARS.map(year => ({
        name: year.toString(),
        obras: processes.filter(process => yearFromDate(process.vigencia_date) === year).reduce((sum, process) => sum + asNumber(process.total_concedente_value), 0),
        eventos: eventItems.filter(event => event.year === year).reduce((sum, event) => sum + event.value, 0),
      }));

      const municipalitiesByYear = YEARS.map(year => {
        const keys = new Set<string>();
        processes.filter(process => yearFromDate(process.vigencia_date) === year).forEach(process => {
          const key = dashboardEntityKey("municipio", process.municipality_id, process.municipalities?.name);
          if (key) keys.add(key);
        });
        eventItems.filter(event => event.year === year).forEach(event => {
          if (event.municipalityKey) keys.add(event.municipalityKey);
        });
        return { name: year.toString(), value: keys.size };
      });

      const countsByYear = YEARS.map(year => ({
        name: year.toString(),
        obras: processes.filter(process => yearFromDate(process.vigencia_date) === year).length,
        eventos: eventItems.filter(event => event.year === year).length,
      }));

      const valuesByNucleusMap = new Map<string, { name: string; value: number }>();
      processes.forEach(process => {
        const key = dashboardEntityKey("nucleo", process.regional_nucleus_id, process.regional_nuclei?.name);
        if (!key) return;
        const name = process.regional_nuclei?.name || "Não definido";
        valuesByNucleusMap.set(key, { name, value: (valuesByNucleusMap.get(key)?.value || 0) + asNumber(process.total_concedente_value) });
      });
      eventItems.forEach(event => {
        if (!event.nucleusKey) return;
        const name = event.nucleusName || "Não definido";
        valuesByNucleusMap.set(event.nucleusKey, { name, value: (valuesByNucleusMap.get(event.nucleusKey)?.value || 0) + event.value });
      });

      return {
        stats: {
          totalRepassed,
          signedContracts: processes.filter(process => process.contrato_assinado === true).length + eventRows.length,
          pendingTransfer: Math.max(totalGranted - totalRepassed, 0),
          municipalitiesCount: municipalityKeys.size,
          totalProcesses: processes.length + eventRows.length,
          regionalNucleiCount: nucleusKeys.size,
        },
        valuesByYear,
        municipalitiesByYear,
        countsByYear,
        valuesByNucleus: Array.from(valuesByNucleusMap.values()).sort((a, b) => b.value - a.value),
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 2,
  });
}
