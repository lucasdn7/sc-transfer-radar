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
        (supabase as any)
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
          paid: event.foi_pago === true,
          year: asNumber(event.ano) || null,
          municipalityKey: dashboardEntityKey("municipio", municipalityId, (municipalityId ? eventMunicipalities.get(municipalityId)?.name : undefined) || event.municipio_nome),
          nucleusKey: isSponsorshipOrigin(event.nucleo_origem_texto) ? null : dashboardEntityKey("nucleo", regionalNucleusId, (regionalNucleusId ? eventNuclei.get(regionalNucleusId)?.name : undefined) || event.nucleo_origem_texto),
          nucleusName: isSponsorshipOrigin(event.nucleo_origem_texto) ? null : ((regionalNucleusId ? eventNuclei.get(regionalNucleusId)?.name : undefined) || event.nucleo_origem_texto || "Não definido"),
        };
      });

      const totalPortariasProcesses = processes.reduce((sum, process) => sum + asNumber(process.total_concedente_value), 0);
      const signedProcesses = processes.filter(process => process.contrato_assinado === true);
      const totalRepassedProcesses = processes.reduce((sum, process) => {
        const paid = (process.process_parcels || [])
          .filter((parcel: any) => parcel.payment_date)
          .reduce((parcelSum: number, parcel: any) => parcelSum + asNumber(parcel.value), 0);
        return sum + paid;
      }, 0);
      const totalConcedenteSignedProcesses = signedProcesses.reduce((sum, process) => sum + asNumber(process.total_concedente_value), 0);
      const totalPortariasEvents = eventRows.reduce((sum, event) => sum + asNumber(event.valor_concedente), 0);
      const totalRepassedEvents = eventRows.filter(event => event.foi_pago === true).reduce((sum, event) => sum + asNumber(event.valor_concedente), 0);
      const totalPortarias = totalPortariasProcesses + totalPortariasEvents;
      const totalRepassed = totalRepassedProcesses + totalRepassedEvents;
      const totalContratoConsiderado = totalPortariasProcesses + eventRows
        .filter(event => event.contrato_assinado === "sim" || event.contrato_assinado === "não")
        .reduce((sum, event) => sum + asNumber(event.valor_concedente), 0);
      const valorContratosAssinados = totalConcedenteSignedProcesses + eventRows
        .filter(event => event.contrato_assinado === "sim")
        .reduce((sum, event) => sum + asNumber(event.valor_concedente), 0);
      const processosRepasseConcluido = processes.filter(process => {
        const parcels = process.process_parcels || [];
        return parcels.length > 0 && parcels.every((parcel: any) => parcel.payment_date);
      }).length + eventRows.filter(event => event.foi_pago === true).length;
      const processosPrimeiraParcela = processes.filter(process => {
        const paid = (process.process_parcels || [])
          .filter((parcel: any) => parcel.payment_date)
          .reduce((sum: number, parcel: any) => sum + asNumber(parcel.value), 0);
        return paid > 0 && asNumber(process.total_concedente_value) - paid > 0;
      }).length + eventRows.filter(event => event.foi_pago === true).length;

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
        const processKeys = new Set<string>();
        processes.filter(process => yearFromDate(process.vigencia_date) === year).forEach(process => {
          const key = dashboardEntityKey("municipio", process.municipality_id, process.municipalities?.name);
          if (key) processKeys.add(key);
        });
        const eventKeys = new Set<string>();
        eventItems.filter(event => event.year === year).forEach(event => {
          if (event.municipalityKey) eventKeys.add(event.municipalityKey);
        });
        return { name: year.toString(), obras: processKeys.size, eventos: eventKeys.size };
      });

      const countsByYear = YEARS.map(year => ({
        name: year.toString(),
        obras: processes.filter(process => yearFromDate(process.vigencia_date) === year).length,
        eventos: eventItems.filter(event => event.year === year).length,
      }));

      const valuesByNucleusMap = new Map<string, { name: string; obras: number; eventos: number }>();
      processes.forEach(process => {
        const key = dashboardEntityKey("nucleo", process.regional_nucleus_id, process.regional_nuclei?.name);
        if (!key) return;
        const name = process.regional_nuclei?.name || "Não definido";
        const current = valuesByNucleusMap.get(key) || { name, obras: 0, eventos: 0 };
        valuesByNucleusMap.set(key, { ...current, obras: current.obras + asNumber(process.total_concedente_value) });
      });
      eventItems.forEach(event => {
        if (!event.nucleusKey) return;
        const name = event.nucleusName || "Não definido";
        const current = valuesByNucleusMap.get(event.nucleusKey) || { name, obras: 0, eventos: 0 };
        valuesByNucleusMap.set(event.nucleusKey, { ...current, eventos: current.eventos + event.value });
      });

      return {
        stats: {
          totalRepassed,
          signedContracts: processes.filter(process => process.contrato_assinado === true).length + eventRows.filter(event => event.contrato_assinado === "sim").length,
          pendingTransfer: totalPortarias - totalRepassed,
          valorTotalContratoAssinado: valorContratosAssinados,
          totalPortarias,
          processosRepasseConcluido,
          processosPrimeiraParcela,
          pctContratosAssinadosPorValor: totalContratoConsiderado > 0 ? (valorContratosAssinados / totalContratoConsiderado) * 100 : 0,
          totalContratoConsiderado,
          municipalitiesCount: municipalityKeys.size,
          totalProcesses: processes.length + eventRows.length,
          regionalNucleiCount: nucleusKeys.size,
        },
        valuesByYear,
        municipalitiesByYear,
        countsByYear,
        valuesByNucleus: Array.from(valuesByNucleusMap.values()).sort((a, b) => (b.obras + b.eventos) - (a.obras + a.eventos)),
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 2,
  });
}
