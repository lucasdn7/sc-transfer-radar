import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useChartsData() {
  return useQuery({
    queryKey: ['charts-data-g1-g17'],
    queryFn: async () => {
      // 1. Fetch Processes with relations
      const { data: processesData, error: processesError } = await supabase
        .from('processes')
        .select(`
          id, process_number, created_at, vigencia_date, total_concedente_value, object, status_id, municipality_id, regional_nucleus_id,
          municipalities(name),
          regional_nuclei(name, region_id, regioes(nome)),
          status_processos(nome, ordem),
          process_parcels(parcel_number, value, payment_date)
        `);

      if (processesError) throw processesError;

      // 2. Fetch Events
      const { data: eventsData, error: eventsError } = await (supabase as any)
        .from('events')
        .select('*');

      if (eventsError) throw eventsError;

      // 3. Match events with municipalities/regions
      const eventMunicipalityIds = Array.from(new Set(
        eventsData.map((e: any) => e.municipio_id || e.municipality_id).filter(Boolean)
      ));
      const eventNucleusIds = Array.from(new Set(
        eventsData.map((e: any) => e.nucleo_origem_id || e.regional_nucleus_id).filter(Boolean)
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
      const totalEventos = events.reduce((acc: number, e: any) => acc + (Number(e.valor_concedente) || 0), 0);
      const g17Data = [
        { name: "Obras turísticas", value: totalObras, fill: "#3b82f6" },
        { name: "Eventos", value: totalEventos, fill: "#10b981" },
        { name: "Promoção turística", value: 0, fill: "#f59e0b" }
      ];

      // Status das obras (Todos) & G1 (Funil)
      const statusMap = new Map<string, { nome: string, count: number, ordem: number }>();
      processes.forEach(p => {
        const nome = p.status_processos?.nome || 'Não definido';
        const ordem = p.status_processos?.ordem || 999;
        if (!statusMap.has(nome)) statusMap.set(nome, { nome, count: 0, ordem });
        statusMap.get(nome)!.count++;
      });
      const g1Data = Array.from(statusMap.values())
        .sort((a, b) => a.ordem - b.ordem)
        .map(s => ({ name: s.nome, value: s.count }));

      // G2 & G3 (Parcelas)
      let parcelasPagas = 0;
      let parcelasPendentes = 0;
      const g3DataMap = new Map<number, { name: string, pago: number, pendente: number }>();

      processes.forEach(p => {
        (p.process_parcels || []).forEach((parcel: any) => {
          const isPago = !!parcel.payment_date;
          const val = Number(parcel.value) || 0;
          if (isPago) parcelasPagas += val;
          else parcelasPendentes += val;

          const num = parcel.parcel_number || 1;
          if (!g3DataMap.has(num)) g3DataMap.set(num, { name: `Parcela ${num}`, pago: 0, pendente: 0 });
          if (isPago) g3DataMap.get(num)!.pago += val;
          else g3DataMap.get(num)!.pendente += val;
        });
      });
      const g2Data = [
        { name: "Pago", value: parcelasPagas, fill: "#10b981" },
        { name: "Pendente", value: parcelasPendentes, fill: "#f59e0b" }
      ];
      const g3Data = Array.from(g3DataMap.values()).sort((a, b) => {
        const numA = parseInt(a.name.replace('Parcela ', ''));
        const numB = parseInt(b.name.replace('Parcela ', ''));
        return numA - numB;
      }).slice(0, 5);

      // G4 (Semáforo de vigências)
      let vencidos = 0, em7d = 0, em30d = 0, em90d = 0, emDia = 0, semVigencia = 0;
      const today = new Date();
      processes.forEach(p => {
        if (!p.vigencia_date) {
          semVigencia++;
          return;
        }
        const vigDate = new Date(p.vigencia_date);
        const diffTime = vigDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) vencidos++;
        else if (diffDays <= 7) em7d++;
        else if (diffDays <= 30) em30d++;
        else if (diffDays <= 90) em90d++;
        else emDia++;
      });
      const g4Data = [
        { name: "Vencidos", value: vencidos, fill: "#ef4444" },
        { name: "Em 7 dias", value: em7d, fill: "#f97316" },
        { name: "Em 30 dias", value: em30d, fill: "#eab308" },
        { name: "Em 90 dias", value: em90d, fill: "#3b82f6" },
        { name: "Em dia", value: emDia, fill: "#10b981" },
      ].filter(d => d.value > 0);

      // G5 (Região Turística - Obras)
      const regMap = new Map<string, number>();
      processes.forEach(p => {
        let regName = 'Não definido';
        try {
          const nuc = p.regional_nuclei as any;
          if (nuc && nuc.regioes && nuc.regioes.nome) {
            regName = nuc.regioes.nome;
          }
        } catch (e) {}
        
        regMap.set(regName, (regMap.get(regName) || 0) + (p.total_concedente_value || 0));
      });
      const g5Data = Array.from(regMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // G6 (Processos por núcleo - Obras)
      const nucObrasMap = new Map<string, number>();
      processes.forEach(p => {
        const name = p.regional_nuclei?.name || 'Não definido';
        nucObrasMap.set(name, (nucObrasMap.get(name) || 0) + 1);
      });
      const g6Data = Array.from(nucObrasMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // G7 (Top 15 municípios - Obras)
      const munObrasMap = new Map<string, number>();
      processes.forEach(p => {
        const name = p.municipalities?.name || 'Não definido';
        munObrasMap.set(name, (munObrasMap.get(name) || 0) + (p.total_concedente_value || 0));
      });
      const g7Data = Array.from(munObrasMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);

      // G8 (Evolução processos cadastrados - Obras)
      const monthMap = new Map<string, number>();
      processes.forEach(p => {
        if (!p.created_at) return;
        const d = new Date(p.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(key, (monthMap.get(key) || 0) + 1);
      });
      const g8Data = Array.from(monthMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name));

      // G9 (Categoria de obra)
      const catObraMap = new Map<string, number>();
      processes.forEach(p => {
        let cat = 'Outros';
        const obj = (p.object || '').toLowerCase();
        if (obj.includes('praça') || obj.includes('parque')) cat = 'Praças e Parques';
        else if (obj.includes('pavimentação') || obj.includes('rua') || obj.includes('asfalto')) cat = 'Pavimentação';
        else if (obj.includes('centro') || obj.includes('construção')) cat = 'Edificações';
        else if (obj.includes('revitalização')) cat = 'Revitalização';
        else if (obj.includes('mirante') || obj.includes('turístic')) cat = 'Infraestrutura Turística';
        
        catObraMap.set(cat, (catObraMap.get(cat) || 0) + 1);
      });
      const g9Data = Array.from(catObraMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // ---- EVENTS DATA PROCESSING ----
      const parsedEvents = events.map((e: any) => {
        let ano = e.ano ? Number(e.ano) : null;
        if (!ano && e.data_evento) ano = new Date(e.data_evento).getFullYear();
        if (!ano) ano = new Date().getFullYear();
        
        const valor = Number(e.valor_concedente) || 0;
        const nucId = e.nucleo_origem_id || e.regional_nucleus_id;
        const munId = e.municipio_id || e.municipality_id;
        
        const nucInfo = nucId ? nucMap.get(nucId) : null;
        let regName = 'Não definido';
        if (nucInfo && (nucInfo as any).regioes?.nome) regName = (nucInfo as any).regioes.nome;
        
        return {
          ...e,
          parsedAno: ano,
          parsedValor: valor,
          munName: munId ? munMap.get(munId) : (e.municipio_nome || 'Não definido'),
          regName: regName,
          status: e.status || (e.contrato_assinado === 'arquivado' ? 'Arquivado' : (e.foi_pago ? 'Pago' : 'Pendente'))
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
          semVigencia
        }
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}
