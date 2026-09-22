import { supabase } from '@/integrations/supabase/client';

// PARTE 2: KPIs obras, eventos, parcelas
export const transferQueries = {
  // KPIs de obras turísticas
  async getObrasKPIs() {
    const { data: totalObras } = await supabase
      .from('processes')
      .select('id', { count: 'exact' });
    
    const { data: totalValue } = await supabase
      .from('processes')
      .select('total_concedente_value');
    
    const totalConcedente = totalValue?.reduce((sum, p) => sum + (p.total_concedente_value || 0), 0) || 0;
    
    const { data: obrasPorStatus } = await supabase
      .from('processes')
      .select('status_id');
    
    const statusCounts = obrasPorStatus?.reduce((acc, p) => {
      acc[p.status_id] = (acc[p.status_id] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const { data: obrasPorMunicipio } = await supabase
      .from('processes')
      .select('municipality_id');
    
    const municipioCounts = obrasPorMunicipio?.reduce((acc, p) => {
      acc[p.municipality_id] = (acc[p.municipality_id] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return {
      totalObras: totalObras || 0,
      totalConcedente,
      statusCounts,
      municipioCounts,
    };
  },

  // KPIs de eventos turísticos
  async getEventosKPIs() {
    const { data: totalEventos } = await supabase
      .from('events')
      .select('id', { count: 'exact' });
    
    const { data: totalValue } = await supabase
      .from('events')
      .select('valor_concedente');
    
    const totalConcedente = totalValue?.reduce((sum, e) => sum + (e.valor_concedente || 0), 0) || 0;
    
    const { data: eventosPagos } = await supabase
      .from('events')
      .select('foi_pago', { count: 'exact' })
      .eq('foi_pago', true);
    
    const { data: eventosComContrato } = await supabase
      .from('events')
      .select('contrato_assinado', { count: 'exact' })
      .eq('contrato_assinado', 'assinado');
    
    return {
      totalEventos: totalEventos || 0,
      totalConcedente,
      eventosPagos: eventosPagos || 0,
      eventosComContrato: eventosComContrato || 0,
    };
  },

  // KPIs combinados (Todos)
  async getTodosKPIs() {
    const [obrasKPIs, eventosKPIs] = await Promise.all([
      this.getObrasKPIs(),
      this.getEventosKPIs(),
    ]);
    
    return {
      totalProcessos: obrasKPIs.totalObras + eventosKPIs.totalEventos,
      totalConcedente: obrasKPIs.totalConcedente + eventosKPIs.totalConcedente,
      obras: obrasKPIs,
      eventos: eventosKPIs,
    };
  },

  // Placeholder - implementações futuras
  getPlaceholder: async () => {
    return { data: null, error: null };
  }
};