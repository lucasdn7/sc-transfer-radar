import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EventRow {
  id?: number | string | null;
  process_number?: number | string | null;
  ano?: number | string | null;
  nome?: string | null;
  tipo?: string | null;
  municipio_id?: number | string | null;
  municipio_nome?: string | null;
  nucleo_origem_id?: number | string | null;
  nucleo_origem_texto?: string | null;
  valor_concedente?: number | string | null;
  valor_proponente?: number | string | null;
  contrato_assinado?: string | null;
  foi_pago?: boolean | string | number | null;
  regiao_turistica?: string | null;
  created_at?: string | null;
}

interface MunicipalityRow {
  id?: number | string | null;
  name?: string | null;
  region_id?: number | string | null;
  regional_nucleus_id?: number | string | null;
}

interface RegionRow {
  id?: number | string | null;
  nome?: string | null;
}

interface RegionalNucleusRow {
  id?: number | string | null;
  acronym?: string | null;
  name?: string | null;
}

interface ProcessRow {
  id?: number | string | null;
  municipality_id?: number | string | null;
  total_concedente_value?: number | string | null;
  municipalities?: {
    name?: string | null;
    region_id?: number | string | null;
    regioes?: { nome?: string | null } | null;
  } | null;
}

export interface EventosVisaoGeral {
  totalEventos: number;
  municipiosAtendidos: number;
  valorPublicado: number;
  valorContratado: number;
  valorPago: number;
  taxaPagamento: number;
}

export interface EventosStatusContratos {
  assinados: number;
  pendentes: number;
  arquivados: number;
  naoDefinido: number;
  valorAssinados: number;
  valorPendentes: number;
  valorArquivados: number;
  valorNaoDefinido: number;
  percAssinados: number;
  percPendentes: number;
  percArquivados: number;
  percNaoDefinido: number;
}

export interface EventosEvolucaoAno {
  ano: number;
  assinados: number;
  pendentes: number;
  arquivados: number;
  naoDefinido: number;
  valorAssinado: number;
}

export interface EventosTipoInstrumento {
  tipo: string;
  quantidade: number;
  valor: number;
  percQuantidade: number;
  percValor: number;
}

export interface EventosRegiaoTuristica {
  regiao: string;
  eventos: number;
  valorApoiado: number;
  mediaPorEvento: number;
}

export interface EventosNucleoRegional {
  sigla: string;
  nome: string;
  eventos: number;
  valor: number;
}

export interface EventosTopMunicipio {
  posicao: number;
  municipio: string;
  regiao: string;
  eventos: number;
  valor: number;
}

export interface EngajamentoMunicipio {
  posicao: number;
  municipio: string;
  regiao: string;
  obras: number;
  eventos: number;
  totalInteracoes: number;
  valorTotal: number;
}

export interface IndicatorsEventosData {
  visaoGeral: EventosVisaoGeral;
  statusContratos: EventosStatusContratos;
  evolucaoAnual: EventosEvolucaoAno[];
  tiposInstrumento: EventosTipoInstrumento[];
  regioesTuristicas: EventosRegiaoTuristica[];
  nucleosRegionais: EventosNucleoRegional[];
  topMunicipios: EventosTopMunicipio[];
  engajamento: EngajamentoMunicipio[];
}

const normalizeText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const toNumber = (value: unknown): number => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeContrato = (value: unknown): "sim" | "nao" | "arquivado" | "nao_definido" => {
  const normalized = normalizeText(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (normalized === "sim") return "sim";
  if (normalized === "nao" || normalized === "nao") return "nao";
  if (normalized === "arquivado") return "arquivado";
  return "nao_definido";
};

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = normalizeText(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalized === "true" || normalized === "sim" || normalized === "1" || normalized === "yes";
  }
  return false;
};

const safePercent = (numerator: number, denominator: number): number => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return 0;
  return (numerator / denominator) * 100;
};

export function useIndicatorsEventos() {
  return useQuery<IndicatorsEventosData>({
    queryKey: ["indicators-eventos"],
    queryFn: async () => {
      const [
        { data: eventsData, error: eventsError },
        { data: municipalitiesData, error: municipalitiesError },
        { data: nucleiData, error: nucleiError },
        { data: regionsData, error: regionsError },
        { data: processesData, error: processesError },
      ] = await Promise.all([
        supabase.from("events").select(`
          id,
          process_number,
          ano,
          nome,
          tipo,
          municipio_id,
          municipio_nome,
          nucleo_origem_id,
          nucleo_origem_texto,
          valor_concedente,
          valor_proponente,
          contrato_assinado,
          foi_pago,
          regiao_turistica,
          created_at
        `),
        supabase.from("municipalities").select("id, name, region_id, regional_nucleus_id"),
        supabase.from("regional_nuclei").select("id, acronym, name"),
        supabase.from("regioes").select("id, nome"),
        supabase.from("processes").select(`
          id,
          municipality_id,
          total_concedente_value,
          municipalities (id, name, region_id, regional_nucleus_id, regioes(nome))
        `),
      ]);

      if (eventsError) throw eventsError;
      if (municipalitiesError) throw municipalitiesError;
      if (nucleiError) throw nucleiError;
      if (regionsError) throw regionsError;
      if (processesError) throw processesError;

      const events = (eventsData ?? []) as EventRow[];
      const procs = (processesData ?? []) as ProcessRow[];
      const municipalities = (municipalitiesData ?? []) as MunicipalityRow[];
      const nuclei = (nucleiData ?? []) as RegionalNucleusRow[];
      const regions = (regionsData ?? []) as RegionRow[];

      const municipalityMap = new Map<number, { name: string; regionName: string }>();
      municipalities.forEach((municipality) => {
        const municipalityId = Number(municipality.id);
        if (!Number.isFinite(municipalityId)) return;
        municipalityMap.set(municipalityId, {
          name: normalizeText(municipality.name) || "Município não informado",
          regionName: "",
        });
      });

      const regionMap = new Map<number, string>();
      regions.forEach((region) => {
        const regionId = Number(region.id);
        if (Number.isFinite(regionId)) {
          regionMap.set(regionId, normalizeText(region.nome) || "Não definido");
        }
      });

      municipalities.forEach((municipality) => {
        const municipalityId = Number(municipality.id);
        if (!Number.isFinite(municipalityId)) return;
        const municipalityInfo = municipalityMap.get(municipalityId);
        if (!municipalityInfo) return;
        const regionId = Number(municipality.region_id);
        municipalityInfo.regionName = Number.isFinite(regionId) ? regionMap.get(regionId) || "Não definido" : "Não definido";
      });

      const nucleiMap = new Map<number, { acronym: string; name: string }>();
      nuclei.forEach((nucleus) => {
        const nucleusId = Number(nucleus.id);
        if (!Number.isFinite(nucleusId)) return;
        nucleiMap.set(nucleusId, {
          acronym: normalizeText(nucleus.acronym) || "N/D",
          name: normalizeText(nucleus.name) || "Não definido",
        });
      });

      const municipioIds = new Set<number>();
      let valorPublicado = 0;
      let valorContratado = 0;
      let valorPago = 0;

      events.forEach((event) => {
        const valor = toNumber(event.valor_concedente);
        valorPublicado += valor;
        const municipioId = Number(event.municipio_id);
        if (Number.isFinite(municipioId)) municipioIds.add(municipioId);
        if (normalizeContrato(event.contrato_assinado) === "sim") valorContratado += valor;
        if (normalizeBoolean(event.foi_pago)) valorPago += valor;
      });

      const visaoGeral: EventosVisaoGeral = {
        totalEventos: events.length,
        municipiosAtendidos: municipioIds.size,
        valorPublicado,
        valorContratado,
        valorPago,
        taxaPagamento: safePercent(valorPago, valorContratado),
      };

      const statusCounts = { sim: 0, nao: 0, arquivado: 0, nao_definido: 0 };
      const statusValores = { sim: 0, nao: 0, arquivado: 0, nao_definido: 0 };

      events.forEach((event) => {
        const status = normalizeContrato(event.contrato_assinado);
        statusCounts[status] += 1;
        statusValores[status] += toNumber(event.valor_concedente);
      });

      const totalStatus = events.length;
      const statusContratos: EventosStatusContratos = {
        assinados: statusCounts.sim,
        pendentes: statusCounts.nao,
        arquivados: statusCounts.arquivado,
        naoDefinido: statusCounts.nao_definido,
        valorAssinados: statusValores.sim,
        valorPendentes: statusValores.nao,
        valorArquivados: statusValores.arquivado,
        valorNaoDefinido: statusValores.nao_definido,
        percAssinados: safePercent(statusCounts.sim, totalStatus),
        percPendentes: safePercent(statusCounts.nao, totalStatus),
        percArquivados: safePercent(statusCounts.arquivado, totalStatus),
        percNaoDefinido: safePercent(statusCounts.nao_definido, totalStatus),
      };

      const yearMap = new Map<number, { assinados: number; pendentes: number; arquivados: number; naoDefinido: number; valorAssinado: number }>();
      const yearsFromData = new Set<number>();

      events.forEach((event) => {
        let year: number | null = Number(event.ano);
        if (!Number.isFinite(year) || year < 1900) {
          const createdAt = normalizeText(event.created_at);
          if (createdAt) {
            const createdDate = new Date(createdAt);
            if (!Number.isNaN(createdDate.getTime())) {
              year = createdDate.getFullYear();
            }
          }
        }

        if (!Number.isFinite(year)) return;
        yearsFromData.add(year);
        const current = yearMap.get(year) ?? { assinados: 0, pendentes: 0, arquivados: 0, naoDefinido: 0, valorAssinado: 0 };
        const status = normalizeContrato(event.contrato_assinado);
        const value = toNumber(event.valor_concedente);

        if (status === "sim") {
          current.assinados += 1;
          current.valorAssinado += value;
        } else if (status === "nao") {
          current.pendentes += 1;
        } else if (status === "arquivado") {
          current.arquivados += 1;
        } else {
          current.naoDefinido += 1;
        }

        yearMap.set(year, current);
      });

      const yearlyRange = Array.from({ length: 2026 - 2023 + 1 }, (_, index) => 2023 + index);
      const annualKeys = Array.from(new Set([...yearlyRange, ...Array.from(yearsFromData)])).sort((a, b) => a - b);
      const evolucaoAnual: EventosEvolucaoAno[] = annualKeys.map((year) => ({
        ano: year,
        assinados: yearMap.get(year)?.assinados ?? 0,
        pendentes: yearMap.get(year)?.pendentes ?? 0,
        arquivados: yearMap.get(year)?.arquivados ?? 0,
        naoDefinido: yearMap.get(year)?.naoDefinido ?? 0,
        valorAssinado: yearMap.get(year)?.valorAssinado ?? 0,
      }));

      const instrumentosMap = new Map<string, { quantidade: number; valor: number }>();
      events.forEach((event) => {
        const tipo = normalizeText(event.tipo) || "Não definido";
        const current = instrumentosMap.get(tipo) ?? { quantidade: 0, valor: 0 };
        current.quantidade += 1;
        current.valor += toNumber(event.valor_concedente);
        instrumentosMap.set(tipo, current);
      });

      const totalEventos = events.length;
      const totalValor = valorPublicado;
      const tiposInstrumento: EventosTipoInstrumento[] = Array.from(instrumentosMap.entries())
        .map(([tipo, item]) => ({
          tipo,
          quantidade: item.quantidade,
          valor: item.valor,
          percQuantidade: safePercent(item.quantidade, totalEventos),
          percValor: safePercent(item.valor, totalValor),
        }))
        .sort((a, b) => b.valor - a.valor || b.quantidade - a.quantidade);

      const regioesMap = new Map<string, { eventos: number; valor: number }>();
      events.forEach((event) => {
        const regiao = normalizeText(event.regiao_turistica) || "Não definido";
        const current = regioesMap.get(regiao) ?? { eventos: 0, valor: 0 };
        current.eventos += 1;
        current.valor += toNumber(event.valor_concedente);
        regioesMap.set(regiao, current);
      });

      const regioesTuristicas: EventosRegiaoTuristica[] = Array.from(regioesMap.entries())
        .map(([regiao, item]) => ({
          regiao,
          eventos: item.eventos,
          valorApoiado: item.valor,
          mediaPorEvento: item.eventos > 0 ? item.valor / item.eventos : 0,
        }))
        .sort((a, b) => b.valorApoiado - a.valorApoiado || b.eventos - a.eventos);

      const nucleosAggregated = new Map<string, { sigla: string; nome: string; eventos: number; valor: number }>();

      events.forEach((event) => {
        const nucleusId = Number(event.nucleo_origem_id);
        const nucleusText = normalizeText(event.nucleo_origem_texto);

        let key: string;
        let sigla = "N/D";
        let nome = "Não definido";

        if (Number.isFinite(nucleusId) && nucleiMap.has(nucleusId)) {
          const nucleusInfo = nucleiMap.get(nucleusId)!;
          key = String(nucleusId);
          sigla = nucleusInfo.acronym || "N/D";
          nome = nucleusInfo.name || "Não definido";
        } else if (nucleusText) {
          key = nucleusText;
          sigla = nucleusText;
          nome = nucleusText;
        } else {
          key = "sem-nucleo";
          sigla = "N/D";
          nome = "Não definido";
        }

        const current = nucleosAggregated.get(key) ?? { sigla, nome, eventos: 0, valor: 0 };
        current.eventos += 1;
        current.valor += toNumber(event.valor_concedente);
        current.sigla = current.sigla || sigla;
        current.nome = current.nome || nome;
        nucleosAggregated.set(key, current);
      });

      const nucleosRegionais: EventosNucleoRegional[] = Array.from(nucleosAggregated.values())
        .map((item) => ({
          sigla: item.sigla || "N/D",
          nome: item.nome || "Não definido",
          eventos: item.eventos,
          valor: item.valor,
        }))
        .sort((a, b) => b.eventos - a.eventos || b.valor - a.valor);

      const topMunicipiosMap = new Map<string, { municipio: string; regiao: string; eventos: number; valor: number }>();

      events.forEach((event) => {
        const municipioId = Number(event.municipio_id);
        const municipioNome = normalizeText(event.municipio_nome) || "Município não informado";
        const idKey = Number.isFinite(municipioId) ? String(municipioId) : `evento-${municipioNome}`;
        const existing = topMunicipiosMap.get(idKey) ?? {
          municipio: municipioNome,
          regiao: normalizeText(event.regiao_turistica) || "Não definido",
          eventos: 0,
          valor: 0,
        };

        existing.eventos += 1;
        existing.valor += toNumber(event.valor_concedente);

        if (Number.isFinite(municipioId)) {
          const municipalityInfo = municipalityMap.get(municipioId);
          if (municipalityInfo?.name) existing.municipio = municipalityInfo.name;
          existing.regiao = normalizeText(event.regiao_turistica) || municipalityInfo?.regionName || "Não definido";
        }

        topMunicipiosMap.set(idKey, existing);
      });

      const topMunicipios: EventosTopMunicipio[] = Array.from(topMunicipiosMap.values())
        .sort((a, b) => b.valor - a.valor || a.municipio.localeCompare(b.municipio))
        .slice(0, 15)
        .map((item, index) => ({
          posicao: index + 1,
          municipio: item.municipio || "Município não informado",
          regiao: item.regiao || "Não definido",
          eventos: item.eventos,
          valor: item.valor,
        }));

      const combinedMap = new Map<string, { municipio: string; regiao: string; obras: number; eventos: number; valorObras: number; valorEventos: number }>();

      procs.forEach((process) => {
        const municipalityId = Number(process.municipality_id);
        if (!Number.isFinite(municipalityId)) return;

        const current = combinedMap.get(String(municipalityId)) ?? {
          municipio: normalizeText(process.municipalities?.name) || "Município não informado",
          regiao: normalizeText(process.municipalities?.regioes?.nome) || "Não definido",
          obras: 0,
          eventos: 0,
          valorObras: 0,
          valorEventos: 0,
        };

        current.obras += 1;
        current.valorObras += toNumber(process.total_concedente_value);
        current.municipio = current.municipio || normalizeText(process.municipalities?.name) || "Município não informado";
        current.regiao = current.regiao || normalizeText(process.municipalities?.regioes?.nome) || "Não definido";
        combinedMap.set(String(municipalityId), current);
      });

      events.forEach((event) => {
        const municipalityId = Number(event.municipio_id);
        const municipalityName = normalizeText(event.municipio_nome) || "Município não informado";
        const key = Number.isFinite(municipalityId) ? String(municipalityId) : `evento-${municipalityName}`;
        const current = combinedMap.get(key) ?? {
          municipio: municipalityName,
          regiao: normalizeText(event.regiao_turistica) || "Não definido",
          obras: 0,
          eventos: 0,
          valorObras: 0,
          valorEventos: 0,
        };

        current.eventos += 1;
        current.valorEventos += toNumber(event.valor_concedente);
        if (Number.isFinite(municipalityId)) {
          const municipalityInfo = municipalityMap.get(municipalityId);
          if (municipalityInfo?.name) current.municipio = municipalityInfo.name;
          if (!current.regiao || current.regiao === "Não definido") {
            current.regiao = normalizeText(event.regiao_turistica) || municipalityInfo?.regionName || "Não definido";
          }
        }
        combinedMap.set(key, current);
      });

      const engajamento: EngajamentoMunicipio[] = Array.from(combinedMap.values())
        .map((item) => ({
          posicao: 0,
          municipio: item.municipio || "Município não informado",
          regiao: item.regiao || "Não definido",
          obras: item.obras,
          eventos: item.eventos,
          totalInteracoes: item.obras + item.eventos,
          valorTotal: item.valorObras + item.valorEventos,
        }))
        .filter((item) => item.totalInteracoes > 0)
        .sort((a, b) => {
          if (b.totalInteracoes !== a.totalInteracoes) return b.totalInteracoes - a.totalInteracoes;
          if (b.valorTotal !== a.valorTotal) return b.valorTotal - a.valorTotal;
          return a.municipio.localeCompare(b.municipio);
        })
        .slice(0, 15)
        .map((item, index) => ({ ...item, posicao: index + 1 }));

      return {
        visaoGeral,
        statusContratos,
        evolucaoAnual,
        tiposInstrumento,
        regioesTuristicas,
        nucleosRegionais,
        topMunicipios,
        engajamento,
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
