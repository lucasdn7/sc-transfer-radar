import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  DEFAULT_FIELDS,
  FIELD_LABELS,
  MAX_BODY_BYTES,
  MAX_ROWS,
  filterAndSortRows,
  isRecord,
  normalizeProcess,
  parseRequestBody,
  summarize,
  type GenerateReportRequest,
} from "./report.ts";

const ALLOWED_ORIGINS = new Set([
  "https://transfersc.vercel.app",
  ...(Deno.env.get("REPORT_ALLOWED_ORIGINS") ?? "").split(",").map((origin) => origin.trim()).filter(Boolean),
]);
const cors = (origin: string | null): HeadersInit => ({
  "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://transfersc.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

function response(status: number, body: Record<string, unknown>, origin: string | null): Response {
  return new Response(JSON.stringify(body), { status, headers: cors(origin) });
}

function badRequest(origin: string | null, status = 400): Response {
  return response(status, { error: status === 413 ? "Relatório muito grande." : "Parâmetros de relatório inválidos." }, origin);
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows: Record<string, unknown>[], fields: string[]): string {
  const header = fields.map((field) => csvEscape(FIELD_LABELS[field as keyof typeof FIELD_LABELS] ?? field)).join(",");
  const body = rows.map((row) => fields.map((field) => csvEscape(row[field])).join(",")).join("\n");
  return `\uFEFF${header}${body ? `\n${body}` : ""}`;
}

async function fetchProcesses(request: GenerateReportRequest): Promise<any[]> {
  if (!supabase) throw new Error("missing_supabase_config");
  let query = supabase.from("processes").select(`
    id, categoria, contrato_assinado, created_at, last_tramitacao, licitado_value,
    municipality_id, object, portaria_number, process_number, regional_nucleus_id,
    status_id, total_concedente_value, total_portaria_value, total_proponente_value,
    updated_at, vigencia_date,
    municipalities(id, name, region_id, regional_nucleus_id, regioes(id, nome)),
    regional_nuclei(id, name, acronym),
    status_processos(id, nome, cor),
    process_parcels(id, parcel_number, payment_date, value)
  `).limit(MAX_ROWS);
  const filters = request.filters ?? {};
  if (filters.municipality_ids?.length) query = query.in("municipality_id", filters.municipality_ids);
  if (filters.regional_nucleus_id) query = query.eq("regional_nucleus_id", filters.regional_nucleus_id);
  if (filters.status_ids?.length) query = query.in("status_id", filters.status_ids);
  if (filters.date_from) query = query.gte("created_at", filters.date_from);
  if (filters.date_to) query = query.lte("created_at", `${filters.date_to}T23:59:59.999Z`);
  if (filters.signed_contract_only) query = query.eq("contrato_assinado", true);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error("process_query_failed");
  return data ?? [];
}

async function fetchEvents(request: GenerateReportRequest): Promise<any[]> {
  if (!supabase) throw new Error("missing_supabase_config");
  let query = supabase.from("events").select(`id, ano, contrato_assinado, data_evento, data_final, foi_pago, municipio_id, municipio_nome, nome, numero_processo, objeto, tipo, valor_concedente, valor_proponente, municipalities(id, name, region_id, regional_nucleus_id, regioes(id, nome)), regional_nuclei(id, name, acronym)`).limit(MAX_ROWS);
  const filters = request.filters ?? {};
  if (filters.municipality_ids?.length) query = query.in("municipio_id", filters.municipality_ids);
  if (filters.date_from) query = query.gte("data_evento", filters.date_from);
  if (filters.date_to) query = query.lte("data_evento", filters.date_to);
  const { data, error } = await query.order("data_evento", { ascending: false });
  if (error) throw new Error("event_query_failed");
  return data ?? [];
}

function normalizeEvent(row: any): Record<string, unknown> {
  return {
    id: row.id,
    process_number: row.numero_processo ?? "",
    object: row.objeto ?? row.nome ?? "",
    category: "evento",
    municipality: row.municipalities?.name ?? row.municipio_nome ?? "",
    region: row.municipalities?.regioes?.nome ?? "",
    regional_nucleus: row.regional_nuclei?.name ?? "",
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

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return badRequest(origin, 405);
  const contentLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return badRequest(origin, 413);
  try {
    const body = new TextDecoder().decode(new Uint8Array(await req.arrayBuffer()));
    const parsed = parseRequestBody(body);
    if ("status" in parsed) return badRequest(origin, parsed.status);
    if (!supabase) return response(503, { error: "Serviço temporariamente indisponível." }, origin);

    const rawProcesses = await fetchProcesses(parsed);
    let rows = rawProcesses.map((row) => ({ ...normalizeProcess(row), municipality_id: row.municipality_id, region_id: row.municipalities?.region_id, regional_nucleus_id: row.regional_nucleus_id, status_id: row.status_id }));
    if (["executive", "municipality", "custom"].includes(parsed.report_type)) {
      const rawEvents = await fetchEvents(parsed);
      rows = rows.concat(rawEvents.map(normalizeEvent));
    }
    rows = filterAndSortRows(rows, parsed);
    const fields = parsed.fields ?? DEFAULT_FIELDS[parsed.report_type];
    const summary = summarize(rows);
    const metadata = {
      report_id: crypto.randomUUID(),
      report_type: parsed.report_type,
      format: parsed.format,
      generated_at: new Date().toISOString(),
      row_count: rows.length,
      fields,
      filters_applied: parsed.filters ?? {},
    };
    if (parsed.format === "csv") {
      return new Response(toCsv(rows, fields), { status: 200, headers: { ...cors(origin), "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${parsed.report_type}.csv"` } });
    }
    return response(200, { ...metadata, fields, summary, rows }, origin);
  } catch (error) {
    console.error(JSON.stringify({ status: 500, error: error instanceof Error ? error.message : "internal_error" }));
    return response(500, { error: "Não foi possível gerar o relatório." }, origin);
  }
});
