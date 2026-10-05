import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CHECKLISTS, LEGAL_UPDATE_NOTE, type ChecklistDefinition } from '@/data/checklists';
import { Check, ChevronDown, ClipboardCheck, Download, ExternalLink, FileCheck2, FileText, Info, Scale, Search } from 'lucide-react';

type Progress = Record<string, string[]>;
const STORAGE_KEY = 'transfer-radar-checklist-progress-v1';
const CURRENT_LAW_LINK = 'https://leis.alesc.sc.gov.br/ato-normativo/22814';

function loadProgress(): Progress {
  if (typeof window === 'undefined') return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return stored && typeof stored === 'object' ? stored : {};
  } catch {
    return {};
  }
}

function checklistTotal(checklist: ChecklistDefinition) {
  return checklist.groups.reduce((sum, group) => sum + group.items.length, 0);
}

export default function Checklist() {
  const [selectedId, setSelectedId] = useState<ChecklistDefinition['id']>('fomento');
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [search, setSearch] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const selected = CHECKLISTS.find(checklist => checklist.id === selectedId) || CHECKLISTS[0];
  const completedIds = progress[selected.id] || [];
  const totalItems = checklistTotal(selected);
  const completion = totalItems ? Math.round((completedIds.length / totalItems) * 100) : 0;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // O checklist continua utilizável nesta sessão mesmo se o navegador bloquear o armazenamento local.
    }
  }, [progress]);

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return selected.groups.map(group => ({
      ...group,
      items: group.items.filter(item => !query || [
        item.title,
        item.guide,
        item.condition || '',
        ...item.basis.map(basis => basis.reference),
      ].some(value => value.toLocaleLowerCase('pt-BR').includes(query))),
    })).filter(group => group.items.length > 0);
  }, [selected, search]);

  const toggleItem = (itemId: string, checked: boolean) => {
    setProgress(current => {
      const previous = current[selected.id] || [];
      const next = checked ? [...new Set([...previous, itemId])] : previous.filter(id => id !== itemId);
      return { ...current, [selected.id]: next };
    });
  };

  const changeChecklist = (id: ChecklistDefinition['id']) => {
    setSelectedId(id);
    setExpandedItem(null);
    setSearch('');
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 pb-10" aria-label="Checklists de transferências">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/">Início</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Apoio</BreadcrumbPage></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Checklist</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="space-y-3 border-b border-border pb-6">
        <div className="flex items-center gap-3 text-primary"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><ClipboardCheck className="h-5 w-5" /></span><span className="text-sm font-medium">Apoio à instrução de processos</span></div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Checklist</h1>
        <p className="max-w-3xl text-muted-foreground">Consulte os itens por modalidade, confira a base legal e marque o que já foi verificado. Selecione um item para ver o que conferir.</p>
      </header>

      <section aria-label="Modalidade de transferência" className="grid gap-3 md:grid-cols-3">
        {CHECKLISTS.map(checklist => {
          const total = checklistTotal(checklist);
          const checked = progress[checklist.id]?.length || 0;
          const active = selected.id === checklist.id;
          return <button type="button" key={checklist.id} onClick={() => changeChecklist(checklist.id)} aria-pressed={active} className={`rounded-xl border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40'}`}>
            <span className="flex items-center justify-between gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}><FileCheck2 className="h-4 w-4" /></span>{active && <Badge variant="outline" className="border-primary/30 text-primary">Selecionado</Badge>}</span>
            <span className="mt-4 block text-base font-semibold">{checklist.title}</span>
            <span className="mt-1 block min-h-10 text-sm leading-relaxed text-muted-foreground">{checklist.description}</span>
            <span className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground"><span>{total} itens</span><span>{checked} conferidos</span></span>
          </button>;
        })}
      </section>

      <Card className="border-primary/15 bg-primary/[0.025]">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="flex items-start gap-3"><span className="mt-0.5 text-primary"><Info className="h-5 w-5" /></span><div><p className="font-medium">Referências legais</p><p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{LEGAL_UPDATE_NOTE}</p><a href={CURRENT_LAW_LINK} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">Consultar Lei SC nº 19.270/2025<ExternalLink className="h-3.5 w-3.5" /></a></div></div>
          <div className="w-full shrink-0 md:w-56" aria-label={`${completion}% dos itens conferidos`}><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">Progresso de {selected.shortTitle}</span><span className="font-semibold tabular-nums">{completion}%</span></div><div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion} className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${completion}%` }} /></div><p className="mt-2 text-right text-xs text-muted-foreground">{completedIds.length} de {totalItems} itens</p></div>
        </CardContent>
      </Card>

      {selected.id === 'simplificado' && <section aria-labelledby="manuals-heading" className="space-y-4">
        <div><h2 id="manuals-heading" className="text-xl font-semibold tracking-tight">Manuais de boas práticas</h2><p className="mt-1 text-sm text-muted-foreground">Materiais de apoio para preparar os documentos do Convênio Simplificado.</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader className="pb-3"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span><div><CardTitle className="text-base">Documentos do Processo</CardTitle><CardDescription className="mt-1">O que enviar e como conferir</CardDescription></div></div></CardHeader>
            <CardContent className="flex flex-1 flex-col"><p className="text-sm leading-relaxed text-muted-foreground">Organiza os documentos em cinco categorias e explica o que apresentar no envio inicial e após a assinatura do convênio.</p><div className="mt-5 flex flex-wrap gap-2"><Button asChild><a href="/manuais/convenio-simplificado/documentos-do-processo.pdf" target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Abrir manual</a></Button><Button asChild variant="outline"><a href="/manuais/convenio-simplificado/documentos-do-processo.pdf" download><Download className="mr-2 h-4 w-4" />Baixar PDF</a></Button></div></CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader className="pb-3"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span><div><CardTitle className="text-base">Plano de Trabalho</CardTitle><CardDescription className="mt-1">Como preencher e enviar corretamente</CardDescription></div></div></CardHeader>
            <CardContent className="flex flex-1 flex-col"><p className="text-sm leading-relaxed text-muted-foreground">Resume os itens 2 a 5, indica as fontes oficiais de cada informação e orienta a conferir etapas, valores, prazos e assinatura.</p><div className="mt-5 flex flex-wrap gap-2"><Button asChild><a href="/manuais/convenio-simplificado/plano-de-trabalho.pdf" target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Abrir manual</a></Button><Button asChild variant="outline"><a href="/manuais/convenio-simplificado/plano-de-trabalho.pdf" download><Download className="mr-2 h-4 w-4" />Baixar PDF</a></Button></div></CardContent>
          </Card>
        </div>
      </section>}

      <section aria-labelledby="items-heading" className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" /><h2 id="items-heading" className="text-xl font-semibold tracking-tight">{selected.title}</h2></div><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{selected.summary}</p></div>
          <div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar item ou base legal" aria-label="Buscar item ou base legal" className="flex h-10 w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" /></div>
        </div>

        {visibleGroups.length === 0 ? <Card><CardContent className="p-8 text-center"><p className="font-medium">Nenhum item encontrado</p><p className="mt-1 text-sm text-muted-foreground">Tente outra palavra ou limpe a busca.</p><Button className="mt-4" variant="outline" onClick={() => setSearch('')}>Limpar busca</Button></CardContent></Card> : visibleGroups.map((group, groupIndex) => <Card key={group.id}>
          <CardHeader className="pb-4"><div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold tabular-nums text-muted-foreground">{groupIndex + 1}</span><div className="space-y-1"><CardTitle className="text-base">{group.title}</CardTitle><CardDescription>{group.description}</CardDescription></div><Badge variant="outline" className="ml-auto shrink-0">{group.items.filter(item => completedIds.includes(item.id)).length}/{group.items.length}</Badge></div></CardHeader>
          <CardContent className="space-y-2">
            {group.items.map(item => {
              const complete = completedIds.includes(item.id);
              const expanded = expandedItem === item.id;
              const visibleNumber = item.id.split('-').slice(1).join('.');
              return <article key={item.id} className={`rounded-lg border transition-colors ${expanded ? 'border-primary/30 bg-primary/[0.025]' : 'border-border/80 bg-card'}`}>
                <div className="flex items-start gap-3 p-3 md:p-4">
                  <Checkbox id={`check-${item.id}`} checked={complete} onCheckedChange={value => toggleItem(item.id, value === true)} aria-label={`Marcar ${item.title} como conferido`} className="mt-1" />
                  <button type="button" aria-expanded={expanded} aria-controls={`detail-${item.id}`} onClick={() => setExpandedItem(expanded ? null : item.id)} className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="min-w-8 pt-0.5 text-xs font-semibold tabular-nums text-muted-foreground">{visibleNumber}</span>
                    <span className="min-w-0 flex-1"><span className={`block text-sm font-medium leading-relaxed ${complete ? 'text-muted-foreground line-through decoration-muted-foreground/40' : ''}`}>{item.title}</span>{item.condition && <span className="mt-1.5 inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{item.condition}</span>}</span>
                    <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {expanded && <div id={`detail-${item.id}`} className="space-y-4 border-t border-border/80 px-4 py-4 pl-14 md:pl-16">
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Como preencher ou apresentar</p><p className="mt-1.5 max-w-4xl text-sm leading-relaxed">{item.guide}</p></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Base legal</p><ul className="mt-2 flex flex-col gap-2">{item.basis.map((basis, index) => <li key={`${basis.reference}-${index}`}><a href={basis.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1.5 text-sm text-primary underline-offset-4 hover:underline"><span>{basis.reference}</span><ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" /></a></li>)}</ul></div>
                  {complete && <p className="inline-flex items-center gap-1.5 text-xs font-medium text-primary"><Check className="h-3.5 w-3.5" />Item marcado como conferido</p>}
                </div>}
              </article>;
            })}
          </CardContent>
        </Card>)}
      </section>

      <p className="text-xs leading-relaxed text-muted-foreground">O andamento do checklist é salvo localmente neste navegador. As marcações não são compartilhadas entre usuários ou dispositivos.</p>
    </main>
  );
}
