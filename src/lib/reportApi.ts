import { supabase } from '@/integrations/supabase/client';

export type ReportType =
  | 'executive'
  | 'processes'
  | 'financial'
  | 'expiring'
  | 'municipality'
  | 'custom';

export type ReportFormat = 'json' | 'csv' | 'xlsx' | 'pdf';

export type ReportField =
  | 'process_number'
  | 'object'
  | 'category'
  | 'municipality'
  | 'region'
  | 'regional_nucleus'
  | 'status'
  | 'contract_signed'
  | 'portaria_number'
  | 'total_portaria_value'
  | 'total_concedente_value'
  | 'total_proponente_value'
  | 'licitado_value'
  | 'total_paid'
  | 'balance'
  | 'parcel_count'
  | 'paid_parcel_count'
  | 'created_at'
  | 'vigencia_date'
  | 'vigencia_status'
  | 'last_tramitacao';

export const REPORT_FIELD_LABELS: Record<ReportField, string> = {
  process_number: 'Número do processo',
  object: 'Objeto',
  category: 'Tipo',
  municipality: 'Município',
  region: 'Região',
  regional_nucleus: 'Núcleo regional',
  status: 'Status',
  contract_signed: 'Contrato assinado',
  portaria_number: 'Número da portaria',
  total_portaria_value: 'Valor total da portaria',
  total_concedente_value: 'Valor do concedente',
  total_proponente_value: 'Valor do proponente',
  licitado_value: 'Valor licitado',
  total_paid: 'Total pago',
  balance: 'Saldo a repassar',
  parcel_count: 'Quantidade de parcelas',
  paid_parcel_count: 'Parcelas pagas',
  created_at: 'Data de criação',
  vigencia_date: 'Data de vigência',
  vigencia_status: 'Situação da vigência',
  last_tramitacao: 'Última tramitação',
};

export type VigenciaFilter =
  | 'all'
  | 'vencidos'
  | 'ate_7_dias'
  | 'ate_30_dias'
  | 'ate_60_dias'
  | 'ate_90_dias'
  | 'sem_prazo'
  | 'concluidas';

export interface ReportFilters {
  municipality_ids?: number[];
  regional_nucleus_id?: number;
  region_name?: string;
  status_names?: string[];
  date_from?: string;
  date_to?: string;
  vigencia?: VigenciaFilter;
  signed_contract_only?: boolean;
  min_proponent_value?: number;
}

export interface ReportRequest {
  report_type: ReportType;
  format?: ReportFormat;
  filters?: ReportFilters;
  fields?: ReportField[];
  sort?: { field?: ReportField; direction?: 'asc' | 'desc' };
}

export interface ReportSummary {
  process_count?: number;
  municipality_count?: number;
  regional_nucleus_count?: number;
  total_portaria_value?: number;
  total_concedente_value?: number;
  total_proponente_value?: number;
  total_paid?: number;
  balance?: number;
  expired_count?: number;
  expiring_30_days_count?: number;
  by_status?: Record<string, number>;
}

export interface ReportResult {
  report_id: string;
  report_type: ReportType;
  format: ReportFormat;
  generated_at: string;
  row_count: number;
  fields: ReportField[];
  filters_applied: ReportFilters;
  summary: ReportSummary;
  rows: Record<string, unknown>[];
}

function omitEmptyFilters(filters: ReportFilters = {}): ReportFilters {
  const result: ReportFilters = {};

  if (filters.municipality_ids?.length) {
    result.municipality_ids = filters.municipality_ids.filter((id) => Number.isInteger(id) && id > 0);
  }
  if (filters.regional_nucleus_id && filters.regional_nucleus_id > 0) {
    result.regional_nucleus_id = filters.regional_nucleus_id;
  }
  if (filters.region_name) result.region_name = filters.region_name;
  if (filters.status_names?.length) result.status_names = filters.status_names.filter(Boolean);
  if (filters.date_from) result.date_from = filters.date_from;
  if (filters.date_to) result.date_to = filters.date_to;
  if (filters.vigencia && filters.vigencia !== 'all') result.vigencia = filters.vigencia;
  if (filters.signed_contract_only) result.signed_contract_only = true;
  if (filters.min_proponent_value !== undefined && Number.isFinite(filters.min_proponent_value)) {
    result.min_proponent_value = Math.max(0, filters.min_proponent_value);
  }

  return result;
}

export function sanitizeReportRequest(request: ReportRequest): ReportRequest {
  return {
    report_type: request.report_type,
    format: 'json',
    filters: omitEmptyFilters(request.filters),
    fields: request.fields?.filter((field) => field in REPORT_FIELD_LABELS),
    sort: request.sort?.field
      ? { field: request.sort.field, direction: request.sort.direction ?? 'desc' }
      : undefined,
  };
}

export async function generateReport(request: ReportRequest): Promise<ReportResult> {
  const { data, error } = await supabase.functions.invoke('generate-report', {
    body: sanitizeReportRequest(request),
  });

  if (error) throw new Error('Não foi possível gerar o relatório.');
  if (!data || typeof data !== 'object' || !Array.isArray(data.rows)) {
    throw new Error('A resposta do relatório está incompleta.');
  }

  return data as ReportResult;
}