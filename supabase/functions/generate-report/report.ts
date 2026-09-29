export const MAX_BODY_BYTES = 64 * 1024;
export const MAX_ROWS = 2000;
export const MAX_FIELDS = 24;

export const REPORT_TYPES = [
  "executive",
  "processes",
  "financial",
  "expiring",
  "municipality",
  "custom",
] as const;
export type ReportType = typeof REPORT_TYPES[number];
export type ReportFormat = "json" | "csv" | "xlsx" | "pdf";

export const FIELD_LABELS = {
  process_number: "Número do processo",
  object: "Objeto",
  category: "Tipo",
  municipality: "Município",
  region: "Região",
  regional_nucleus: "Núcleo regional",
  status: "Status",
  contract_signed: "Contrato assinado",
  portaria_number: "Número da portaria",
  total_portaria_value: "Valor total da portaria",
  total_concedente_value: "Valor do concedente",
  total_proponente_value: "Valor do proponente",
  licitado_value: "Valor licitado",
  total_paid: "Total pago",
  balance: "Saldo a repassar",
  parcel_count: "Quantidade de parcelas",
  paid_parcel_count: "Parcelas pagas",
  created_at: "Data de criação",
  vigencia_date: "Data de vigência",
  vigencia_status: "Situação da vigência",
  last_tramitacao: "Última tramitação",
} as const;
export type ReportField = keyof typeof FIELD_LABELS;

export const DEFAULT_FIELDS: Record<ReportType, ReportField[]> = {
  executive: ["status", "total_portaria_value", "total_paid", "balance"],
  processes: ["process_number", "object", "municipality", "status", "total_portaria_value", "vigencia_date"],
  financial: ["process_number", "municipality", "total_concedente_value", "total_paid", "balance"],
  expiring: ["process_number", "object", "municipality", "vigencia_date", "vigencia_status"],
  municipality: ["process_number", "object", "status", "total_portaria_value", "total_paid", "balance"],
  custom: ["process_number", "object", "municipality", "status", "total_portaria_value"],
};

export type ReportFilters = {
  municipality_ids?: number[];
  regional_nucleus_id?: number;
  region_id?: number;
  region_name?: string;
  status_ids?: number[];
  status_names?: string[];
  category?: string;
  date_from?: string;
  date_to?: string;
  vigencia?: "all" | "vencidos" | "ate_7_dias" | "ate_30_dias" | "ate_60_dias" | "ate_90_dias" | "sem_prazo" | "concluidas";
  signed_contract_only?: boolean;
  min_proponent_value?: number;
};

export type GenerateReportRequest = {
  report_type: ReportType;
  format?: ReportFormat;
  filters?: ReportFilters;
  fields?: string[];
  sort?: { field?: string; direction?: "asc" | "desc" };
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && value.length <= 30 && !Number.isNaN(Date.parse(value));
}

function validPositiveIds(value: unknown): value is number[] {
  return Array.isArray(value) && value.length <= 100 && value.every((item) => Number.isInteger(item) && item > 0);
}

export function parseRequestBody(raw: string): GenerateReportRequest | { status: number } {
  if (raw.length > MAX_BODY_BYTES) return { status: 413 };
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return { status: 400 }; }
  if (!isRecord(value)) return { status: 400 };
  const allowed = new Set(["report_type", "format", "filters", "fields", "sort"]);
  if (Object.keys(value).some((key) => !allowed.has(key))) return { status: 400 };
  if (typeof value.report_type !== "string" || !REPORT_TYPES.includes(value.report_type as ReportType)) return { status: 400 };
  if (value.format !== undefined && !["json", "csv", "xlsx", "pdf"].includes(String(value.format))) return { status: 400 };

  const filters = value.filters === undefined ? {} : value.filters;
  if (!isRecord(filters)) return { status: 400 };
  const allowedFilters = new Set(["municipality_ids", "regional_nucleus_id", "region_id", "region_name", "status_ids", "status_names", "category", "date_from", "date_to", "vigencia", "signed_contract_only", "min_proponent_value"]);
  if (Object.keys(filters).some((key) => !allowedFilters.has(key))) return { status: 400 };
  if (filters.municipality_ids !== undefined && !validPositiveIds(filters.municipality_ids)) return { status: 400 };
  if (filters.status_ids !== undefined && !validPositiveIds(filters.status_ids)) return { status: 400 };
  if (filters.status_names !== undefined && (!Array.isArray(filters.status_names) || filters.status_names.length > 20 || filters.status_names.some((item) => typeof item !== "string" || item.length > 100))) return { status: 400 };
  for (const key of ["regional_nucleus_id", "region_id"] as const) {
    if (filters[key] !== undefined && (!Number.isInteger(filters[key]) || Number(filters[key]) <= 0)) return { status: 400 };
  }
  if (filters.category !== undefined && (typeof filters.category !== "string" || filters.category.length > 80)) return { status: 400 };
  if (filters.region_name !== undefined && (typeof filters.region_name !== "string" || filters.region_name.length > 100)) return { status: 400 };
  if (filters.date_from !== undefined && !validDate(filters.date_from)) return { status: 400 };
  if (filters.date_to !== undefined && !validDate(filters.date_to)) return { status: 400 };
  if (filters.vigencia !== undefined && !["all", "vencidos", "ate_7_dias", "ate_30_dias", "ate_60_dias", "ate_90_dias", "sem_prazo", "concluidas"].includes(String(filters.vigencia))) return { status: 400 };
  if (filters.signed_contract_only !== undefined && typeof filters.signed_contract_only !== "boolean") return { status: 400 };
  if (filters.min_proponent_value !== undefined && (typeof filters.min_proponent_value !== "number" || !Number.isFinite(filters.min_proponent_value) || filters.min_proponent_value < 0)) return { status: 400 };

  const fields = value.fields === undefined ? undefined : value.fields;
  if (fields !== undefined && (!Array.isArray(fields) || fields.length === 0 || fields.length > MAX_FIELDS || fields.some((field) => typeof field !== "string" || !(field in FIELD_LABELS)))) return { status: 400 };
  if (value.sort !== undefined && (!isRecord(value.sort) || (value.sort.field !== undefined && !(String(value.sort.field) in FIELD_LABELS)) || (value.sort.direction !== undefined && value.sort.direction !== "asc" && value.sort.direction !== "desc"))) return { status: 400 };

  return {
    report_type: value.report_type as ReportType,
    format: (value.format as ReportFormat | undefined) ?? "json",
    filters: filters as ReportFilters,
    fields: fields as ReportField[] | undefined,
    sort: value.sort as GenerateReportRequest["sort"],
  };
}

function startOfDay(value: Date): Date { const result = new Date(value); result.setHours(0, 0, 0, 0); return result; }
function daysUntil(date: string | null | undefined, now = new Date()): number | null { if (!date) return null; const target = startOfDay(new Date(date)); return Math.ceil((target.getTime() - startOfDay(now).getTime()) / 86400000); }

export function vigenciaStatus(date: string | null | undefined, category?: string | null, now = new Date()): string {
  if (category?.toLowerCase().includes("final") || category?.toLowerCase().includes("conclu")) return "concluidas";
  const days = daysUntil(date, now);
  if (days === null) return "sem_prazo";
  if (days < 0) return "vencidos";
  if (days <= 7) return "ate_7_dias";
  if (days <= 30) return "ate_30_dias";
  if (days <= 60) return "ate_60_dias";
  if (days <= 90) return "ate_90_dias";
  return "vigentes";
}

export function normalizeProcess(row: any, now = new Date()): Record<string, unknown> {
  const parcels = Array.isArray(row.process_parcels) ? row.process_parcels : [];
  const paid = parcels.filter((parcel: any) => parcel.payment_date !== null && parcel.payment_date !== undefined);
  const totalPaid = paid.reduce((sum: number, parcel: any) => sum + Number(parcel.value || 0), 0);
  const totalPortaria = Number(row.total_portaria_value || 0);
  const municipality = row.municipalities?.name ?? "";
  const region = row.municipalities?.regioes?.nome ?? "";
  const status = row.status_processos?.nome ?? "";
  return {
    id: row.id,
    process_number: row.process_number,
    object: row.object,
    category: row.categoria ?? "obra",
    municipality,
    region,
    regional_nucleus: row.regional_nuclei?.name ?? "",
    status,
    contract_signed: Boolean(row.contrato_assinado),
    portaria_number: row.portaria_number ?? "",
    total_portaria_value: totalPortaria,
    total_concedente_value: Number(row.total_concedente_value || 0),
    total_proponente_value: Number(row.total_proponente_value || 0),
    licitado_value: row.licitado_value === null ? null : Number(row.licitado_value),
    total_paid: totalPaid,
    balance: Math.max(0, totalPortaria - totalPaid),
    parcel_count: parcels.length,
    paid_parcel_count: paid.length,
    created_at: row.created_at,
    vigencia_date: row.vigencia_date,
    vigencia_status: vigenciaStatus(row.vigencia_date, status || row.categoria, now),
    last_tramitacao: row.last_tramitacao ?? "",
  };
}

/**
 * Events do not have a foreign key to regional_nuclei.  Keep their
 * normalization here so the Edge Function never attempts an invalid embedded
 * PostgREST relationship when a report also includes events.
 */
export function normalizeEvent(row: any): Record<string, unknown> {
  return {
    id: row.id,
    process_number: row.numero_processo ?? "",
    object: row.objeto ?? row.nome ?? "",
    category: "evento",
    municipality: row.municipalities?.name ?? row.municipio_nome ?? "",
    region: row.municipalities?.regioes?.nome ?? "",
    regional_nucleus: row.nucleo_origem_texto ?? "",
    status: row.foi_pago === true ? "Pago" : "Não pago",
    contract_signed: String(row.contrato_assinado ?? "").toLowerCase() === "sim" || row.contrato_assinado === true,
    total_concedente_value: Number(row.valor_concedente || 0),
    total_proponente_value: Number(row.valor_proponente || 0),
    total_portaria_value: Number(row.valor_concedente || 0) + Number(row.valor_proponente || 0),
    total_paid: row.foi_pago === true ? Number(row.valor_concedente || 0) : 0,
    balance: row.foi_pago === true ? 0 : Number(row.valor_concedente || 0),
    created_at: row.created_at ?? row.data_evento,
    vigencia_date: row.data_final ?? row.data_evento,
    vigencia_status: row.foi_pago === true ? "concluidas" : "vigentes",
    last_tramitacao: "",
  };
}

export function filterAndSortRows(rows: Record<string, unknown>[], request: GenerateReportRequest, now = new Date()): Record<string, unknown>[] {
  const filters = request.filters ?? {};
  const result = rows.filter((row) => {
    if (filters.municipality_ids?.length && !filters.municipality_ids.includes(Number(row.municipality_id ?? row.id))) return false;
    if (filters.category && String(row.category).toLowerCase() !== filters.category.toLowerCase()) return false;
    if (filters.regional_nucleus_id && Number(row.regional_nucleus_id) !== filters.regional_nucleus_id) return false;
    if (filters.region_id && Number(row.region_id) !== filters.region_id) return false;
    if (filters.region_name && String(row.region).toLocaleLowerCase("pt-BR") !== filters.region_name.toLocaleLowerCase("pt-BR")) return false;
    if (filters.status_ids?.length && !filters.status_ids.includes(Number(row.status_id))) return false;
    if (filters.status_names?.length && !filters.status_names.some((name) => String(row.status).toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) return false;
    if (filters.signed_contract_only && row.contract_signed !== true) return false;
    if (filters.min_proponent_value !== undefined && Number(row.total_proponente_value) < filters.min_proponent_value) return false;
    if (filters.date_from && String(row.created_at) < filters.date_from) return false;
    if (filters.date_to && String(row.created_at) > `${filters.date_to}T23:59:59.999Z`) return false;
    if (filters.vigencia && filters.vigencia !== "all" && row.vigencia_status !== filters.vigencia) return false;
    return true;
  });
  const sortField = request.sort?.field && request.sort.field in FIELD_LABELS ? request.sort.field : "created_at";
  const direction = request.sort?.direction === "asc" ? 1 : -1;
  return result.sort((a, b) => String(a[sortField] ?? "").localeCompare(String(b[sortField] ?? ""), "pt-BR", { numeric: true }) * direction).slice(0, MAX_ROWS);
}

export function summarize(rows: Record<string, unknown>[]): Record<string, unknown> {
  const sum = (field: string) => rows.reduce((total, row) => total + Number(row[field] || 0), 0);
  const byStatus: Record<string, number> = {};
  for (const row of rows) { const status = String(row.status || "Sem status"); byStatus[status] = (byStatus[status] || 0) + 1; }
  return {
    process_count: rows.length,
    municipality_count: new Set(rows.map((row) => row.municipality).filter(Boolean)).size,
    regional_nucleus_count: new Set(rows.map((row) => row.regional_nucleus).filter(Boolean)).size,
    total_portaria_value: sum("total_portaria_value"),
    total_concedente_value: sum("total_concedente_value"),
    total_proponente_value: sum("total_proponente_value"),
    total_paid: sum("total_paid"),
    balance: sum("balance"),
    expired_count: rows.filter((row) => row.vigencia_status === "vencidos").length,
    expiring_30_days_count: rows.filter((row) => ["ate_7_dias", "ate_30_dias"].includes(String(row.vigencia_status))).length,
    by_status: byStatus,
  };
}
