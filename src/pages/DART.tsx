import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useToast } from "@/hooks/use-toast";

// ============================================================
// ⚠️ SUBSTITUA pela URL do seu webhook N8N
const N8N_WEBHOOK_URL = "https://casludn.app.n8n.cloud/workflow/ZQYBHF0zsQyjjWNd?projectId=8nkBT3fiip11fryy";
// ============================================================

type DartStatus = "regular" | "irregular" | "pending" | "error" | "checking";

interface Municipality {
  id: number;
  name: string;
  cnpj: string;
  dart_status: DartStatus | null;
  dart_validade: string | null;
  dart_verificado_em: string | null;
  dart_detalhes: string | null;
}

function formatCNPJ(cnpj: string) {
  const c = cnpj.replace(/\D/g, "");
  if (c.length !== 14) return cnpj;
  return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}

function formatDateTime(iso: string | null) {
  if (!iso) return "Nunca";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function StatusBadge({ status }: { status: DartStatus | null }) {
  const s = status || "pending";
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    regular:   { label: "Regular",      variant: "default",     icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
    irregular: { label: "Irregular",    variant: "destructive", icon: <XCircle className="h-3 w-3 mr-1" /> },
    pending:   { label: "Pendente",     variant: "secondary",   icon: <Clock className="h-3 w-3 mr-1" /> },
    error:     { label: "Erro",         variant: "outline",     icon: <AlertCircle className="h-3 w-3 mr-1" /> },
    checking:  { label: "Verificando",  variant: "secondary",   icon: <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> },
  };
  const { label, variant, icon } = map[s] || map.pending;
  return (
    <Badge variant={variant} className="flex items-center w-fit">
      {icon}{label}
    </Badge>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function DART() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [checkingIds, setCheckingIds] = useState<Set<number>>(new Set());
  const [isVerifyingAll, setIsVerifyingAll] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, name: "" });

  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  const { data: municipalities, isLoading, error } = useQuery({
    queryKey: ["dart-municipalities", debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from("municipalities")
        .select("id, name, cnpj, dart_status, dart_validade, dart_verificado_em, dart_detalhes")
        .not("cnpj", "is", null)
        .order("name", { ascending: true });

      if (debouncedSearch) {
        query = query.ilike("name", `%${debouncedSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Municipality[];
    },
  });

  // Stats
  const total      = municipalities?.length || 0;
  const regulares  = municipalities?.filter((m) => m.dart_status === "regular").length || 0;
  const irregulares= municipalities?.filter((m) => m.dart_status === "irregular").length || 0;
  const pendentes  = municipalities?.filter((m) => !m.dart_status || m.dart_status === "pending" || m.dart_status === "error").length || 0;

  // Última verificação
  const ultimaVerificacao = municipalities
    ?.filter((m) => m.dart_verificado_em)
    .sort((a, b) => new Date(b.dart_verificado_em!).getTime() - new Date(a.dart_verificado_em!).getTime())[0]
    ?.dart_verificado_em;

  // Filtro de status
  const filtered = municipalities?.filter((m) => {
    const status = m.dart_status || "pending";
    return filterStatus === "all" || status === filterStatus;
  }) || [];

  // Verificar um município
  async function verificarUm(m: Municipality) {
    setCheckingIds((prev) => new Set(prev).add(m.id));
    try {
      const resp = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ municipality_id: m.id, cnpj: m.cnpj, name: m.name }),
      });
      if (!resp.ok) throw new Error(`Webhook retornou ${resp.status}`);
      const resultado = await resp.json();
      await queryClient.invalidateQueries({ queryKey: ["dart-municipalities"] });
      toast({
        title: m.name,
        description: `Status: ${resultado.status === "regular" ? "Regular ✓" : "Irregular ✗"}`,
        variant: resultado.status === "regular" ? "default" : "destructive",
      });
    } catch (err: any) {
      toast({ title: "Erro ao verificar", description: err.message, variant: "destructive" });
    } finally {
      setCheckingIds((prev) => { const s = new Set(prev); s.delete(m.id); return s; });
    }
  }

  // Verificar todos
  async function verificarTodos() {
    if (!municipalities || isVerifyingAll) return;
    const lista = municipalities.filter((m) => m.cnpj);
    if (!confirm(`Verificar ${lista.length} municípios? Isso pode levar alguns minutos.`)) return;

    setIsVerifyingAll(true);
    setProgress({ current: 0, total: lista.length, name: "" });

    for (let i = 0; i < lista.length; i++) {
      const m = lista[i];
      setProgress({ current: i + 1, total: lista.length, name: m.name });
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ municipality_id: m.id, cnpj: m.cnpj, name: m.name }),
        });
      } catch {}
      await sleep(2000);
    }

    await queryClient.invalidateQueries({ queryKey: ["dart-municipalities"] });
    setIsVerifyingAll(false);
    setProgress({ current: 0, total: 0, name: "" });
    toast({ title: "Verificação concluída", description: `${lista.length} municípios verificados.` });
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar dados: {(error as Error).message}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/">Início</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>DART</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DART — Verificação de Regularidade</h1>
          <p className="text-gray-600">Situação dos municípios junto aos credores (Convênio Simplificado)</p>
          {ultimaVerificacao && (
            <p className="text-xs text-muted-foreground mt-1">
              Última verificação em lote: {new Date(ultimaVerificacao).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
        <Button onClick={verificarTodos} disabled={isVerifyingAll}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isVerifyingAll ? "animate-spin" : ""}`} />
          {isVerifyingAll ? `Verificando ${progress.current}/${progress.total}…` : "Verificar Todos"}
        </Button>
      </div>

      {/* Barra de progresso */}
      {isVerifyingAll && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Verificando: <strong>{progress.name}</strong></span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{total}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{regulares}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Regulares</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{irregulares}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Irregulares</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{pendentes}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Pendentes</div>
          </CardContent>
        </Card>
      </div>

      {/* Busca + Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Buscar município ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "all",       label: "Todos"      },
                { key: "regular",   label: "Regular"    },
                { key: "irregular", label: "Irregular"  },
                { key: "pending",   label: "Pendente"   },
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  size="sm"
                  variant={filterStatus === key ? "default" : "outline"}
                  onClick={() => setFilterStatus(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Município</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status DART</TableHead>
                <TableHead>Validade Credores</TableHead>
                <TableHead>Última Verificação</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhum município encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => {
                  const isChecking = checkingIds.has(m.id);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {m.cnpj ? formatCNPJ(m.cnpj) : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={isChecking ? "checking" : m.dart_status} />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatDate(m.dart_validade)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(m.dart_verificado_em)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isChecking || isVerifyingAll}
                          onClick={() => verificarUm(m)}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${isChecking ? "animate-spin" : ""}`} />
                          {isChecking ? "Verificando..." : "Verificar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
