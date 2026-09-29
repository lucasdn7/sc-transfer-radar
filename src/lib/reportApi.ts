import { supabase } from '@/integrations/supabase/client';

export type ReportFormat = 'json' | 'csv' | 'xlsx' | 'pdf';

export interface ReportRequest {
  report_type: string;
  format?: ReportFormat;
  filters?: Record<string, unknown>;
  fields?: string[];
  sort?: { field?: string; direction?: 'asc' | 'desc' };
}

export interface ReportResult {
  report_id: string;
  report_type: string;
  format: ReportFormat;
  generated_at: string;
  row_count: number;
  fields: string[];
  filters_applied: Record<string, unknown>;
  summary: Record<string, unknown>;
  rows: Record<string, unknown>[];
}

export async function generateReport(request: ReportRequest): Promise<ReportResult> {
  const { data, error } = await supabase.functions.invoke('generate-report', {
    body: { ...request, format: 'json' },
  });
  if (error) throw new Error('Não foi possível gerar o relatório.');
  if (!data || typeof data !== 'object' || !Array.isArray(data.rows)) {
    throw new Error('A resposta do relatório está incompleta.');
  }
  return data as ReportResult;
}
