import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, ChevronDown, Clock3, Link2, RefreshCw, Search, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isSantaCatarinaMunicipality } from "@/lib/santaCatarinaMunicipalities";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type DartStatus = "regular" | "irregular" | "pending" | "error" | "checking";
type Municipality = {
  id: number;
  name: string;
  cnpj: string;
  dart_status: DartStatus | null;
  dart_validade: string | null;
  dart_verificado_em: string | null;
  dart_detalhes: string | null;
  dart_details: unknown;
};
type VerifyResult = {
  status?: DartStatus;
  error?: string;
  summary?: string;
  validity?: string | null;
  checkedAt?: string;
  details?: unknown;
  cached?: boolean;
};

const statusPresentation: Record<string, { label: string; icon: typeof CheckCircle2; badge: string; foreground: string }> = {
  regular: { label: "Regular", icon: CheckCircle2, badge: "border-emerald-200 bg-emerald-50 text-emerald-800", foreground: "text-emerald-700" },
  irregular: { label: "Irregular", icon: XCircle, badge: "border-red-200 bg-red-50 text-red-800", foreground: "text-red-700" },
  pending: { label: "Pendente", icon: Clock3, badge: "border-amber-200 bg-amber-50 text-amber-800", foreground: "text-amber-700" },
  error: { label: "Erro técnico", icon: AlertCircle, badge: "border-slate-200 bg-slate-100 text-slate-700", foreground: "text-slate-600" },
  checking: { label: "Consultando", icon: RefreshCw, badge: "border-blue-200 bg-blue-50 text-blue-800", foreground: "text-blue-700" },
};

function normalizedCnpj(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function formatCnpj(value: string) {
  const cnpj = normalizedCnpj(value);
  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj)) return value || "—";
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Não informado";
  const brazilianDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const normalized = brazilianDate
    ? `${brazilianDate[3]}-${brazilianDate[2]}-${brazilianDate[1]}`
    : isoDate ? `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}` : value;
  const date = new Date(`${normalized.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "Não informado" : date.toLocaleDateString("pt-BR");
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Ainda não consultado";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Ainda não consultado" : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function getObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function StatusBadge({ status }: { status: DartStatus | null }) {
  const view = statusPresentation[status ?? "pending"] ?? statusPresentation.pending;
  const Icon = view.icon;
  return <Badge variant="outline" className={`gap-1.5 whitespace-nowrap font-medium ${view.badge}`}><Icon className={`h-3.5 w-3.5 ${status === "checking" ? "animate-spin" : ""}`} />{view.label}</Badge>;
}

function RequirementEvidence({ label, records }: { label: string; records: unknown[] }) {
  if (!records.length) return null;
  return <details className="group rounded-md border bg-background">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span>{label} <span className="text-muted-foreground">({records.length})</span></span>
      <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
    </summary>
    <div className="grid gap-2 border-t bg-muted/20 p-3 sm:grid-cols-2">
      {records.map((item, index) => {
        const record = getObject(item) ?? {};
        const title = String(record.empresa ?? record.concedente ?? record.titulo ?? record.nome ?? `${label} ${index + 1}`);
        const status = record.situacao ?? record.status;
        const document = record.cnpj ?? record.cpfCnpjCredor;
        const validity = record.validade ?? record.dataValidade ?? record.dataLimite;
        const compliant = record.flComprovado ?? record.comprovado;
        const references = [
          record.ano && `Ano ${record.ano}`,
          record.numeroEmpenho && `Empenho ${record.numeroEmpenho}`,
          record.numeroPC && `Prestação de contas ${record.numeroPC}`,
          record.numeroTR && `Termo ${record.numeroTR}`,
          record.dataRepasse && `Repasse em ${formatDate(String(record.dataRepasse))}`,
          record.valor && `Valor ${record.valor}`,
        ].filter(Boolean);
        return <div key={`${title}-${index}`} className="min-w-0 rounded-md border bg-background p-3">
          <p className="break-words text-sm font-medium">{title}</p>
          {!getObject(item) && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{String(item)}</p>}
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {references.map((reference) => <span key={String(reference)}>{reference}</span>)}
            {document && <span>CNPJ {formatCnpj(String(document))}</span>}
            {status && <span>{String(status)}</span>}
            {validity && <span>Validade: {formatDate(String(validity))}</span>}
            {typeof compliant === "boolean" && <span className={compliant ? "text-emerald-700" : "text-red-700"}>{compliant ? "Comprovado" : "Com pendência"}</span>}
          </div>
        </div>;
      })}
    </div>
  </details>;
}

function CreditorItem({ creditor, index, depth = 0 }: { creditor: Record<string, unknown>; index: number; depth?: number }) {
  const name = String(creditor.nomeCredor ?? creditor.nome ?? creditor.nmCredor ?? `Credor ${index + 1}`);
  const compliant = creditor.flComprovado === true;
  const requirements = Array.isArray(creditor.listaRequisitos) ? creditor.listaRequisitos : [];
  const linked = depth < 2 ? Object.entries(creditor)
    .filter(([key, value]) => /(vinculad|credor|orgao)/i.test(key) && Array.isArray(value))
    .flatMap(([, value]) => value as unknown[])
    .map(getObject).filter((item): item is Record<string, unknown> => Boolean(item)) : [];

  return <details className="group rounded-lg border bg-background">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-4">
      <span className="flex min-w-0 items-start gap-2.5">
        {compliant ? <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> : <XCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />}
        <span className="min-w-0"><span className="block break-words text-sm font-semibold text-slate-900">{name}</span><span className={`mt-0.5 block text-xs ${compliant ? "text-emerald-700" : "text-red-700"}`}>{compliant ? "Regular" : "Com pendência"} · {requirements.length} requisito(s)</span></span>
      </span>
      <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
    </summary>
    <div className="space-y-3 border-t bg-slate-50/70 p-3 sm:p-4">
      {(creditor.documentoCredor ?? creditor.cnpj) && <p className="text-xs text-muted-foreground">CNPJ: {formatCnpj(String(creditor.documentoCredor ?? creditor.cnpj))}</p>}
      {requirements.map((item, requirementIndex) => {
        const requirement = getObject(item) ?? {};
        const title = String(requirement.tituloRequisito ?? requirement.nome ?? `Requisito ${requirementIndex + 1}`);
        const passed = requirement.comprovado;
        const cnds = Array.isArray(requirement.listaCNDs) ? requirement.listaCNDs : [];
        const accountRecords = Array.isArray(requirement.prestacaoContas) ? requirement.prestacaoContas : [];
        return <details key={`${title}-${requirementIndex}`} className="group/requirement rounded-md border bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex min-w-0 items-start gap-2"><span className="mt-0.5">{passed === true ? <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-700" /> : passed === false ? <XCircle aria-hidden="true" className="h-4 w-4 text-red-700" /> : <Clock3 aria-hidden="true" className="h-4 w-4 text-amber-700" />}</span><span className="min-w-0"><span className="block break-words text-sm font-medium">{title}</span><span className={`mt-1 block text-xs ${passed === true ? "text-emerald-700" : passed === false ? "text-red-700" : "text-amber-700"}`}>{passed === true ? "Atendido" : passed === false ? "Não atendido" : "Sem informação"}{requirement.dataValidade ? ` · validade ${formatDate(String(requirement.dataValidade))}` : ""}</span></span></span>
            <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open/requirement:rotate-180" />
          </summary>
          <div className="space-y-2 border-t p-3">
            {requirement.mensagem && <p className="text-xs leading-relaxed text-muted-foreground">{String(requirement.mensagem)}</p>}
            {requirement.mensagemBloqueio && <p className="rounded bg-red-50 p-2 text-xs leading-relaxed text-red-800">{String(requirement.mensagemBloqueio)}</p>}
            <RequirementEvidence label="Certidões e credores relacionados" records={cnds} />
            <RequirementEvidence label="Prestações de contas relacionadas" records={accountRecords} />
            {!requirement.mensagem && !requirement.mensagemBloqueio && !cnds.length && !accountRecords.length && <p className="text-xs text-muted-foreground">O DART não retornou detalhes adicionais para este requisito.</p>}
          </div>
        </details>;
      })}
      {linked.length > 0 && <div className="space-y-2 border-t pt-3"><h4 className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Link2 aria-hidden="true" className="h-3.5 w-3.5" />Credores vinculados ({linked.length})</h4>{linked.map((item, linkedIndex) => <CreditorItem key={`${String(item.nomeCredor ?? item.nome ?? linkedIndex)}-${linkedIndex}`} creditor={item} index={linkedIndex} depth={depth + 1} />)}</div>}
    </div>
  </details>;
}

function CreditorDetails({ details }: { details: unknown }) {
  const data = getObject(details);
  const creditors = Array.isArray(data?.listaCredores) ? data.listaCredores.map(getObject).filter((item): item is Record<string, unknown> => Boolean(item)) : [];
  if (!details) return <p className="text-sm text-muted-foreground">Faça uma consulta para carregar os requisitos e comprovantes do DART.</p>;
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-slate-900">Credores e órgãos vinculados</h3><span className="text-xs text-muted-foreground">{creditors.length} registros retornados pelo DART</span></div>
    {creditors.length ? creditors.map((creditor, index) => <CreditorItem key={`${String(creditor.nomeCredor ?? index)}-${index}`} creditor={creditor} index={index} />) : <p className="rounded-md border bg-white p-3 text-sm text-muted-foreground">A consulta não retornou credores para exibir.</p>}
    {data?.avisoLegal && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{String(data.avisoLegal)}</p>}
    <details className="group rounded-md border bg-background">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Resposta completa do DART <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" /></summary>
      <pre className="max-h-72 overflow-auto border-t bg-muted/30 p-3 text-xs leading-relaxed">{JSON.stringify(details, null, 2)}</pre>
    </details>
  </div>;
}

export default function DART() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [checkingIds, setCheckingIds] = useState<Set<number>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [batch, setBatch] = useState<{ current: number; total: number; name: string } | null>(null);

  const { data: municipalities = [], isLoading, error } = useQuery({
    queryKey: ["dart-municipalities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("municipalities")
        .select("id, name, cnpj, dart_status, dart_validade, dart_verificado_em, dart_detalhes, dart_details")
        .not("cnpj", "is", null).order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Municipality[];
    },
  });

  const filtered = useMemo(() => municipalities.filter((municipality) => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const matchesSearch = !term || municipality.name.toLocaleLowerCase("pt-BR").includes(term) || normalizedCnpj(municipality.cnpj).includes(normalizedCnpj(term));
    const status = municipality.dart_status ?? "pending";
    const pending = status !== "regular" && status !== "irregular";
    const matchesFilter = filter === "all" || (filter === "pending" ? pending : status === filter);
    return matchesSearch && matchesFilter;
  }), [municipalities, search, filter]);

  const municipalityCount = municipalities.filter((m) => isSantaCatarinaMunicipality(m.name)).length;
  const transferCount = municipalities.length - municipalityCount;
  const regularCount = municipalities.filter((m) => m.dart_status === "regular").length;
  const irregularCount = municipalities.filter((m) => m.dart_status === "irregular").length;
  const statusCounts = {
    regular: regularCount,
    irregular: irregularCount,
    pending: municipalities.length - regularCount - irregularCount,
  };
  const metrics = [
    { key: "regular", label: "Regulares", count: statusCounts.regular, icon: CheckCircle2, color: "emerald" },
    { key: "irregular", label: "Irregulares", count: statusCounts.irregular, icon: XCircle, color: "red" },
    { key: "pending", label: "Pendentes de verificação", count: statusCounts.pending, icon: Clock3, color: "amber" },
  ];

  function toggleExpanded(id: number) {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function verifyMunicipality(municipality: Municipality, quiet = false): Promise<boolean> {
    setCheckingIds((previous) => new Set(previous).add(municipality.id));
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<VerifyResult>("verificar-dart", {
        body: { municipalityId: municipality.id },
      });
      if (invokeError) {
        let message = invokeError.message;
        if (invokeError.context instanceof Response) {
          try { message = (await invokeError.context.clone().json()).error ?? message; } catch { /* mantém a mensagem da função */ }
        }
        if (invokeError.name === "FunctionsFetchError") {
          message = "Não foi possível conectar à Edge Function verificar-dart. A função precisa estar implantada no projeto Supabase e acessível pela rede. O resultado salvo anteriormente foi mantido.";
        }
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);
      await queryClient.invalidateQueries({ queryKey: ["dart-municipalities"] });
      const label = statusPresentation[data?.status ?? "pending"]?.label ?? "Pendente";
      toast({ title: `${municipality.name}: ${label}`, description: data?.summary ?? "Resultado atualizado com a consulta oficial do DART." });
      return true;
    } catch (cause) {
      if (!quiet) toast({ title: `Falha ao consultar ${municipality.name}`, description: cause instanceof Error ? cause.message : "Erro inesperado na consulta.", variant: "destructive" });
      return false;
    } finally {
      setCheckingIds((previous) => { const next = new Set(previous); next.delete(municipality.id); return next; });
    }
  }

  async function verifyAll() {
    if (batch || municipalities.length === 0) return;
    const list = municipalities;
    let succeeded = 0;
    const failed: string[] = [];
    for (let index = 0; index < list.length; index += 1) {
      setBatch({ current: index + 1, total: list.length, name: list[index].name });
      if (index > 0) await new Promise((resolve) => setTimeout(resolve, 500));
      if (await verifyMunicipality(list[index], true)) succeeded += 1;
      else failed.push(list[index].name);
    }
    setBatch(null);
    await queryClient.invalidateQueries({ queryKey: ["dart-municipalities"] });
    const failureSummary = failed.length ? ` Falhas: ${failed.slice(0, 4).join(", ")}${failed.length > 4 ? ` e mais ${failed.length - 4}` : ""}.` : "";
    toast({ title: failed.length ? "Verificação concluída com falhas" : "Verificação concluída", description: `${succeeded} de ${list.length} consultas concluídas.${failureSummary}`, variant: failed.length ? "destructive" : undefined });
  }

  if (isLoading) return <div className="space-y-5" aria-label="Carregando municípios"><div className="h-8 w-56 animate-pulse rounded bg-muted" /><div className="grid grid-cols-3 gap-2 sm:gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-lg bg-muted" />)}</div><div className="h-72 animate-pulse rounded-xl bg-muted" /></div>;
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">Não foi possível carregar os municípios: {(error as Error).message}</div>;

  return <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
    <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/">Início</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>DART</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>

    <section className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-white to-emerald-50/50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
      <div className="flex items-start gap-4">
        <div className="hidden rounded-xl bg-emerald-100 p-3 text-emerald-800 sm:block"><ShieldCheck className="h-7 w-7" /></div>
        <div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Consulta oficial · CIASC</p><h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Regularidade DART</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Municípios de Santa Catarina são consultados como Convênio Simplificado; os demais entes, como Transferência (TRA).</p></div>
      </div>
      <Button onClick={verifyAll} disabled={Boolean(batch) || municipalities.length === 0} className="w-full shrink-0 bg-emerald-800 hover:bg-emerald-900 sm:w-auto">
        <RefreshCw className={`mr-2 h-4 w-4 ${batch ? "animate-spin" : ""}`} />{batch ? `Consultando ${batch.current}/${batch.total}` : "Verificar todos"}
      </Button>
    </section>

    {batch && <Card><CardContent className="space-y-2 p-4"><div className="flex flex-wrap justify-between gap-2 text-sm"><span>Consultando <strong>{batch.name}</strong></span><span className="text-muted-foreground">{batch.current} de {batch.total}</span></div><Progress value={batch.current / batch.total * 100} className="h-2" /></CardContent></Card>}

    <section aria-labelledby="dart-summary-title" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="dart-summary-title" className="text-sm font-semibold text-slate-900">Situação dos entes</h2><span className="text-xs text-muted-foreground">{municipalityCount} municípios · {transferCount} registro(s) TRA</span></div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {metrics.map(({ key, label, count, icon: Icon }) => {
          const percentage = municipalities.length ? Math.round(count / municipalities.length * 100) : 0;
          const color = key === "regular"
            ? { border: "border-emerald-200", active: "ring-emerald-700", icon: "text-emerald-700", number: "text-emerald-800", bar: "bg-emerald-600", track: "bg-emerald-100" }
            : key === "irregular"
            ? { border: "border-red-200", active: "ring-red-700", icon: "text-red-700", number: "text-red-800", bar: "bg-red-600", track: "bg-red-100" }
            : { border: "border-amber-200", active: "ring-amber-700", icon: "text-amber-700", number: "text-amber-800", bar: "bg-amber-500", track: "bg-amber-100" };
          const active = filter === key;
          return <button key={key} type="button" aria-pressed={active} onClick={() => setFilter(active ? "all" : key)} className={`flex min-h-32 min-w-0 flex-col justify-between rounded-lg border bg-white p-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:min-h-36 sm:p-4 ${color.border} ${active ? `ring-2 ${color.active}` : ""}`}>
            <span className="flex items-start justify-between gap-1"><span className={`text-[11px] font-medium leading-tight text-slate-600 sm:text-sm`}>{label}</span><Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${color.icon}`} /></span>
            <span className="mt-2"><span className={`block text-2xl font-semibold tabular-nums leading-none sm:text-3xl ${color.number}`}>{count}</span><span className="mt-1.5 block text-[10px] text-muted-foreground sm:text-xs">{percentage}% do total</span></span>
            <span role="img" aria-label={`${percentage}% dos municípios`} className={`mt-3 block h-1.5 overflow-hidden rounded-full ${color.track}`}><span className={`block h-full rounded-full ${color.bar}`} style={{ width: `${percentage}%` }} /></span>
          </button>;
        })}
      </div>
    </section>

    <Card className="overflow-hidden shadow-sm">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="font-semibold text-slate-950">Municípios</h2><p className="mt-1 text-sm text-muted-foreground">A validade exibida é a data mais próxima entre os requisitos retornados.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Buscar município ou CNPJ" placeholder="Buscar município ou CNPJ" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" /></div>
            <div className="flex gap-1 overflow-x-auto pb-1" aria-label="Filtrar por situação">
              {[{ key: "all", label: "Todos" }, { key: "regular", label: "Regulares" }, { key: "irregular", label: "Irregulares" }, { key: "pending", label: "Pendentes" }].map(({ key, label }) => <Button key={key} size="sm" variant={filter === key ? "secondary" : "ghost"} aria-pressed={filter === key} onClick={() => setFilter(key)} className="shrink-0">{label}</Button>)}
            </div>
          </div>
        </div>

        <div className="hidden overflow-x-auto rounded-lg border xl:block">
          <Table>
            <TableHeader><TableRow className="bg-muted/40"><TableHead className="min-w-40">Município / ente</TableHead><TableHead className="min-w-36">CNPJ</TableHead><TableHead className="min-w-28">Situação</TableHead><TableHead className="min-w-36">Validade próxima</TableHead><TableHead className="min-w-36">Última consulta</TableHead><TableHead className="min-w-28 text-right">Ação</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">Nenhum ente encontrado para este filtro.</TableCell></TableRow> : filtered.map((municipality) => {
                const checking = checkingIds.has(municipality.id);
                const visibleStatus = checking ? "checking" : municipality.dart_status;
                const expanded = expandedIds.has(municipality.id);
                const creditorCount = Array.isArray(getObject(municipality.dart_details)?.listaCredores) ? (getObject(municipality.dart_details)?.listaCredores as unknown[]).length : 0;
                return [<TableRow key={`municipality-${municipality.id}`} className="align-top">
                  <TableCell className="font-medium text-slate-900"><button type="button" aria-expanded={expanded} onClick={() => toggleExpanded(municipality.id)} className="group/municipality flex max-w-full items-center gap-1.5 text-left font-semibold text-slate-900 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"><span className="break-words">{municipality.name}</span><Badge variant="outline" className="shrink-0 text-[10px]">{isSantaCatarinaMunicipality(municipality.name) ? "Município" : "TRA"}</Badge><ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} /></button><p className="mt-1 max-w-xs text-xs font-normal text-muted-foreground">{municipality.dart_detalhes ?? "Sem consulta registrada"}</p></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatCnpj(municipality.cnpj)}</TableCell>
                  <TableCell><StatusBadge status={visibleStatus} /></TableCell>
                  <TableCell className="text-sm">{formatDate(municipality.dart_validade)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(municipality.dart_verificado_em)}</TableCell>
                  <TableCell className="text-right"><div className="flex flex-col items-end gap-1.5"><Button size="sm" variant="outline" disabled={checking || Boolean(batch)} onClick={() => void verifyMunicipality(municipality)}><RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />{checking ? "Consultando" : "Verificar"}</Button><Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => toggleExpanded(municipality.id)} className="h-7 px-2 text-xs text-muted-foreground">{expanded ? "Ocultar" : `Credores (${creditorCount})`}</Button></div></TableCell>
                </TableRow>, ...(expanded ? [<TableRow key={`creditors-${municipality.id}`}><TableCell colSpan={6} className="bg-slate-50/70 px-4 py-4"><CreditorDetails details={municipality.dart_details} /></TableCell></TableRow>] : [])];
              })}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 xl:hidden">
          {filtered.length === 0 ? <div className="rounded-lg border py-10 text-center text-sm text-muted-foreground">Nenhum ente encontrado para este filtro.</div> : filtered.map((municipality) => {
            const checking = checkingIds.has(municipality.id);
            const expanded = expandedIds.has(municipality.id);
            const creditorCount = Array.isArray(getObject(municipality.dart_details)?.listaCredores) ? (getObject(municipality.dart_details)?.listaCredores as unknown[]).length : 0;
            return <article key={municipality.id} className="overflow-hidden rounded-lg border bg-white">
              <div className="space-y-3 p-3.5 sm:p-4">
                <div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><button type="button" aria-expanded={expanded} onClick={() => toggleExpanded(municipality.id)} className="flex max-w-full items-center gap-1.5 text-left font-semibold text-slate-900 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"><span className="break-words">{municipality.name}</span><Badge variant="outline" className="shrink-0 text-[10px]">{isSantaCatarinaMunicipality(municipality.name) ? "Município" : "TRA"}</Badge><ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} /></button><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{formatCnpj(municipality.cnpj)}</p></div><StatusBadge status={checking ? "checking" : municipality.dart_status} /></div>
                <p className="text-xs leading-relaxed text-muted-foreground">{municipality.dart_detalhes ?? "Ainda não verificado"}</p>
                <div className="grid grid-cols-2 gap-3 border-t pt-3 text-xs"><div><span className="block text-muted-foreground">Validade próxima</span><span className="mt-1 block font-medium text-slate-800">{formatDate(municipality.dart_validade)}</span></div><div><span className="block text-muted-foreground">Última consulta</span><span className="mt-1 block font-medium text-slate-800">{formatDateTime(municipality.dart_verificado_em)}</span></div></div>
                <div className="flex flex-col gap-2 border-t pt-3 min-[420px]:flex-row">
                  <Button variant="outline" size="sm" className="w-full min-[420px]:w-auto" aria-expanded={expanded} onClick={() => toggleExpanded(municipality.id)}><ChevronDown className={`mr-1.5 h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />{expanded ? "Recolher credores" : `Credores e vínculos (${creditorCount})`}</Button>
                  <Button size="sm" disabled={checking || Boolean(batch)} onClick={() => void verifyMunicipality(municipality)} className="w-full bg-emerald-800 hover:bg-emerald-900 min-[420px]:ml-auto min-[420px]:w-auto"><RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />{checking ? "Consultando" : "Verificar"}</Button>
                </div>
              </div>
              {expanded && <div className="border-t bg-slate-50/70 p-3.5 sm:p-4"><CreditorDetails details={municipality.dart_details} /></div>}
            </article>;
          })}
        </div>
      </CardContent>
    </Card>
    <p className="text-xs leading-relaxed text-muted-foreground">Os resultados são fornecidos pelo serviço oficial do DART para Convênio Simplificado. “Pendente” indica ausência de cadastro ou de dados suficientes para confirmar a regularidade.</p>
  </div>;
}
