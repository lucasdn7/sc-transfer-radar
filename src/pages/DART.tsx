import { Fragment, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock3, FileCheck2, RefreshCw, Search, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
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

function RequirementDetails({ details }: { details: unknown }) {
  const data = getObject(details);
  const creditors = Array.isArray(data?.listaCredores) ? data.listaCredores : [];
  if (!details) return <p className="text-sm text-muted-foreground">Faça uma consulta para carregar os requisitos e comprovantes do DART.</p>;
  return (
    <div className="space-y-3">
      {creditors.length > 0 && <div className="grid gap-2 sm:grid-cols-2">
        {creditors.map((item, index) => {
          const creditor = getObject(item) ?? {};
          const compliant = creditor.flComprovado === true;
          const name = String(creditor.nome ?? creditor.nmCredor ?? creditor.descricao ?? creditor.nomeCredor ?? `Credor ${index + 1}`);
          return <div key={`${name}-${index}`} className="flex items-start gap-2 rounded-lg border bg-background p-3">
            {compliant ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
            <div className="min-w-0"><p className="text-sm font-medium">{name}</p><p className={`mt-0.5 text-xs ${compliant ? "text-emerald-700" : "text-red-700"}`}>{compliant ? "Comprovado" : "Com pendência"}</p></div>
          </div>;
        })}
      </div>}
      {data?.avisoLegal && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{String(data.avisoLegal)}</p>}
      <details className="group rounded-lg border bg-background">
        <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium text-foreground">Ver resposta detalhada do DART</summary>
        <pre className="max-h-72 overflow-auto border-t bg-muted/30 p-3 text-xs leading-relaxed">{JSON.stringify(details, null, 2)}</pre>
      </details>
    </div>
  );
}

export default function DART() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [checkingIds, setCheckingIds] = useState<Set<number>>(new Set());
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
    return matchesSearch && (filter === "all" || status === filter);
  }), [municipalities, search, filter]);

  const metrics = [
    { label: "Municípios", count: municipalities.length, icon: FileCheck2, tone: "text-slate-700", accent: "bg-slate-100" },
    { label: "Regulares", count: municipalities.filter((m) => m.dart_status === "regular").length, icon: CheckCircle2, tone: "text-emerald-700", accent: "bg-emerald-50" },
    { label: "Irregulares", count: municipalities.filter((m) => m.dart_status === "irregular").length, icon: XCircle, tone: "text-red-700", accent: "bg-red-50" },
    { label: "Pendentes", count: municipalities.filter((m) => !m.dart_status || m.dart_status === "pending").length, icon: Clock3, tone: "text-amber-700", accent: "bg-amber-50" },
  ];

  async function verifyMunicipality(municipality: Municipality): Promise<boolean> {
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
      toast({ title: `Falha ao consultar ${municipality.name}`, description: cause instanceof Error ? cause.message : "Erro inesperado na consulta.", variant: "destructive" });
      return false;
    } finally {
      setCheckingIds((previous) => { const next = new Set(previous); next.delete(municipality.id); return next; });
    }
  }

  async function verifyAll() {
    if (batch || municipalities.length === 0) return;
    const list = municipalities;
    let succeeded = 0;
    for (let index = 0; index < list.length; index += 1) {
      setBatch({ current: index + 1, total: list.length, name: list[index].name });
      if (await verifyMunicipality(list[index])) succeeded += 1;
    }
    setBatch(null);
    await queryClient.invalidateQueries({ queryKey: ["dart-municipalities"] });
    toast({ title: "Verificação concluída", description: `${succeeded} de ${list.length} consultas concluídas com resposta do DART.` });
  }

  if (isLoading) return <div className="space-y-5" aria-label="Carregando municípios"><div className="h-8 w-56 animate-pulse rounded bg-muted" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div><div className="h-72 animate-pulse rounded-xl bg-muted" /></div>;
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">Não foi possível carregar os municípios: {(error as Error).message}</div>;

  return <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
    <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/">Início</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>DART</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>

    <section className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-white to-emerald-50/50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
      <div className="flex items-start gap-4">
        <div className="hidden rounded-xl bg-emerald-100 p-3 text-emerald-800 sm:block"><ShieldCheck className="h-7 w-7" /></div>
        <div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Consulta oficial · CIASC</p><h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Regularidade DART</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Consulte a situação dos municípios para Convênio Simplificado. O resultado é atualizado diretamente com os dados oficiais do DART.</p></div>
      </div>
      <Button onClick={verifyAll} disabled={Boolean(batch) || municipalities.length === 0} className="w-full shrink-0 bg-emerald-800 hover:bg-emerald-900 sm:w-auto">
        <RefreshCw className={`mr-2 h-4 w-4 ${batch ? "animate-spin" : ""}`} />{batch ? `Consultando ${batch.current}/${batch.total}` : "Verificar todos"}
      </Button>
    </section>

    {batch && <Card><CardContent className="space-y-2 p-4"><div className="flex flex-wrap justify-between gap-2 text-sm"><span>Consultando <strong>{batch.name}</strong></span><span className="text-muted-foreground">{batch.current} de {batch.total}</span></div><Progress value={batch.current / batch.total * 100} className="h-2" /></CardContent></Card>}

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(({ label, count, icon: Icon, tone, accent }) => <Card key={label} className="shadow-sm"><CardContent className="flex items-center gap-3 p-4 sm:p-5"><div className={`rounded-lg p-2.5 ${accent} ${tone}`}><Icon className="h-5 w-5" /></div><div><p className="text-2xl font-semibold leading-none text-slate-950">{count}</p><p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">{label}</p></div></CardContent></Card>)}</div>

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

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow className="bg-muted/40"><TableHead className="min-w-44">Município</TableHead><TableHead className="min-w-36">CNPJ</TableHead><TableHead className="min-w-32">Situação</TableHead><TableHead className="min-w-40">Validade mais próxima</TableHead><TableHead className="min-w-40">Última consulta</TableHead><TableHead className="w-32 text-right">Ação</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">Nenhum município encontrado para este filtro.</TableCell></TableRow> : filtered.map((municipality) => {
                const checking = checkingIds.has(municipality.id);
                const visibleStatus = checking ? "checking" : municipality.dart_status;
                return <Fragment key={municipality.id}><TableRow className="align-top">
                  <TableCell className="font-medium text-slate-900">{municipality.name}<p className="mt-1 max-w-xs text-xs font-normal text-muted-foreground">{municipality.dart_detalhes ?? "Sem consulta registrada"}</p></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatCnpj(municipality.cnpj)}</TableCell>
                  <TableCell><StatusBadge status={visibleStatus} /></TableCell>
                  <TableCell className="text-sm">{formatDate(municipality.dart_validade)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(municipality.dart_verificado_em)}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" disabled={checking || Boolean(batch)} onClick={() => void verifyMunicipality(municipality)}><RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />{checking ? "Consultando" : "Verificar"}</Button></TableCell>
                </TableRow><TableRow><TableCell colSpan={6} className="border-t-0 px-4 pb-4 pt-0"><RequirementDetails details={municipality.dart_details} /></TableCell></TableRow></Fragment>;
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    <p className="text-xs leading-relaxed text-muted-foreground">Os resultados são fornecidos pelo serviço oficial do DART para Convênio Simplificado. “Pendente” indica ausência de cadastro ou de dados suficientes para confirmar a regularidade.</p>
  </div>;
}
