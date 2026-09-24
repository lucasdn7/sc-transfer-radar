import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type ParcelRow = { parcel_number: number; value: number; payment_date: string | null };

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
        .select('*');


      // 3. Match events with municipalities/regions
      const eventMunicipalityIds = Array.from(new Set(
        eventsData.map((e: EventRow) => e.municipio_id).filter((id): id is number => id !== null)
      ));
      const eventNucleusIds = Array.from(new Set(
        [] as number[]
      ));

      const [municipalitiesRes, nucleiRes] = await Promise.all([
        eventMunicipalityIds.length > 0 
          ? supabase.from('municipalities').select('id, name').in('id', eventMunicipalityIds)
          : Promise.resolve({ data: [] }),
        eventNucleusIds.length > 0
          ? supabase.from('regional_nuclei').select('id, name, region_id, regioes(nome)').in('id', eventNucleusIds)
          : Promise.resolve({ data: [] })
      ]);

      const munMap = new Map(municipalitiesRes.data?.map(m => [m.id, m.name]));
      const nucMap = new Map(nucleiRes.data?.map(n => [n.id, n]));

      // ---- PROCESS DATA PROCESSING (OBRAS) ----
      const processes = processesData || [];
      const events = eventsData || [];

      // G17 (Distribuição)
      const totalObras = processes.reduce((acc, p) => acc + (p.total_concedente_value || 0), 0);
      const totalEventos = events.reduce((acc: number, e: EventRow) => acc + (Number(e.valor_concedente) || 0), 0);
      const g17Data = [
        { name: "Obras turísticas", value: totalObras, fill: "#3b82f6" },
        { name: "Eventos", value: totalEventos, fill: "#10b981" },
        { name: "Promoção turística", value: 0, fill: "#f59e0b" }
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
      const parsedEvents = events.map((e: EventRow) => {
        const ano = e.data_evento ? new Date(e.data_evento).getFullYear() : new Date().getFullYear();
        
        const valor = Number(e.valor_concedente) || 0;
        const nucId = null;
        const munId = e.municipio_id;
        
        const nucInfo = nucId ? nucMap.get(nucId) : null;
        let regName = 'Não definido';
        if (nucInfo && typeof nucInfo === 'object' && 'regioes' in nucInfo) {
          const region = nucInfo.regioes as { nome?: string } | null;
          if (region?.nome) regName = region.nome;
        }
        
        return {
          ...e,
          parsedAno: ano,
          parsedValor: valor,
          munName: munId ? munMap.get(munId) : (e.municipio_nome || 'Não definido'),
          regName: regName,
          status: e.foi_pago ? 'Pago' : 'Pendente'
        };
      });

      // G10 (Eventos por ano e status)
      const evAnoStatusMap = new Map<string, { name: string, Pago: number, Pendente: number, Arquivado: number }>();
      parsedEvents.forEach(e => {
        const ano = String(e.parsedAno);
        if (!evAnoStatusMap.has(ano)) evAnoStatusMap.set(ano, { name: ano, Pago: 0, Pendente: 0, Arquivado: 0 });
        
        const s = e.status;
        if (s === 'Pago') evAnoStatusMap.get(ano)!.Pago++;
        else if (s === 'Pendente') evAnoStatusMap.get(ano)!.Pendente++;
        else evAnoStatusMap.get(ano)!.Arquivado++;
      });
      const g10Data = Array.from(evAnoStatusMap.values()).sort((a, b) => Number(a.name) - Number(b.name));

      // G11 (Valor contratado por ano - eventos)
      const evValorAnoMap = new Map<string, number>();
      parsedEvents.forEach(e => {
        const ano = String(e.parsedAno);
        evValorAnoMap.set(ano, (evValorAnoMap.get(ano) || 0) + e.parsedValor);
      });
      const g11Data = Array.from(evValorAnoMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => Number(a.name) - Number(b.name));

      // G12 (Por tipo de instrumento - eventos)
      const evTipoMap = new Map<string, number>();
      parsedEvents.forEach(e => {
        const tipo = e.tipo_repasse || e.tipo || e.categoria || 'Não definido';
        evTipoMap.set(tipo, (evTipoMap.get(tipo) || 0) + e.parsedValor);
      });
      const g12Data = Array.from(evTipoMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // G13 (Eventos por região turística)
      const evRegMap = new Map<string, number>();
      parsedEvents.forEach(e => {
        evRegMap.set(e.regName, (evRegMap.get(e.regName) || 0) + e.parsedValor);
      });
      const g13Data = Array.from(evRegMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // G15 (Top 15 municípios eventos)
      const evMunMap = new Map<string, number>();
      parsedEvents.forEach(e => {
        const mun = e.munName || 'Não definido';
        evMunMap.set(mun, (evMunMap.get(mun) || 0) + e.parsedValor);
      });
      const g15Data = Array.from(evMunMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);

      // G16 (Pagamento eventos)
      let evPago = 0, evNaoPago = 0;
      parsedEvents.forEach(e => {
        if (e.foi_pago) evPago += e.parsedValor;
        else evNaoPago += e.parsedValor;
      });
      const g16Data = [
        { name: "Pago", value: evPago, fill: "#10b981" },
        { name: "Pendente", value: evNaoPago, fill: "#f59e0b" }
      ];

      return {
        g17Data, g1Data, g2Data, g3Data, g4Data, g5Data, g6Data, g7Data, g8Data, g9Data,
        g10Data, g11Data, g12Data, g13Data, g15Data, g16Data,
        meta: {
          totalProcessos: processes.length,
          classificados: Array.from(catObraMap.values()).reduce((sum, value) => sum + value, 0),
          semCategoria: processes.length - Array.from(catObraMap.values()).reduce((sum, value) => sum + value, 0),
          completude: processes.length ? Array.from(catObraMap.values()).reduce((sum, value) => sum + value, 0) / processes.length * 100 : 0,
          semVigencia
        }
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}
