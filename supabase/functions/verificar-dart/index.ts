import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isSantaCatarinaMunicipality } from "../../../src/lib/santaCatarinaMunicipalities.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const CIASC_URL =
  "https://dart-api.prod.okd4.ciasc.sc.gov.br/api/consulta/consulta";
const COOLDOWN_MS = 60_000;
const MAX_BODY_BYTES = 2_000;
const MAX_RESPONSE_BYTES = 5_000_000;
const UPSTREAM_TIMEOUT_MS = 45_000;
const UPSTREAM_MAX_ATTEMPTS = 2;

type Status = "regular" | "irregular" | "pending";
type JsonObject = Record<string, unknown>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeCnpj(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function cnpjIsValid(value: string) {
  return /^[A-Z0-9]{12}\d{2}$/.test(value);
}

function getObject(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject
    : null;
}

function valuesDeep(value: unknown, keys: string[], depth = 0): unknown[] {
  if (depth > 8 || !value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => valuesDeep(item, keys, depth + 1));
  }
  const object = value as JsonObject;
  return [
    ...keys.flatMap((key) =>
      object[key] === undefined || object[key] === null ? [] : [object[key]]
    ),
    ...Object.values(object).flatMap((item) =>
      valuesDeep(item, keys, depth + 1)
    ),
  ];
}

function parseDate(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const date = br
    ? new Date(`${br[3]}-${br[2]}-${br[1]}T00:00:00Z`)
    : new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function normalizeResponse(
  raw: unknown,
): { status: Status; summary: string; validity: string | null } {
  const data = getObject(raw);
  if (!data) throw new Error("Resposta inválida do serviço DART.");
  const legalNotice = String(
    data.avisoLegal ?? data.avisolegal ?? data.mensagem ?? data.message ??
      data.errorMessage ?? "",
  );
  const normalizedNotice = legalNotice.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (
    /nao\s+(esta\s+)?cadastrad[oa].{0,60}sigef|sigef.{0,60}nao\s+cadastrad[oa]|cnpj.{0,60}(nao\s+encontrad[oa]|nao\s+localizad[oa])|nao\s+(ha|existe).{0,40}(cadastro|credor)/i
      .test(normalizedNotice)
  ) {
    return {
      status: "pending",
      summary: legalNotice || "CNPJ sem cadastro localizado no SIGEF.",
      validity: null,
    };
  }
  if (
    /não\s+(está\s+)?cadastrad[oa].{0,40}SIGEF|SIGEF.{0,40}não\s+cadastrad[oa]/i
      .test(legalNotice)
  ) {
    return {
      status: "pending",
      summary: "CNPJ sem cadastro localizado no SIGEF.",
      validity: null,
    };
  }
  if (data.hasError === true) {
    throw new Error("O serviço DART não conseguiu concluir a consulta.");
  }

  const creditors = Array.isArray(data.listaCredores) ? data.listaCredores : [];
  const flags = creditors.map((creditor) => getObject(creditor)?.flComprovado)
    .filter((flag) => typeof flag === "boolean");
  if (creditors.length === 0 || flags.length === 0) {
    return {
      status: "pending",
      summary: legalNotice ||
        "A consulta não retornou credores para avaliação.",
      validity: null,
    };
  }

  const status = flags.every((flag) => flag === true) ? "regular" : "irregular";
  const validityDates = valuesDeep(data, ["dataValidade", "validade"])
    .map(parseDate).filter((date): date is string => Boolean(date)).sort();
  const validity = validityDates[0] ?? null;
  const summary = status === "regular"
    ? `${creditors.length} credor(es) consultado(s); todos comprovados.`
    : `${
      flags.filter((flag) => flag === false).length
    } credor(es) com pendência de comprovação.`;
  return { status, summary, validity };
}

async function readLimited(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  let text = "";
  let size = 0;
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error("Resposta do serviço DART excede o limite permitido.");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

async function fetchOfficialDart(url: URL) {
  for (let attempt = 1; attempt <= UPSTREAM_MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      const transient = response.status === 429 || response.status >= 500;
      if (transient && attempt < UPSTREAM_MAX_ATTEMPTS) {
        await response.body?.cancel();
        await new Promise((resolve) => setTimeout(resolve, 700));
        continue;
      }
      if (!response.ok) {
        throw new Error(`Serviço DART indisponível (HTTP ${response.status}).`);
      }
      return response;
    } catch (error) {
      if (attempt >= UPSTREAM_MAX_ATTEMPTS) throw error;
      const retryable = error instanceof TypeError ||
        (error instanceof Error && error.name === "AbortError");
      if (!retryable) throw error;
      await new Promise((resolve) => setTimeout(resolve, 700));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("O serviço DART não respondeu após nova tentativa.");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }
  let body: JsonObject;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
      return json({ error: "Requisição muito grande." }, 413);
    }
    body = getObject(JSON.parse(text)) ?? {};
  } catch {
    return json({ error: "Corpo JSON inválido." }, 400);
  }
  const municipalityId = Number(body.municipalityId);
  if (!Number.isSafeInteger(municipalityId) || municipalityId <= 0) {
    return json({ error: "Informe um município válido." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Serviço de consulta não configurado." }, 500);
  }
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: municipality, error: lookupError } = await admin.from(
    "municipalities",
  )
    .select(
      "id, name, cnpj, dart_status, dart_validade, dart_verificado_em, dart_detalhes, dart_details, dart_last_checked_at",
    )
    .eq("id", municipalityId).maybeSingle();
  if (lookupError) {
    return json(
      { error: "Não foi possível carregar os dados do município." },
      500,
    );
  }
  if (!municipality) return json({ error: "Município não encontrado." }, 404);
  const queryType = isSantaCatarinaMunicipality(municipality.name) ? 2 : 1;

  const now = new Date();
  const lastChecked = municipality.dart_last_checked_at
    ? new Date(municipality.dart_last_checked_at).getTime()
    : 0;
  if (lastChecked && now.getTime() - lastChecked < COOLDOWN_MS) {
    return json({
      municipalityId,
      name: municipality.name,
      queryType,
      status: municipality.dart_status ?? "pending",
      validity: municipality.dart_validade,
      checkedAt: municipality.dart_verificado_em,
      summary: municipality.dart_detalhes,
      details: municipality.dart_details,
      cached: true,
    });
  }

  const cnpj = normalizeCnpj(municipality.cnpj ?? "");
  if (!cnpjIsValid(cnpj)) {
    return json(
      {
        error:
          `O CNPJ cadastrado para esta entidade está inválido; não foi possível consultar como ${
            queryType === 1 ? "TRA" : "Convênio Simplificado"
          }.`,
        queryType,
      },
      422,
    );
  }

  const checkStartedAt = now.toISOString();
  const lockQuery = admin.from("municipalities")
    .update({ dart_last_checked_at: checkStartedAt })
    .eq("id", municipalityId);
  const lockResult = municipality.dart_last_checked_at
    ? await lockQuery.lt(
      "dart_last_checked_at",
      new Date(now.getTime() - COOLDOWN_MS).toISOString(),
    ).select("id").maybeSingle()
    : await lockQuery.is("dart_last_checked_at", null).select("id")
      .maybeSingle();
  const { data: lock, error: lockError } = lockResult;
  if (lockError) {
    console.error(
      "DART cooldown lock failed",
      lockError.code,
      lockError.message,
    );
    return json({ error: "Não foi possível iniciar a consulta." }, 500);
  }
  if (!lock) {
    const { data: current } = await admin.from("municipalities")
      .select(
        "dart_status, dart_validade, dart_verificado_em, dart_detalhes, dart_details",
      )
      .eq("id", municipalityId).single();
    return json({
      municipalityId,
      queryType,
      status: current?.dart_status ?? "pending",
      validity: current?.dart_validade,
      checkedAt: current?.dart_verificado_em,
      summary: current?.dart_detalhes,
      details: current?.dart_details,
      cached: true,
    });
  }

  try {
    const url = new URL(CIASC_URL);
    url.searchParams.set("cnpjcpf", cnpj);
    url.searchParams.set("idConsulta", String(queryType));
    const upstream = await fetchOfficialDart(url);
    if (!upstream.ok) {
      throw new Error(`Serviço DART indisponível (HTTP ${upstream.status}).`);
    }
    let raw: unknown;
    try {
      raw = JSON.parse(await readLimited(upstream));
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("O serviço DART retornou dados inválidos.");
      }
      throw error;
    }
    const result = normalizeResponse(raw);
    const checkedAt = new Date().toISOString();
    const { error: updateError } = await admin.from("municipalities").update({
      dart_status: result.status,
      dart_validade: result.validity,
      dart_verificado_em: checkedAt,
      dart_detalhes: result.summary,
      dart_details: raw,
      dart_last_checked_at: checkedAt,
    }).eq("id", municipalityId);
    if (updateError) {
      throw new Error(
        "Consulta concluída, mas não foi possível salvar o resultado.",
      );
    }
    return json({
      municipalityId,
      name: municipality.name,
      queryType,
      ...result,
      checkedAt,
      details: raw,
      cached: false,
    });
  } catch (error) {
    console.error("DART verification failed", {
      municipalityId,
      queryType,
      errorName: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    });
    const message = error instanceof Error && error.name === "AbortError"
      ? "A consulta ao serviço DART excedeu o tempo limite. Tente novamente em instantes."
      : error instanceof Error
      ? error.message
      : "Falha temporária ao consultar o DART.";
    return json(
      { error: message, code: "DART_UPSTREAM_ERROR", queryType },
      502,
    );
  }
});
