import { useState } from 'react';
import { ArrowDown, ArrowRight, Building2, Check, CircleHelp, FileText, Hammer, PartyPopper, ShieldAlert, Sparkles } from 'lucide-react';

type TransferId = 'convenio' | 'simplificado' | 'fomento' | 'patrocinio';
type Modality = 'obras' | 'eventos';
type SimplifiedStep = { actor: string; title: string; details: string[]; municipality?: boolean; decision?: boolean };

const transfers: { id: TransferId; name: string; description: string; icon: typeof Building2; modalities: Modality[] }[] = [
  { id: 'convenio', name: 'Convênio', description: 'Repasse por convênio', icon: FileText, modalities: ['obras', 'eventos'] },
  { id: 'simplificado', name: 'Convênio Simplificado', description: 'Procedimento simplificado', icon: Sparkles, modalities: ['obras', 'eventos'] },
  { id: 'fomento', name: 'Termo de Fomento', description: 'Parceria por termo de fomento', icon: Building2, modalities: ['obras', 'eventos'] },
  { id: 'patrocinio', name: 'Patrocínio', description: 'Repasse para eventos', icon: PartyPopper, modalities: ['eventos'] },
];

const simplifiedWorks: SimplifiedStep[] = [
  { actor: 'GEINFRA', title: 'Análise e diligências', details: ['Analisa o checklist do processo.', 'Envia diligências por ofício, quando necessário.', 'Emite o parecer técnico e encaminha à GEAFIN.'], municipality: true },
  { actor: 'GEAFIN', title: 'Dados orçamentários', details: ['Informa os dados orçamentários.', 'Devolve à GEINFRA com a dotação orçamentária.', 'Encaminha o processo à GECON.'] },
  { actor: 'GECON', title: 'Minuta do convênio', details: ['Elabora a minuta do convênio.', 'Devolve o processo à GEINFRA.'] },
  { actor: 'GEINFRA', title: 'Preparação para assinatura', details: ['Junta o Parecer Referencial, o Anexo I e o Anexo II.', 'Encaminha à GECON para assinatura.'] },
  { actor: 'GECON', title: 'Assinatura e publicação', details: ['Assina o convênio.', 'Publica o extrato no Diário Oficial do Estado (DOE).', 'Devolve à GEINFRA para validação do DART.'] },
  { actor: 'GEINFRA', title: 'Validação do DART e documentos', details: ['Confere se o DART está regular no portal SC Transferências.', 'Se estiver regular, encaminha à GEAFIN para pagamento.', 'Se houver pendência, comunica o município pela Tarefa Comunique-se.'], municipality: true, decision: true },
  { actor: 'GEAFIN', title: 'Pagamento', details: ['Emite a nota de empenho.', 'Faz a liquidação da despesa.', 'Emite a ordem bancária e devolve à GEINFRA.'] },
  { actor: 'GEINFRA', title: 'Prestação de contas', details: ['Abre a tarefa de Prestação de Contas para SETUR/DIAF/GEAPC.', 'Encaminha o processo à GEAPC para análise.'] },
];

const actorTone: Record<string, string> = {
  GEINFRA: 'bg-teal-700 text-white dark:bg-teal-800',
  GEAFIN: 'bg-blue-700 text-white dark:bg-blue-800',
  GECON: 'bg-violet-700 text-white dark:bg-violet-800',
};

function InPreparation({ transfer, modality }: { transfer: string; modality: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center sm:px-12">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-muted-foreground shadow-sm">
        <CircleHelp className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Fluxograma em elaboração</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        O fluxo de {modality.toLowerCase()} para {transfer} será publicado aqui quando estiver disponível.
      </p>
    </div>
  );
}

function SimplifiedWorksFlow() {
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div>
        <div className="mb-6 rounded-xl border border-border bg-muted/30 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary"><Building2 className="h-4 w-4" /></span>
            Antes da tramitação
          </div>
          <div className="grid gap-4 text-sm leading-6 text-muted-foreground sm:grid-cols-3">
            <p>O processo pode começar na Casa Civil (SCC/CS), no Gabinete do Secretário (SETUR/GABS) ou diretamente na GEINFRA.</p>
            <p>O direcionamento do recurso é publicado no DOE por Portaria Conjunta da Casa Civil.</p>
            <p>Ao receber o processo, registre-o no Portal da SETUR, pelo site ou widget.</p>
          </div>
        </div>

        <ol className="relative space-y-4 before:absolute before:bottom-8 before:left-[19px] before:top-8 before:w-px before:bg-border sm:space-y-5">
          {simplifiedWorks.map((step, index) => (
            <li key={step.title} className="relative pl-12 sm:pl-14">
              <span className="absolute left-0 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-background bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                {index + 1}
              </span>
              <article className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-semibold tracking-tight sm:text-lg">{step.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {step.municipality && <span className="rounded-md bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-800 dark:text-orange-300">Participação do município</span>}
                    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${actorTone[step.actor]}`}>{step.actor}</span>
                  </div>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {step.details.map((detail) => (
                    <li key={detail} className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
                {step.decision && (
                  <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-emerald-500/10 px-3 py-2.5 text-sm leading-5 text-emerald-800 dark:text-emerald-300"><strong>Regular:</strong> segue para pagamento na GEAFIN.</div>
                    <div className="rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm leading-5 text-amber-900 dark:text-amber-300"><strong>Com pendência:</strong> comunicar o município pela Tarefa Comunique-se.</div>
                  </div>
                )}
              </article>
              {index < simplifiedWorks.length - 1 && <ArrowDown className="absolute -bottom-4 left-[13px] z-10 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <section className="rounded-xl border border-teal-700/20 bg-teal-700/[0.04] p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><ShieldAlert className="h-4 w-4 text-teal-700 dark:text-teal-400" /> Organize as diligências</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Durante a análise documental, mantenha o processo na caixa SETUR/GEINFRA/DLG para deixar as tarefas pendentes visíveis e a caixa principal organizada.</p>
        </section>
        <section className="rounded-xl border border-orange-500/25 bg-orange-500/[0.05] p-5">
          <h3 className="text-sm font-semibold">Fale com o município</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">A comunicação oficial e o envio dos documentos solicitados nas diligências acontecem exclusivamente pela Tarefa Comunique-se.</p>
        </section>
        <section className="rounded-xl border border-border bg-muted/30 p-5">
          <h3 className="text-sm font-semibold">Documentos para aprovação do pagamento</h3>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-5 text-muted-foreground">
            <li>DART regular no portal SC Transferências.</li>
            <li>Matrícula atualizada do imóvel, se tiverem passado mais de 30 dias.</li>
            <li>Extrato da contrapartida na conta do convênio, quando aplicável.</li>
            <li>Ordem de serviço com data posterior à assinatura do convênio.</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

export default function Flowchart() {
  const [activeTransfer, setActiveTransfer] = useState<TransferId>('simplificado');
  const transfer = transfers.find((item) => item.id === activeTransfer)!;
  const [activeModality, setActiveModality] = useState<Modality>(transfer.modalities[0]);
  const currentModality = transfer.modalities.includes(activeModality) ? activeModality : transfer.modalities[0];
  const hasDetailedFlow = activeTransfer === 'simplificado' && currentModality === 'obras';

  const selectTransfer = (id: TransferId) => {
    setActiveTransfer(id);
    setActiveModality(transfers.find((item) => item.id === id)!.modalities[0]);
  };

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-8 px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-3xl">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-xs font-medium text-primary">
          <Hammer className="h-3.5 w-3.5" aria-hidden="true" /> Repasses estaduais
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Fluxos de repasse</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Consulte as etapas e responsabilidades de cada modalidade de repasse para obras, infraestrutura turística e eventos.
        </p>
      </header>

      <section aria-label="Tipo de repasse">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {transfers.map((item) => {
            const Icon = item.icon;
            const selected = item.id === activeTransfer;
            return (
              <button key={item.id} type="button" onClick={() => selectTransfer(item.id)} aria-pressed={selected}
                className={`group flex min-h-[86px] items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-4 ${selected ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40'}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-white/15' : 'bg-muted text-primary'}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span className="min-w-0"><span className="block text-sm font-semibold leading-5">{item.name}</span><span className={`mt-1 block text-xs ${selected ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>{item.description}</span></span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-5 border-b border-border px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tipo de repasse</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{transfer.name}</h2>
          </div>
          <div role="group" aria-label="Modalidade" className="flex w-full rounded-lg bg-muted p-1 sm:w-auto">
            {transfer.modalities.map((modality) => {
              const selected = modality === currentModality;
              const label = modality === 'obras' ? 'Obras e infraestrutura' : 'Eventos';
              return (
                <button key={modality} type="button" aria-pressed={selected} onClick={() => setActiveModality(modality)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none sm:px-4 ${selected ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{transfer.name} · {currentModality === 'obras' ? 'Obras e infraestrutura turística' : 'Eventos'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{hasDetailedFlow ? 'Do recebimento do processo ao início da prestação de contas' : 'Etapas do processo de repasse'}</p>
            </div>
            {hasDetailedFlow && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300"><Check className="h-3.5 w-3.5" /> Fluxo disponível</span>}
          </div>
          {hasDetailedFlow ? <SimplifiedWorksFlow /> : <InPreparation transfer={transfer.name} modality={currentModality === 'obras' ? 'Obras e infraestrutura turística' : 'Eventos'} />}
        </div>
      </section>

      <footer className="flex items-start gap-3 px-1 text-xs leading-5 text-muted-foreground">
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>Os fluxogramas orientam a tramitação. Consulte as normas vigentes e o processo para confirmar documentos e encaminhamentos aplicáveis ao caso.</p>
      </footer>
    </main>
  );
}
