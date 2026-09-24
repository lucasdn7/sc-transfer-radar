import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type ParcelRow = { parcel_number: number; value: number; payment_date: string | null };

export interface CombinedRegionItem {
  name: string;
  obras: number;
  eventos: number;
  total: number;
  processos: number;
  eventosQuantidade: number;
  regionId: number | null;
}

export interface EngagementMunicipalityItem {
  municipalityId: number | null;
  municipality: string;
  region: string;
  obras: number;
  eventos: number;
  totalInteracoes: number;
  valorObras: number;
  valorEventos: number;
  valorTotal: number;
}

export function useChartsData() {
  return useQuery({
    queryKey: ['charts-data-g1-g17'],
    queryFn: async () => {
      // 1. Fetch Processes with relations
      const { data: processesData, error: processesError } = await supabase
        .from('processes')
        .select(`
          id, process_number, created_at, vigencia_date, total_concedente_value, status_id, municipality_id, regional_nucleus_id, categoria,
          municipalities(name, region_id, regioes(nome)),
          regional_nuclei(name, acronym, region_id, regioes(nome)),
          status_processos(nome, cor, ordem),
          process_parcels(parcel_number, value, payment_date)
        `);

      if (processesError) throw processesError;

      // 2. Fetch Events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, ano, contrato_assinado, municipio_id, municipio_nome, nucleo_origem_id, nucleo_origem_texto, valor_concedente, foi_pago, regiao_turistica, tipo, created_at');


      // 3. Match events with municipalities/regions
      const eventRows = eventsData || [];
      const eventMunicipalityIds = Array.from(new Set(
        eventRows.map((e: EventRow) => e.municipio_id).filter((id): id is number => id !== null)
      ));
      const eventNucleusIds = Array.from(new Set(
        eventRows.map((e: EventRow) => e.nucleo_origem_id).filter((id): id is number => id !== null)
      ));

      const [municipalitiesRes, nucleiRes, regionsRes] = await Promise.all([
        eventMunicipalityIds.length > 0 
          ? supabase.from('municipalities').select('id, name').in('id', eventMunicipalityIds)
          : Promise.resolve({ data: [] }),
        eventNucleusIds.length > 0
          ? supabase.from('regional_nuclei').select('id, name, region_id, regioes(nome)').in('id', eventNucleusIds)
          : Promise.resolve({ data: [] }),
        supabase.from('regioes').select('id, nome, sigla')
      ]);

      const munMap = new Map(municipalitiesRes.data?.map(m => [m.id, m.name]));
      const nucMap = new Map(nucleiRes.data?.map(n => [n.id, n]));
      const regionMapByName = new Map((regionsRes.data || []).map(region => [region.nome.trim().toLocaleLowerCase('pt-BR'), region]));

      // ---- PROCESS DATA PROCESSING (OBRAS) ----
      const processes = processesData || [];
      const events = eventRows;

      // G17 (Distribuição)
      const totalObras = processes.reduce((acc, p) => acc + (p.total_concedente_value || 0), 0);
      const totalEventos = events.reduce((acc: number, e: EventRow) => acc + (Number(e.valor_concedente) || 0), 0);
      const totalCombined = totalObras + totalEventos;
      const g17Data = [
        { name: "Obras turísticas", value: totalObras, fill: "#1D6FCC", percentage: totalCombined ? totalObras / totalCombined * 100 : 0 },
        { name: "Eventos", value: totalEventos, fill: "#0F6E56", percentage: totalCombined ? totalEventos / totalCombined * 100 : 0 },
        { name: "Promoção turística", value: 0, fill: "#7C3AED", percentage: 0 }
      ];

      // Status das obras (Todos) & G1 (Funil)
      const statusMap = new Map<string, { nome: string, count: number, value: number, ordem: number, cor: string }>();
      processes.forEach(p => {
        const nome = p.status_processos?.nome || 'Não definido';
        const ordem = p.status_processos?.ordem || 999;
        const cor = p.status_processos?.cor || '#888888';
        if (!statusMap.has(nome)) statusMap.set(nome, { nome, count: 0, value: 0, ordem, cor });
        const status = statusMap.get(nome)!;
        status.count++;
        status.value += Number(p.total_concedente_value) || 0;
      });
      const g1Data = Array.from(statusMap.values())
        .sort((a, b) => b.count - a.count || a.nome.localeCompare(b.nome, 'pt-BR'))
        .map(s => ({ name: s.nome, value: s.count, count: s.count, totalValue: s.value, percentage: processes.length ? (s.count / processes.length) * 100 : 0, fill: s.cor, order: s.ordem }));

      // G2 & G3 (Parcelas)
      let parcelasPagas = 0;
      let parcelasPendentes = 0;
      const g3DataMap = new Map<number, { name: string, pago: number, pendente: number, total: number, paidCount: number, pendingCount: number }>();

      processes.forEach(p => {
        (p.process_parcels || []).forEach((parcel: ParcelRow) => {
          const isPago = !!parcel.payment_date;
          const val = Number(parcel.value) || 0;
          if (isPago) parcelasPagas += val;
          else parcelasPendentes += val;

          const num = Number(parcel.parcel_number);
          if (!Number.isFinite(num)) return;
          if (!g3DataMap.has(num)) g3DataMap.set(num, { name: `${num}ª parcela`, pago: 0, pendente: 0, total: 0, paidCount: 0, pendingCount: 0 });
          const item = g3DataMap.get(num)!;
          item.total += val;
          if (isPago) { item.pago += val; item.paidCount++; }
          else { item.pendente += val; item.pendingCount++; }
        });
      });
      const g2Data = [
        { name: "Pago", value: parcelasPagas, fill: "#10b981" },
        { name: "Pendente", value: parcelasPendentes, fill: "#f59e0b" }
      ];
      const g3Data = Array.from(g3DataMap.entries()).sort(([numA], [numB]) => numA - numB).map(([, item]) => item);

      // G4 (Semáforo de vigências)
      let vencidos = 0, em30d = 0, em60d = 0, em90d = 0, emDia = 0, semVigencia = 0;
      const today = new Date();
      processes.forEach(p => {
        if (!p.vigencia_date) {
          semVigencia++;
          return;
        }
        const vigDate = new Date(`${p.vigencia_date}T00:00:00`);
        if (Number.isNaN(vigDate.getTime())) { semVigencia++; return; }
        const diffTime = vigDate.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) vencidos++;
        else if (diffDays <= 30) em30d++;
        else if (diffDays <= 60) em60d++;
        else if (diffDays <= 90) em90d++;
        else emDia++;
      });
      const g4Data = [
        { name: "Vencido", value: vencidos, fill: "#C0392B" },
        { name: "Até 30 dias", value: em30d, fill: "#E67E22" },
        { name: "31–60 dias", value: em60d, fill: "#C9903A" },
        { name: "61–90 dias", value: em90d, fill: "#E5B83D" },
        { name: "Em dia", value: emDia, fill: "#10b981" },
        { name: "Sem vigência", value: semVigencia, fill: "#888888" },
      ];

      // G5 (Região Turística - Obras)
      const regMap = new Map<string, { value: number, processCount: number, municipalities: Set<string> }>();
      processes.forEach(p => {
        let regName = 'Não definido';
        const municipality = p.municipalities as { name?: string; regioes?: { nome?: string } } | null;
        if (municipality?.regioes?.nome) regName = municipality.regioes.nome;
        const current = regMap.get(regName) || { value: 0, processCount: 0, municipalities: new Set<string>() };
        current.value += Number(p.total_concedente_value) || 0;
        current.processCount++;
        if (municipality?.name) current.municipalities.add(municipality.name);
        regMap.set(regName, current);
      });
      const g5Data = Array.from(regMap.entries())
        .map(([name, item]) => ({ name, value: item.value, processCount: item.processCount, municipalityCount: item.municipalities.size }))
        .sort((a, b) => b.value - a.value);

      // G6 (Processos por núcleo - Obras)
      const nucObrasMap = new Map<string, { value: number, count: number, acronym: string }>();
      processes.forEach(p => {
        const name = p.regional_nuclei?.name || 'Não definido';
        const current = nucObrasMap.get(name) || { value: 0, count: 0, acronym: p.regional_nuclei?.acronym || 'Não definido' };
        current.value += Number(p.total_concedente_value) || 0;
        current.count++;
        nucObrasMap.set(name, current);
      });
      const g6Data = Array.from(nucObrasMap.entries())
        .map(([name, item]) => ({ name, value: item.count, count: item.count, totalValue: item.value, acronym: item.acronym }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));

      // G7 (Top 15 municípios - Obras)
      const munObrasMap = new Map<string, { value: number, processCount: number, region: string }>();
      processes.forEach(p => {
        const name = p.municipalities?.name || 'Não definido';
        const region = p.municipalities?.regioes?.nome || 'Não definido';
        const current = munObrasMap.get(name) || { value: 0, processCount: 0, region };
        current.value += Number(p.total_concedente_value) || 0;
        current.processCount++;
        munObrasMap.set(name, current);
      });
      const g7Data = Array.from(munObrasMap.entries())
        .map(([name, item]) => ({ name, value: item.value, processCount: item.processCount, region: item.region }))
        .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'pt-BR'))
        .slice(0, 10)
        .map((item, index) => ({ ...item, rank: index + 1 }));

      // G8 (Evolução processos cadastrados - Obras)
      const monthMap = new Map<string, number>();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 12, 1);
      for (let index = 0; index < 13; index++) {
        const month = new Date(monthStart.getFullYear(), monthStart.getMonth() + index, 1);
        monthMap.set(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`, 0);
      }
      processes.forEach(p => {
        if (!p.created_at) return;
        const d = new Date(p.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(key, (monthMap.get(key) || 0) + 1);
      });
      const g8Data = Array.from(monthMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name));

      // G9 usa a coluna real processes.categoria; object não é uma fonte de classificação.
      const catObraMap = new Map<string, number>();
      processes.forEach(p => {
        const cat = (p.categoria || '').trim();
        if (!cat) return;
        catObraMap.set(cat, (catObraMap.get(cat) || 0) + 1);
      });
      const g9Data = Array.from(catObraMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // ---- EVENTS DATA PROCESSING ----
      const normalizeText = (value: string | null | undefined) => value?.trim() || "Não definido";
      const normalizeContract = (value: string | null | undefined) => {
        const normalized = normalizeText(value).toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (normalized === "sim") return "Assinados";
        if (normalized === "nao") return "Pendentes";
        if (normalized === "arquivado") return "Arquivados";
        return "Não definido";
      };
      const parseYear = (event: EventRow) => {
        const year = Number(event.ano);
        if (Number.isInteger(year) && year > 0) return year;
        const fallback = event.created_at ? new Date(event.created_at).getFullYear() : NaN;
        return Number.isInteger(fallback) && fallback > 0 ? fallback : null;
      };
      const parsedEvents = events.map(event => ({
        ...event,
        parsedYear: parseYear(event),
        parsedValue: Number.isFinite(Number(event.valor_concedente)) ? Number(event.valor_concedente) : 0,
        contractStatus: normalizeContract(event.contrato_assinado),
        municipalityName: event.municipio_id ? munMap.get(event.municipio_id) || normalizeText(event.municipio_nome) : normalizeText(event.municipio_nome),
        municipalityKey: event.municipio_id ? `id:${event.municipio_id}` : `name:${normalizeText(event.municipio_nome)}`,
        regionName: normalizeText(event.regiao_turistica),
        nucleusName: event.nucleo_origem_id ? nucMap.get(event.nucleo_origem_id)?.name || normalizeText(event.nucleo_origem_texto) : normalizeText(event.nucleo_origem_texto),
        nucleusAcronym: event.nucleo_origem_id ? nucMap.get(event.nucleo_origem_id)?.acronym || "Não definido" : "Não definido",
      }));

      const evAnoStatusMap = new Map<string, { name: string; Assinados: number; Pendentes: number; Arquivados: number; NaoDefinidos: number; total: number }>();
      parsedEvents.forEach(event => {
        const name = event.parsedYear ? String(event.parsedYear) : "Não definido";
        const item = evAnoStatusMap.get(name) || { name, Assinados: 0, Pendentes: 0, Arquivados: 0, NaoDefinidos: 0, total: 0 };
        item[event.contractStatus === "Assinados" ? "Assinados" : event.contractStatus === "Pendentes" ? "Pendentes" : event.contractStatus === "Arquivados" ? "Arquivados" : "NaoDefinidos"] += 1;
        item.total += 1;
        evAnoStatusMap.set(name, item);
      });
      const g10Data = Array.from(evAnoStatusMap.values()).sort((a, b) => (Number(a.name) || Number.MAX_SAFE_INTEGER) - (Number(b.name) || Number.MAX_SAFE_INTEGER));

      const evValorAnoMap = new Map<number, { value: number; count: number }>();
      parsedEvents.forEach(event => {
        if (event.contractStatus !== "Assinados" || !event.parsedYear) return;
        const item = evValorAnoMap.get(event.parsedYear) || { value: 0, count: 0 };
        item.value += event.parsedValue;
        item.count += 1;
        evValorAnoMap.set(event.parsedYear, item);
      });
      let accumulatedValue = 0;
      const g11Data = Array.from(evValorAnoMap.entries()).sort(([yearA], [yearB]) => yearA - yearB).map(([year, item]) => {
        accumulatedValue += item.value;
        return { name: String(year), value: item.value, acumulado: accumulatedValue, quantidadeAssinada: item.count };
      });

      const evTipoMap = new Map<string, { value: number; count: number }>();
      parsedEvents.forEach(event => { const name = normalizeText(event.tipo); const item = evTipoMap.get(name) || { value: 0, count: 0 }; item.value += event.parsedValue; item.count += 1; evTipoMap.set(name, item); });
      const totalInstrumentEvents = parsedEvents.length;
      const totalInstrumentValue = Array.from(evTipoMap.values()).reduce((sum, item) => sum + item.value, 0);
      const g12Data = Array.from(evTipoMap.entries()).map(([name, item]) => ({ name, value: item.value, quantidade: item.count, percentualQuantidade: totalInstrumentEvents ? item.count / totalInstrumentEvents * 100 : 0, percentualValor: totalInstrumentValue ? item.value / totalInstrumentValue * 100 : 0 })).sort((a, b) => b.value - a.value || b.quantidade - a.quantidade);

      const evRegMap = new Map<string, { value: number; count: number }>();
      parsedEvents.forEach(event => { const item = evRegMap.get(event.regionName) || { value: 0, count: 0 }; item.value += event.parsedValue; item.count += 1; evRegMap.set(event.regionName, item); });
      const g13Data = Array.from(evRegMap.entries()).map(([name, item]) => ({ name, value: item.value, quantidade: item.count, media: item.count ? item.value / item.count : 0 })).sort((a, b) => b.value - a.value || b.quantidade - a.quantidade || a.name.localeCompare(b.name, "pt-BR"));

      const evNucleusMap = new Map<string, { name: string; acronym: string; value: number; count: number }>();
      parsedEvents.forEach(event => { const key = event.nucleo_origem_id ? `id:${event.nucleo_origem_id}` : `text:${event.nucleusName}`; const item = evNucleusMap.get(key) || { name: event.nucleusName, acronym: event.nucleusAcronym, value: 0, count: 0 }; item.value += event.parsedValue; item.count += 1; evNucleusMap.set(key, item); });
      const g14Data = Array.from(evNucleusMap.values()).map(item => ({ name: item.name, acronym: item.acronym, value: item.value, quantidade: item.count })).sort((a, b) => b.quantidade - a.quantidade || b.value - a.value || a.name.localeCompare(b.name, "pt-BR"));

      const evMunMap = new Map<string, { name: string; region: string; value: number; count: number }>();
      parsedEvents.forEach(event => { const item = evMunMap.get(event.municipalityKey) || { name: event.municipalityName, region: event.regionName, value: 0, count: 0 }; item.value += event.parsedValue; item.count += 1; evMunMap.set(event.municipalityKey, item); });
      const g15Data = Array.from(evMunMap.values()).sort((a, b) => b.value - a.value || b.count - a.count || a.name.localeCompare(b.name, "pt-BR")).slice(0, 10).map((item, index) => ({ name: item.name, region: item.region, value: item.value, quantidade: item.count, rank: index + 1 }));

      const paidEvents = parsedEvents.filter(event => event.foi_pago === true);
      const pendingEvents = parsedEvents.filter(event => event.foi_pago !== true);
      const paidValue = paidEvents.reduce((sum, event) => sum + event.parsedValue, 0);
      const pendingValue = pendingEvents.reduce((sum, event) => sum + event.parsedValue, 0);
      const paymentTotal = paidValue + pendingValue;
      const g16Data = [{ name: "Pago", value: paidValue, fill: "#1A7340", quantidade: paidEvents.length, percentage: paymentTotal ? paidValue / paymentTotal * 100 : 0 }, { name: "Pendente", value: pendingValue, fill: "#C9903A", quantidade: pendingEvents.length, percentage: paymentTotal ? pendingValue / paymentTotal * 100 : 0 }];

      const combinedRegionMap = new Map<string, CombinedRegionItem>();
      (regionsRes.data || []).forEach(region => combinedRegionMap.set(region.nome.trim(), { name: region.nome.trim(), obras: 0, eventos: 0, total: 0, processos: 0, eventosQuantidade: 0, regionId: region.id }));
      processes.forEach(process => {
        const municipality = process.municipalities as { regioes?: { nome?: string } } | null;
        const name = normalizeText(municipality?.regioes?.nome);
        const region = combinedRegionMap.get(name) || { name, obras: 0, eventos: 0, total: 0, processos: 0, eventosQuantidade: 0, regionId: regionMapByName.get(name.toLocaleLowerCase('pt-BR'))?.id || null };
        region.obras += Number(process.total_concedente_value) || 0;
        region.processos += 1;
        region.total = region.obras + region.eventos;
        combinedRegionMap.set(name, region);
      });
      parsedEvents.forEach(event => {
        const name = event.regionName;
        const region = combinedRegionMap.get(name) || { name, obras: 0, eventos: 0, total: 0, processos: 0, eventosQuantidade: 0, regionId: regionMapByName.get(name.toLocaleLowerCase('pt-BR'))?.id || null };
        region.eventos += event.parsedValue;
        region.eventosQuantidade += 1;
        region.total = region.obras + region.eventos;
        combinedRegionMap.set(name, region);
      });
      const g18Data = Array.from(combinedRegionMap.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'pt-BR'));

      const combinedMunicipalityMap = new Map<string, EngagementMunicipalityItem>();
      processes.forEach(process => {
        const municipality = process.municipalities as { name?: string; regioes?: { nome?: string } } | null;
        const key = `id:${process.municipality_id}`;
        const current = combinedMunicipalityMap.get(key) || { municipalityId: process.municipality_id, municipality: municipality?.name?.trim() || 'Não definido', region: normalizeText(municipality?.regioes?.nome), obras: 0, eventos: 0, totalInteracoes: 0, valorObras: 0, valorEventos: 0, valorTotal: 0 };
        current.obras += 1;
        current.valorObras += Number(process.total_concedente_value) || 0;
        current.totalInteracoes = current.obras + current.eventos;
        current.valorTotal = current.valorObras + current.valorEventos;
        combinedMunicipalityMap.set(key, current);
      });
      parsedEvents.forEach(event => {
        const key = event.municipalityKey;
        const current = combinedMunicipalityMap.get(key) || { municipalityId: event.municipio_id, municipality: event.municipalityName, region: event.regionName, obras: 0, eventos: 0, totalInteracoes: 0, valorObras: 0, valorEventos: 0, valorTotal: 0 };
        current.eventos += 1;
        current.valorEventos += event.parsedValue;
        if (current.region === 'Não definido' && event.regionName !== 'Não definido') current.region = event.regionName;
        current.totalInteracoes = current.obras + current.eventos;
        current.valorTotal = current.valorObras + current.valorEventos;
        combinedMunicipalityMap.set(key, current);
      });
      const g19Data = Array.from(combinedMunicipalityMap.values()).sort((a, b) => b.totalInteracoes - a.totalInteracoes || b.valorTotal - a.valorTotal || a.municipality.localeCompare(b.municipality, 'pt-BR'));
      const g20Data = g18Data;

      return {
        g17Data, g1Data, g2Data, g3Data, g4Data, g5Data, g6Data, g7Data, g8Data, g9Data,
        g10Data, g11Data, g12Data, g13Data, g14Data, g15Data, g16Data,
        g18Data, g19Data, g20Data,
        meta: {
          totalProcessos: processes.length,
          classificados: Array.from(catObraMap.values()).reduce((sum, value) => sum + value, 0),
          semCategoria: processes.length - Array.from(catObraMap.values()).reduce((sum, value) => sum + value, 0),
          completude: processes.length ? Array.from(catObraMap.values()).reduce((sum, value) => sum + value, 0) / processes.length * 100 : 0,
          semVigencia,
          eventError: eventsError?.message,
          totalObras,
          totalEventos,
          totalPromocao: 0,
          totalCombinado: totalCombined
        }
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}
