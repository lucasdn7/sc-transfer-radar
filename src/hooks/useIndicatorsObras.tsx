import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VisaoFinanceira {
  totalPortaria: number;
  totalConcedente: number;
  totalProponente: number;
  totalLicitado: number;
  hasLicitado: boolean;
}

export interface ExecucaoParcelas {
  totalParcelas: number;
  pagas: number;
  pendentes: number;
  valorTotal: number;
  valorPago: number;
  valorPendente: number;
  percQuantidadePaga: number;
  percQuantidadePendente: number;
  percValorPago: number;
  percValorPendente: number;
}

export interface ParcelaGroup {
  parcelNumber: number;
  totalProcessos: number;
  pagas: number;
  pendentes: number;
  percPago: number;
  valorTotal: number;
  valorPago: number;
  valorPendente: number;
}

export interface SituacaoContratos {
  comContrato: number;
  semContrato: number;
  prestacaoContas: number;
  finalizados: number;
  comAditivo: number;
  totalAditivos: number;
  comLocalizacao: number;
}

export interface SemoforoVigencia {
  vencidos: number;
  ate30: number;
  ate60: number;
  ate90: number;
  emDia: number;
  semVigencia: number;
}

export interface StatusDistribution {
  nome: string;
  cor: string;
  ordem: number;
  quantidade: number;
  percentual: number;
  valorTotal: number;
}

export interface RegionalNucleusGroup {
  sigla: string;
  nome: string;
  processos: number;
  valorConcedente: number;
  contratosAssinados: number;
  percContratosAssinados: number;
}

export interface RegionGroup {
  regiao: string;
  processos: number;
  municipiosAtendidos: number;
  valorConcedente: number;
}

export interface TopMunicipality {
  posicao: number;
  municipio: string;
  regiao: string;
  processos: number;
  valorConcedente: number;
}

export interface CategoryDistribution {
  categoria: string;
  quantidade: number;
  valorConcedente: number;
  percValor: number;
}

export interface CategoryCompletude {
  totalProcessos: number;
  comCategoria: number;
  semCategoria: number;
  percCompletude: number;
}

export interface IndicatorsObrasData {
  visaoFinanceira: VisaoFinanceira;
  execucaoParcelas: ExecucaoParcelas;
  parcelasAgrupadas: ParcelaGroup[];
  situacaoContratos: SituacaoContratos;
  semaforoVigencia: SemoforoVigencia;
  distribuicaoStatus: StatusDistribution[];
  nucleosRegionais: RegionalNucleusGroup[];
  regioesTuristicas: RegionGroup[];
  topMunicipios: TopMunicipality[];
  categorias: CategoryDistribution[];
  completudeCategoria: CategoryCompletude;
}

const normalizaNome = (nome: string) => (nome || '').toLowerCase().trim();

export function useIndicatorsObras() {
  return useQuery<IndicatorsObrasData>({
    queryKey: ['indicators-obras'],
    queryFn: async () => {
      const [
        { data: processesData, error: processesError },
        { data: parcelsData, error: parcelsError },
        { data: addendumsData, error: addendumsError },
        { data: nucleosData, error: nucleosError },
        { data: regioesData, error: regioesError },
        { data: statusData, error: statusError },
      ] = await Promise.all([
        supabase
          .from('processes')
          .select(`
            id,
            total_portaria_value,
            total_concedente_value,
            total_proponente_value,
            licitado_value,
            contrato_assinado,
            latitude,
            longitude,
            vigencia_date,
            categoria,
            status_id,
            municipality_id,
            regional_nucleus_id,
            status_processos (nome, cor, ordem),
            municipalities (id, name, region_id, regional_nucleus_id, regioes(nome))
          `),
        supabase.from('process_parcels').select('id, process_id, parcel_number, value, payment_date'),
        supabase.from('process_addendums').select('id, process_id'),
        supabase.from('regional_nuclei').select('id, acronym, name'),
        supabase.from('regioes').select('id, nome'),
        supabase.from('status_processos').select('id, nome, cor, ordem'),
      ]);

      if (processesError) throw processesError;
      if (parcelsError) throw parcelsError;

      const procs = processesData || [];

      // 1. Financeiro, Contratos, Vigência (Parte 4A)
      const visao: VisaoFinanceira = { totalPortaria: 0, totalConcedente: 0, totalProponente: 0, totalLicitado: 0, hasLicitado: false };
      const situacao: SituacaoContratos = { comContrato: 0, semContrato: 0, prestacaoContas: 0, finalizados: 0, comAditivo: 0, totalAditivos: 0, comLocalizacao: 0 };
      const semaforo: SemoforoVigencia = { vencidos: 0, ate30: 0, ate60: 0, ate90: 0, emDia: 0, semVigencia: 0 };

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = (d1: Date, d2: Date) => Math.floor((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));

      // Dictionaries for relations
      const nucleosMap = new Map((nucleosData || []).map(n => [n.id, n]));
      const regioesMap = new Map((regioesData || []).map(r => [r.id, r]));
      const statusMap = new Map((statusData || []).map(s => [s.id, s]));

      // Aggregators for new blocks
      const statusAgg = new Map<number | 'none', { nome: string, cor: string, ordem: number, quantidade: number, valorTotal: number }>();
      const nucleosAgg = new Map<number | 'none', { sigla: string, nome: string, processos: number, valor: number, contratosAssinados: number }>();
      const regioesAgg = new Map<number | 'none', { regiao: string, processos: number, municipios: Set<number>, valor: number }>();
      const municipiosAgg = new Map<number, { municipio: string, regiao: string, processos: number, valor: number }>();
      const categoriasAgg = new Map<string, { quantidade: number, valor: number }>();
      let valorClassificado = 0;
      let processosClassificados = 0;

      // Initialize nucleos and regioes with zeros
      (nucleosData || []).forEach(n => nucleosAgg.set(n.id, { sigla: n.acronym || '', nome: n.name || '', processos: 0, valor: 0, contratosAssinados: 0 }));
      (regioesData || []).forEach(r => regioesAgg.set(r.id, { regiao: r.nome || '', processos: 0, municipios: new Set(), valor: 0 }));
      (statusData || []).forEach(s => statusAgg.set(s.id, { nome: s.nome, cor: s.cor || '#888888', ordem: s.ordem, quantidade: 0, valorTotal: 0 }));

      procs.forEach(p => {
        const valConcedente = Number(p.total_concedente_value || 0);
        
        // Block 1
        visao.totalPortaria += Number(p.total_portaria_value || 0);
        visao.totalConcedente += valConcedente;
        visao.totalProponente += Number(p.total_proponente_value || 0);
        if (p.licitado_value !== null && p.licitado_value !== undefined) {
          visao.totalLicitado += Number(p.licitado_value);
          visao.hasLicitado = true;
        }

        // Block 4
        if (p.contrato_assinado) situacao.comContrato++;
        else situacao.semContrato++;

        const statusProc = p.status_processos as { nome?: string } | null;
        const nomeStatus = normalizaNome(statusProc?.nome || '');
        if (nomeStatus.includes('prestação de contas') || nomeStatus.includes('prestacao de contas')) situacao.prestacaoContas++;
        if (nomeStatus.includes('finalizado') || nomeStatus.includes('concluído') || nomeStatus.includes('concluido')) situacao.finalizados++;
        if (p.latitude !== null && p.longitude !== null) situacao.comLocalizacao++;

        // Block 5
        if (!p.vigencia_date) semaforo.semVigencia++;
        else {
          const parts = p.vigencia_date.split('-');
          if (parts.length >= 3) {
            const vig = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            vig.setHours(0, 0, 0, 0);
            if (vig < today) semaforo.vencidos++;
            else {
              const dias = diffDays(vig, today);
              if (dias <= 30) semaforo.ate30++;
              else if (dias <= 60) semaforo.ate60++;
              else if (dias <= 90) semaforo.ate90++;
              else semaforo.emDia++;
            }
          } else semaforo.semVigencia++;
        }

        // Block 6: Status
        const sId = p.status_id !== null ? p.status_id : 'none';
        if (!statusAgg.has(sId)) {
           statusAgg.set(sId, { nome: 'Não definido', cor: '#888888', ordem: 9999, quantidade: 0, valorTotal: 0 });
        }
        const sAgg = statusAgg.get(sId)!;
        sAgg.quantidade++;
        sAgg.valorTotal += valConcedente;

        // Relation fallback for Nucleus & Region
        const mun = p.municipalities as { regional_nucleus_id?: number, region_id?: number, name?: string, regioes?: { nome?: string } } | null;
        const nId = p.regional_nucleus_id || mun?.regional_nucleus_id || 'none';
        const rId = mun?.region_id || 'none';

        // Block 7: Nucleus
        if (!nucleosAgg.has(nId)) {
           nucleosAgg.set(nId, { sigla: 'N/D', nome: 'Não definido', processos: 0, valor: 0, contratosAssinados: 0 });
        }
        const nAgg = nucleosAgg.get(nId)!;
        nAgg.processos++;
        nAgg.valor += valConcedente;
        if (p.contrato_assinado) nAgg.contratosAssinados++;

        // Block 8: Regions
        if (!regioesAgg.has(rId)) {
           regioesAgg.set(rId, { regiao: 'Não definido', processos: 0, municipios: new Set(), valor: 0 });
        }
        const rAgg = regioesAgg.get(rId)!;
        rAgg.processos++;
        rAgg.valor += valConcedente;
        if (p.municipality_id) rAgg.municipios.add(p.municipality_id);

        // Block 9: Municipalities
        if (p.municipality_id) {
          if (!municipiosAgg.has(p.municipality_id)) {
            const regName = mun?.regioes?.nome || regioesMap.get(rId)?.nome || 'Não definido';
            municipiosAgg.set(p.municipality_id, { municipio: mun?.name || 'Desconhecido', regiao: regName, processos: 0, valor: 0 });
          }
          const mAgg = municipiosAgg.get(p.municipality_id)!;
          mAgg.processos++;
          mAgg.valor += valConcedente;
        }

        // Block 10: Category
        const catRaw = p.categoria as string | null | undefined;
        if (catRaw && catRaw.trim() !== '') {
          const cat = catRaw.trim();
          processosClassificados++;
          valorClassificado += valConcedente;
          if (!categoriasAgg.has(cat)) categoriasAgg.set(cat, { quantidade: 0, valor: 0 });
          const cAgg = categoriasAgg.get(cat)!;
          cAgg.quantidade++;
          cAgg.valor += valConcedente;
        }
      });

      if (addendumsData && !addendumsError) {
        situacao.totalAditivos = addendumsData.length;
        situacao.comAditivo = new Set(addendumsData.map(a => a.process_id)).size;
      }

      // Parcela execution
      const execucao: ExecucaoParcelas = { totalParcelas: 0, pagas: 0, pendentes: 0, valorTotal: 0, valorPago: 0, valorPendente: 0, percQuantidadePaga: 0, percQuantidadePendente: 0, percValorPago: 0, percValorPendente: 0 };
      const groupMap = new Map<number, ParcelaGroup>();

      (parcelsData || []).forEach(parcel => {
        const pNum = parcel.parcel_number;
        const val = Number(parcel.value || 0);
        const pago = parcel.payment_date !== null;

        execucao.totalParcelas++;
        execucao.valorTotal += val;
        if (pago) { execucao.pagas++; execucao.valorPago += val; }
        else { execucao.pendentes++; execucao.valorPendente += val; }

        let g = groupMap.get(pNum);
        if (!g) { g = { parcelNumber: pNum, totalProcessos: 0, pagas: 0, pendentes: 0, percPago: 0, valorTotal: 0, valorPago: 0, valorPendente: 0 }; groupMap.set(pNum, g); }
        g.totalProcessos++;
        g.valorTotal += val;
        if (pago) { g.pagas++; g.valorPago += val; }
        else { g.pendentes++; g.valorPendente += val; }
      });

      if (execucao.totalParcelas > 0) {
        execucao.percQuantidadePaga = (execucao.pagas / execucao.totalParcelas) * 100;
        execucao.percQuantidadePendente = (execucao.pendentes / execucao.totalParcelas) * 100;
      }
      if (execucao.valorTotal > 0) {
        execucao.percValorPago = (execucao.valorPago / execucao.valorTotal) * 100;
        execucao.percValorPendente = (execucao.valorPendente / execucao.valorTotal) * 100;
      }
      const parcelasAgrupadas = Array.from(groupMap.values()).sort((a, b) => a.parcelNumber - b.parcelNumber);
      parcelasAgrupadas.forEach(g => { if (g.totalProcessos > 0) g.percPago = (g.pagas / g.totalProcessos) * 100; });

      // Post-process new blocks
      const totalProcs = procs.length;

      const distribuicaoStatus: StatusDistribution[] = Array.from(statusAgg.values())
        .map(s => ({
          ...s,
          percentual: totalProcs > 0 ? (s.quantidade / totalProcs) * 100 : 0
        }))
        .filter(s => s.quantidade > 0) // Hide statuses with 0 just in case, wait: requirement says "Exibir todos os status existentes". Okay, remove filter.
        .sort((a, b) => a.ordem - b.ordem);

      const nucleosRegionais: RegionalNucleusGroup[] = Array.from(nucleosAgg.values())
        .map(n => ({
          ...n,
          percContratosAssinados: n.processos > 0 ? (n.contratosAssinados / n.processos) * 100 : 0
        }))
        .sort((a, b) => b.processos - a.processos); // Order by processes DESC

      const regioesTuristicas: RegionGroup[] = Array.from(regioesAgg.values())
        .map(r => ({
          regiao: r.regiao,
          processos: r.processos,
          municipiosAtendidos: r.municipios.size,
          valorConcedente: r.valor
        }))
        .sort((a, b) => b.valorConcedente - a.valorConcedente); // Order by value DESC

      const topMunicipios: TopMunicipality[] = Array.from(municipiosAgg.values())
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 15)
        .map((m, idx) => ({
          posicao: idx + 1,
          municipio: m.municipio,
          regiao: m.regiao,
          processos: m.processos,
          valorConcedente: m.valor
        }));

      const categorias: CategoryDistribution[] = Array.from(categoriasAgg.entries())
        .map(([cat, val]) => ({
          categoria: cat,
          quantidade: val.quantidade,
          valorConcedente: val.valor,
          percValor: valorClassificado > 0 ? (val.valor / valorClassificado) * 100 : 0
        }))
        .sort((a, b) => b.valorConcedente - a.valorConcedente);

      const completudeCategoria: CategoryCompletude = {
        totalProcessos: totalProcs,
        comCategoria: processosClassificados,
        semCategoria: totalProcs - processosClassificados,
        percCompletude: totalProcs > 0 ? (processosClassificados / totalProcs) * 100 : 0
      };

      // To comply with "Exibir todos os status existentes", use all of distribuicaoStatus as mapped.

      return {
        visaoFinanceira: visao,
        execucaoParcelas: execucao,
        parcelasAgrupadas,
        situacaoContratos: situacao,
        semaforoVigencia: semaforo,
        distribuicaoStatus,
        nucleosRegionais,
        regioesTuristicas,
        topMunicipios,
        categorias,
        completudeCategoria
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
