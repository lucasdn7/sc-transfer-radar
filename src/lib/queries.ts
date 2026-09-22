import { supabase } from '@/integrations/supabase/client';

// PARTE 2 — Queries para Dashboard: KPIs + Alertas

// Query 1 — KPIs de obras (processes)
export async function getObrasKPIs() {
  const { data, error } = await supabase
    .from('processes')
    .select(`
      id,
      municipality_id,
      total_concedente_value,
      total_proponente_value,
      total_portaria_value,
      contrato_assinado,
      em_prestacao_contas
    `);

  if (error) throw error;

  const total_processos = data?.length || 0;
  const municipios = new Set(data?.map(p => p.municipality_id)).size;
  const valor_concedente = data?.reduce((sum, p) => sum + (p.total_concedente_value || 0), 0) || 0;
  const valor_contrapartida = data?.reduce((sum, p) => sum + (p.total_proponente_value || 0), 0) || 0;
  const valor_portaria = data?.reduce((sum, p) => sum + (p.total_portaria_value || 0), 0) || 0;
  const contratos_assinados = data?.filter(p => p.contrato_assinado === true).length || 0;
  const em_prestacao = data?.filter(p => p.em_prestacao_contas === true).length || 0;

  return {
    total_processos,
    municipios,
    valor_concedente,
    valor_contrapartida,
    valor_portaria,
    contratos_assinados,
    em_prestacao,
  };
}

// Query 2 — KPIs de parcelas (process_parcels)
export async function getParcelasKPIs() {
  const { data, error } = await supabase
    .from('process_parcels')
    .select(`
      id,
      value,
      payment_date
    `);

  if (error) throw error;

  const total_parcelas = data?.length || 0;
  const valor_total = data?.reduce((sum, p) => sum + (p.value || 0), 0) || 0;
  const valor_pago = data?.filter(p => p.payment_date !== null).reduce((sum, p) => sum + (p.value || 0), 0) || 0;
  const valor_pendente = valor_total - valor_pago;
  const parcelas_pagas = data?.filter(p => p.payment_date !== null).length || 0;
  const parcelas_pendentes = total_parcelas - parcelas_pagas;

  return {
    total_parcelas,
    valor_total,
    valor_pago,
    valor_pendente,
    parcelas_pagas,
    parcelas_pendentes,
  };
}

// Query 3 — KPIs de eventos (events)
export async function getEventosKPIs() {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      municipio_id,
      valor_concedente,
      contrato_assinado,
      foi_pago,
      em_prestacao_contas
    `);

  if (error) throw error;

  const total_eventos = data?.length || 0;
  const municipios = new Set(data?.map(e => e.municipio_id)).size;
  const valor_total = data?.reduce((sum, e) => sum + (e.valor_concedente || 0), 0) || 0;
  const valor_assinado = data?.filter(e => e.contrato_assinado === 'sim').reduce((sum, e) => sum + (e.valor_concedente || 0), 0) || 0;
  const valor_pago = data?.filter(e => e.foi_pago === true).reduce((sum, e) => sum + (e.valor_concedente || 0), 0) || 0;
  const assinados = data?.filter(e => e.contrato_assinado === 'sim').length || 0;
  const pendentes = data?.filter(e => e.contrato_assinado === 'não').length || 0;
  const arquivados = data?.filter(e => e.contrato_assinado === 'arquivado').length || 0;
  const em_prestacao = data?.filter(e => e.em_prestacao_contas === true).length || 0;

  return {
    total_eventos,
    municipios,
    valor_total,
    valor_assinado,
    valor_pago,
    assinados,
    pendentes,
    arquivados,
    em_prestacao,
  };
}

// Query 4 — Alertas de vigência (processes)
export async function getVigenciaAlerts() {
  const { data, error } = await supabase
    .from('processes')
    .select('vigencia_date');

  if (error) throw error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const vencidos = data?.filter(p => p.vigencia_date && new Date(p.vigencia_date) < today).length || 0;
  const vence_30d = data?.filter(p => {
    if (!p.vigencia_date) return false;
    const date = new Date(p.vigencia_date);
    const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 30;
  }).length || 0;
  const vence_60d = data?.filter(p => {
    if (!p.vigencia_date) return false;
    const date = new Date(p.vigencia_date);
    const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 31 && daysUntil <= 60;
  }).length || 0;
  const vence_90d = data?.filter(p => {
    if (!p.vigencia_date) return false;
    const date = new Date(p.vigencia_date);
    const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 61 && daysUntil <= 90;
  }).length || 0;
  const sem_vigencia = data?.filter(p => !p.vigencia_date).length || 0;
  const em_dia = data?.filter(p => {
    if (!p.vigencia_date) return false;
    const date = new Date(p.vigencia_date);
    const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 90;
  }).length || 0;

  return {
    vencidos,
    vence_30d,
    vence_60d,
    vence_90d,
    sem_vigencia,
    em_dia,
  };
}

// Query combinada para carregar todos os dados de uma vez
export async function getDashboardData() {
  const [obrasKPIs, parcelasKPIs, eventosKPIs, vigenciaAlerts] = await Promise.all([
    getObrasKPIs(),
    getParcelasKPIs(),
    getEventosKPIs(),
    getVigenciaAlerts(),
  ]);

  return {
    obras: obrasKPIs,
    parcelas: parcelasKPIs,
    eventos: eventosKPIs,
    alertas: vigenciaAlerts,
  };
}