import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import {
  AlertCircle,
  BarChart3,
  FileText,
  MapPin,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportCard } from '@/components/reports/ReportCard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  generateReport,
  REPORT_FIELD_LABELS,
  sanitizeReportRequest,
  type ReportField,
  type ReportFilters,
  type ReportResult,
  type ReportSummary,
  type ReportType,
  type VigenciaFilter,
} from '@/lib/reportApi';

const DEFAULT_FIELDS: Record<ReportType, ReportField[]> = {
  executive: ['status', 'total_portaria_value', 'total_paid', 'balance'],
  processes: ['process_number', 'object', 'municipality', 'status', 'total_portaria_value', 'vigencia_date', 'regional_nucleus', 'region'],
  financial: ['process_number', 'municipality', 'total_concedente_value', 'total_paid', 'balance', 'total_portaria_value', 'total_proponente_value', 'licitado_value', 'parcel_count', 'paid_parcel_count'],
  expiring: ['process_number', 'object', 'municipality', 'vigencia_date', 'vigencia_status', 'status', 'regional_nucleus'],
  municipality: ['process_number', 'object', 'status', 'total_portaria_value', 'total_paid', 'balance', 'vigencia_date', 'regional_nucleus', 'region'],
  custom: ['process_number', 'object', 'municipality', 'status', 'total_portaria_value'],
};

const REPORTS: Array<{ type: ReportType; title: string; description: string }> = [
  { type: 'executive', title: 'Relatório Executivo Geral', description: 'Visão geral de processos, valores, municípios, núcleos e distribuição por status.' },
  { type: 'processes', title: 'Carteira de Processos e Projetos', description: 'Carteira detalhada com processos, objetos, responsáveis, valores e prazos.' },
  { type: 'financial', title: 'Relatório Financeiro', description: 'Valores concedidos, pagos, saldos, parcelas e composição financeira.' },
  { type: 'expiring', title: 'Vigências e Alertas', description: 'Processos vencidos, próximos do vencimento e sem prazo informado.' },
  { type: 'municipality', title: 'Relatório por Município', description: 'Detalhamento dos processos e valores por município, região e núcleo.' },
];

const FALLBACK_STATUSES = ['Criado', 'Em Análise', 'Aprovado', 'Em Execução', 'Finalizado', 'Cancelado'];
const CURRENCY_FIELDS = new Set<ReportField>([
  'total_portaria_value',
  'total_concedente_value',
  'total_proponente_value',
  'licitado_value',
  'total_paid',
  'balance',
]);
const DATE_FIELDS = new Set<ReportField>(['created_at', 'vigencia_date']);

type CardState = {
  status: 'available' | 'processing' | 'error';
  result?: ReportResult;
  lastGenerated?: string;
};

function formatCurrency(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value ?? '');
  return `R$ ${numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatValue(value: unknown, field: ReportField) {
  if (value === null || value === undefined || value === '') return '';
  if (CURRENCY_FIELDS.has(field)) return formatCurrency(value);
  if (DATE_FIELDS.has(field)) {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('pt-BR');
  }
  if (field === 'contract_signed') return value === true ? 'Sim' : 'Não';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function filtersDescription(filters: Record<string, unknown>) {
  const labels: Record<string, string> = {
    municipality_ids: 'Municípios',
    regional_nucleus_id: 'Núcleo regional',
    region_name: 'Região',
    status_names: 'Status',
    date_from: 'Data inicial',
    date_to: 'Data final',
    vigencia: 'Vigência',
    signed_contract_only: 'Contrato assinado',
    min_proponent_value: 'Valor mínimo do proponente',
  };
  const entries = Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) return 'Sem filtros adicionais';
  return entries.map(([key, value]) => `${labels[key] ?? key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`).join(' • ');
}

function translatedRows(result: ReportResult) {
  return result.rows.map((row) => Object.fromEntries(
    result.fields.map((field) => [REPORT_FIELD_LABELS[field], formatValue(row[field], field)]),
  ));
}

export default function Reports() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [municipality, setMunicipality] = useState<string[]>([]);
  const [nucleus, setNucleus] = useState('all');
  const [region, setRegion] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [proponentValue, setProponentValue] = useState('');
  const [signedContractsOnly, setSignedContractsOnly] = useState(false);
  const [vigenciaStatus, setVigenciaStatus] = useState<VigenciaFilter>('all');
  const [sortField, setSortField] = useState<ReportField>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedFields, setSelectedFields] = useState<ReportField[]>(DEFAULT_FIELDS.custom);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [cardStates, setCardStates] = useState<Record<ReportType, CardState>>({});
  const [activeResult, setActiveResult] = useState<ReportResult | null>(null);
  const [activeTitle, setActiveTitle] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data: allMunicipalities = [] } = useQuery({
    queryKey: ['report-municipalities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('municipalities').select('id, name').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: allNuclei = [] } = useQuery({
    queryKey: ['report-nuclei'],
    queryFn: async () => {
      const { data, error } = await supabase.from('regional_nuclei').select('id, name').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: allRegions = [] } = useQuery({
    queryKey: ['report-regions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('regioes').select('id, nome').order('nome');
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: statusRows = [] } = useQuery({
    queryKey: ['report-statuses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('status_processos').select('id, nome').order('nome');
      if (error) throw error;
      return data ?? [];
    },
  });

  const statusOptions = statusRows.length ? statusRows.map((item) => item.nome) : FALLBACK_STATUSES;
  const currentFilters = useMemo<ReportFilters>(() => sanitizeReportRequest({
    report_type: 'executive',
    filters: {
      municipality_ids: municipality.map(Number),
      regional_nucleus_id: nucleus === 'all' ? undefined : Number(nucleus),
      region_name: region === 'all' ? undefined : region,
      status_names: statusFilter,
      date_from: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      date_to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      vigencia: vigenciaStatus,
      signed_contract_only: signedContractsOnly,
      min_proponent_value: proponentValue ? Number(proponentValue) : undefined,
    },
  }).filters ?? {}, [
    dateRange.from,
    dateRange.to,
    municipality,
    nucleus,
    proponentValue,
    region,
    signedContractsOnly,
    statusFilter,
    vigenciaStatus,
  ]);

  const executiveQuery = useQuery({
    queryKey: ['report-executive-summary', JSON.stringify(currentFilters), sortField, sortDirection],
    queryFn: () => generateReport({
      report_type: 'executive',
      format: 'json',
      filters: currentFilters,
      fields: DEFAULT_FIELDS.executive,
      sort: { field: sortField, direction: sortDirection },
    }),
    staleTime: 30_000,
  });

  useEffect(() => {
    setPage(1);
  }, [activeResult]);

  const summary: ReportSummary = executiveQuery.data?.summary ?? {};
  const selectedMunicipalityLabel = municipality.length === 0
    ? 'Todos os municípios'
    : municipality.length === 1
      ? allMunicipalities.find((item) => String(item.id) === municipality[0])?.name ?? '1 município selecionado'
      : `${municipality.length} municípios selecionados`;

  const toggleValue = (values: string[], value: string, setter: (next: string[]) => void) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  async function runReport(reportType: ReportType, fields = DEFAULT_FIELDS[reportType]) {
    if (!fields.length) {
      toast({ title: 'Selecione pelo menos um campo', description: 'Escolha os campos que deseja incluir no relatório.', variant: 'destructive' });
      return;
    }
    setCardStates((previous) => ({ ...previous, [reportType]: { ...previous[reportType], status: 'processing' } }));
    try {
      const result = await generateReport({
        report_type: reportType,
        format: 'json',
        filters: currentFilters,
        fields,
        sort: { field: sortField, direction: sortDirection },
      });
      const title = reportType === 'custom'
        ? 'Relatório Personalizado'
        : REPORTS.find((item) => item.type === reportType)?.title ?? 'Relatório';
      setCardStates((previous) => ({
        ...previous,
        [reportType]: { status: 'available', result, lastGenerated: result.generated_at },
      }));
      setActiveResult(result);
      setActiveTitle(title);
      if (result.row_count === 0) {
        toast({ title: 'Nenhum registro encontrado', description: 'Nenhum registro foi encontrado com os filtros selecionados.' });
      } else {
        toast({ title: 'Relatório gerado com sucesso', description: `${result.row_count} registro(s) disponível(is) para visualização e download.` });
      }
    } catch {
      setCardStates((previous) => ({ ...previous, [reportType]: { status: 'error' } }));
      toast({ title: 'Não foi possível gerar o relatório', description: 'Tente novamente em alguns instantes.', variant: 'destructive' });
    }
  }

  function exportResult(result: ReportResult, fileFormat: 'PDF' | 'XLSX' | 'CSV', title: string) {
    if (!result.rows.length) {
      toast({ title: 'Nenhum dado para exportar', description: 'Gere um relatório com registros antes de baixar um arquivo.', variant: 'destructive' });
      return;
    }
    const safeName = `${slugify(title)}-${new Date(result.generated_at).toISOString().slice(0, 10)}`;
    const rows = translatedRows(result);
    const headers = result.fields.map((field) => REPORT_FIELD_LABELS[field]);

    if (fileFormat === 'CSV') {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...result.rows.map((row) => result.fields.map((field) => formatValue(row[field], field)))]);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      saveAs(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }), `${safeName}.csv`);
    } else if (fileFormat === 'XLSX') {
      const workbook = XLSX.utils.book_new();
      const summarySheet = XLSX.utils.aoa_to_sheet([
        ['Relatório', title],
        ['Gerado em', new Date(result.generated_at).toLocaleString('pt-BR')],
        ['Quantidade de registros', result.row_count],
        ['Filtros aplicados', filtersDescription(result.filters_applied)],
      ]);
      const detailsSheet = XLSX.utils.aoa_to_sheet([headers, ...result.rows.map((row) => result.fields.map((field) => formatValue(row[field], field)))]);
      if (result.fields.length) {
        (detailsSheet as any)['!autofilter'] = {
          ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: result.rows.length, c: result.fields.length - 1 } }),
        };
        (detailsSheet as any)['!freeze'] = { xSplit: 0, ySplit: 1 };
      }
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');
      XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Detalhes');
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${safeName}.xlsx`);
    } else {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFontSize(16);
      doc.text(title, 14, 15);
      doc.setFontSize(9);
      doc.text(`Gerado em: ${new Date(result.generated_at).toLocaleString('pt-BR')}`, 14, 22);
      doc.text(`Registros: ${result.row_count}`, 14, 28);
      doc.text(`Filtros: ${filtersDescription(result.filters_applied)}`, 14, 34, { maxWidth: 265 });
      autoTable(doc, {
        startY: 40,
        head: [headers],
        body: result.rows.map((row) => result.fields.map((field) => formatValue(row[field], field))),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [30, 64, 175] },
      });
      doc.save(`${safeName}.pdf`);
    }
    toast({ title: 'Download iniciado', description: `Arquivo ${fileFormat} gerado com sucesso.` });
  }

  const activeRows = activeResult?.rows ?? [];
  const pageCount = Math.max(1, Math.ceil(activeRows.length / pageSize));
  const visibleRows = activeRows.slice((page - 1) * pageSize, page * pageSize);
  const statusBreakdown = Object.entries(summary.by_status ?? {});

  return (
    <div className="space-y-6" role="main" aria-label="Relatórios e exportações">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/">Início</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Relatórios e Exportações</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios e Exportações</h1>
        <p className="text-muted-foreground">
          Gere relatórios oficiais com dados atualizados do portal, aplique filtros e exporte os resultados em PDF, XLSX ou CSV.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Filtros do relatório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data inicial</label>
              <DatePicker selected={dateRange.from} onSelect={(date) => setDateRange((previous) => ({ ...previous, from: date }))} placeholderText="Data inicial" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data final</label>
              <DatePicker selected={dateRange.to} onSelect={(date) => setDateRange((previous) => ({ ...previous, to: date }))} placeholderText="Data final" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Município</label>
              <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><span className="truncate">{selectedMunicipalityLabel}</span></Button></PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
                  <div className="max-h-72 space-y-1 overflow-y-auto">
                    {allMunicipalities.map((item) => (
                      <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent">
                        <Checkbox checked={municipality.includes(String(item.id))} onCheckedChange={() => toggleValue(municipality, String(item.id), setMunicipality)} />
                        {item.name}
                      </label>
                    ))}
                    {!allMunicipalities.length && <p className="p-2 text-sm text-muted-foreground">Nenhum município disponível.</p>}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Núcleo regional</label>
              <Select value={nucleus} onValueChange={setNucleus}>
                <SelectTrigger><SelectValue placeholder="Todos os núcleos" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos os núcleos</SelectItem>{allNuclei.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Região</label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger><SelectValue placeholder="Todas as regiões" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todas as regiões</SelectItem>{allRegions.map((item) => <SelectItem key={item.id} value={item.nome}>{item.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status do processo</label>
              <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal">{statusFilter.length ? `${statusFilter.length} status selecionado(s)` : 'Todos os status'}</Button></PopoverTrigger>
                <PopoverContent className="w-64 p-2">
                  {statusOptions.map((status) => <label key={status} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"><Checkbox checked={statusFilter.includes(status)} onCheckedChange={() => toggleValue(statusFilter, status, setStatusFilter)} />{status}</label>)}
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label htmlFor="min-proponent-value" className="text-sm font-medium">Valor mínimo do proponente</label>
              <input id="min-proponent-value" type="number" min="0" className="input input-bordered w-full" value={proponentValue} onChange={(event) => setProponentValue(event.target.value)} placeholder="R$ 0,00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Situação da vigência</label>
              <Select value={vigenciaStatus} onValueChange={(value) => setVigenciaStatus(value as VigenciaFilter)}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="vencidos">Vencidos</SelectItem>
                  <SelectItem value="ate_7_dias">Até 7 dias</SelectItem>
                  <SelectItem value="ate_30_dias">Até 30 dias</SelectItem>
                  <SelectItem value="ate_60_dias">Até 60 dias</SelectItem>
                  <SelectItem value="ate_90_dias">Até 90 dias</SelectItem>
                  <SelectItem value="sem_prazo">Sem prazo</SelectItem>
                  <SelectItem value="concluidas">Concluídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <Checkbox checked={signedContractsOnly} onCheckedChange={(checked) => setSignedContractsOnly(checked === true)} />
              Somente contratos assinados
            </label>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ordenar por</label>
              <Select value={sortField} onValueChange={(value) => setSortField(value as ReportField)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(REPORT_FIELD_LABELS).map(([field, label]) => <SelectItem key={field} value={field}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Direção</label>
              <Select value={sortDirection} onValueChange={(value) => setSortDirection(value as 'asc' | 'desc')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="desc">Maior para menor</SelectItem><SelectItem value="asc">Menor para maior</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="indicadores-relatorio">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="indicadores-relatorio" className="text-xl font-semibold">Indicadores do relatório</h2>
          {executiveQuery.isFetching && <span className="text-sm text-muted-foreground" aria-live="polite">Atualizando indicadores...</span>}
        </div>
        {executiveQuery.isError ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />Não foi possível carregar os indicadores. Tente novamente.</span>
            <Button size="sm" variant="outline" onClick={() => executiveQuery.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Tentar novamente</Button>
          </div>
        ) : executiveQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" aria-live="polite"><div className="h-28 animate-pulse rounded-lg bg-muted" /><div className="h-28 animate-pulse rounded-lg bg-muted" /><div className="h-28 animate-pulse rounded-lg bg-muted" /><div className="h-28 animate-pulse rounded-lg bg-muted" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="flex items-center gap-3 p-6"><FileText className="h-8 w-8 text-blue-600" /><div><p className="text-2xl font-bold">{summary.process_count ?? 0}</p><p className="text-xs text-muted-foreground">Registros no relatório</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 p-6"><TrendingUp className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">{formatCurrency(summary.total_portaria_value ?? 0)}</p><p className="text-xs text-muted-foreground">Valor total da portaria</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 p-6"><Users className="h-8 w-8 text-purple-600" /><div><p className="text-2xl font-bold">{summary.municipality_count ?? 0}</p><p className="text-xs text-muted-foreground">Municípios no relatório</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 p-6"><MapPin className="h-8 w-8 text-orange-600" /><div><p className="text-2xl font-bold">{summary.regional_nucleus_count ?? 0}</p><p className="text-xs text-muted-foreground">Núcleos regionais</p></div></CardContent></Card>
          </div>
        )}
        {!executiveQuery.isLoading && !executiveQuery.isError && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total pago</p><p className="font-semibold">{formatCurrency(summary.total_paid ?? 0)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Saldo a repassar</p><p className="font-semibold">{formatCurrency(summary.balance ?? 0)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Processos vencidos</p><p className="font-semibold">{summary.expired_count ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Próximos do vencimento</p><p className="font-semibold">{summary.expiring_30_days_count ?? 0}</p></CardContent></Card>
          </div>
        )}
      </section>

      {!executiveQuery.isLoading && !executiveQuery.isError && statusBreakdown.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Distribuição por status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {statusBreakdown.map(([label, count]) => {
              const percentage = summary.process_count ? (count / summary.process_count) * 100 : 0;
              return <div key={label} className="space-y-1"><div className="flex justify-between text-sm"><span>{label}</span><span className="font-medium">{count} ({percentage.toFixed(1)}%)</span></div><div className="h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${Math.min(100, percentage)}%` }} /></div></div>;
            })}
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="relatorios-predefinidos">
        <h2 id="relatorios-predefinidos" className="mb-4 text-xl font-semibold">Relatórios predefinidos</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {REPORTS.map((report) => {
            const state = cardStates[report.type] ?? { status: 'available' as const };
            const result = state.result;
            return <ReportCard
              key={report.type}
              {...report}
              status={state.status}
              lastGenerated={state.lastGenerated}
              onGenerate={() => void runReport(report.type)}
              onRetry={() => void runReport(report.type)}
              onView={result ? () => { setActiveResult(result); setActiveTitle(report.title); } : undefined}
              onDownloadPDF={result?.row_count ? () => exportResult(result, 'PDF', report.title) : undefined}
              onDownloadExcel={result?.row_count ? () => exportResult(result, 'XLSX', report.title) : undefined}
              onDownloadCSV={result?.row_count ? () => exportResult(result, 'CSV', report.title) : undefined}
            />;
          })}
        </div>
      </section>

      <section aria-labelledby="relatorio-personalizado">
        <Card>
          <CardHeader><CardTitle id="relatorio-personalizado">Relatório personalizado</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">Escolha os campos que deseja incluir e gere um relatório usando os filtros atuais.</p>
            <div className="flex flex-wrap gap-2">
              <Dialog open={showFieldSelector} onOpenChange={setShowFieldSelector}>
                <DialogTrigger asChild><Button variant="outline">Selecionar campos ({selectedFields.length})</Button></DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Campos do relatório personalizado</DialogTitle></DialogHeader>
                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {Object.entries(REPORT_FIELD_LABELS).map(([field, label]) => <label key={field} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"><Checkbox checked={selectedFields.includes(field as ReportField)} onCheckedChange={(checked) => setSelectedFields(checked ? [...selectedFields, field as ReportField] : selectedFields.filter((item) => item !== field))} />{label}</label>)}
                  </div>
                  <Button onClick={() => setShowFieldSelector(false)}>Concluir seleção</Button>
                </DialogContent>
              </Dialog>
              <Button onClick={() => void runReport('custom', selectedFields)} disabled={cardStates.custom?.status === 'processing'}>
                {cardStates.custom?.status === 'processing' && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Gerar personalizado
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {activeResult && (
        <section aria-labelledby="resultado-relatorio">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle id="resultado-relatorio">{activeTitle}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
                    Gerado em {new Date(activeResult.generated_at).toLocaleString('pt-BR')} • {activeResult.row_count} registro(s)
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Filtros: {filtersDescription(activeResult.filters_applied)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => exportResult(activeResult, 'PDF', activeTitle)} disabled={!activeResult.row_count}>PDF</Button>
                  <Button size="sm" variant="outline" onClick={() => exportResult(activeResult, 'XLSX', activeTitle)} disabled={!activeResult.row_count}>XLSX</Button>
                  <Button size="sm" variant="outline" onClick={() => exportResult(activeResult, 'CSV', activeTitle)} disabled={!activeResult.row_count}>CSV</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!activeResult.row_count ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum registro foi encontrado com os filtros selecionados.</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow>{activeResult.fields.map((field) => <TableHead key={field}>{REPORT_FIELD_LABELS[field]}</TableHead>)}</TableRow></TableHeader>
                      <TableBody>{visibleRows.map((row, index) => <TableRow key={`${activeResult.report_id}-${index}`}>{activeResult.fields.map((field) => <TableCell key={field}>{formatValue(row[field], field)}</TableCell>)}</TableRow>)}</TableBody>
                    </Table>
                  </div>
                  {activeResult.row_count >= 2000 && <p className="mt-3 text-sm text-amber-700">A consulta atingiu o limite de registros. Refine os filtros para gerar um arquivo mais específico.</p>}
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <span>Exibindo {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, activeRows.length)} de {activeRows.length}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</Button>
                      <span className="self-center">Página {page} de {pageCount}</span>
                      <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Próxima</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}