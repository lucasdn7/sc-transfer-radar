import { CategorySelector } from '@/components/transfers/CategorySelector';
import { KpiCard } from '@/components/transfers/KpiCard';
import { EmptyState } from '@/components/transfers/EmptyState';
import { useCategory } from '@/contexts/CategoryContext';
import { Building2 } from 'lucide-react';

export default function TransferIndicators() {
  const { category } = useCategory();

  // Estado vazio para Promoção turística
  if (category === 'promo') {
    return (
      <div className="min-h-screen p-6 px-7 max-w-[1280px] mx-auto" style={{ backgroundColor: 'var(--transfers-bg)' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--transfers-text-primary)' }}>Indicadores</h1>
          <p className="text-sm" style={{ color: 'var(--transfers-text-muted)' }}>Análise detalhada</p>
        </div>
        <CategorySelector />
        <div className="mt-6">
          <EmptyState
            icon={<Building2 />}
            title="Ainda não há dados de promoção turística cadastrados"
            subtitle="Os indicadores aparecerão automaticamente quando os dados forem inseridos"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 px-7 max-w-[1280px] mx-auto" style={{ backgroundColor: 'var(--transfers-bg)' }}>
      {/* Título da página */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--transfers-text-primary)' }}>Indicadores</h1>
        <p className="text-sm" style={{ color: 'var(--transfers-text-muted)' }}>Análise detalhada</p>
      </div>

      {/* CategorySelector */}
      <CategorySelector />

      {/* Sub-navegação interna */}
      <div className="flex gap-2 mt-6 pb-2" style={{ borderBottom: '1px solid var(--transfers-border)' }}>
        {['Visão geral', 'Execução financeira', 'Prazos', 'Distribuição geográfica', 'Rankings'].map((item, i) => (
          <button
            key={i}
            className="text-sm px-3 py-1 rounded transition-colors hover:opacity-80"
            style={{
              backgroundColor: i === 0 ? 'var(--transfers-surface-alt)' : 'transparent',
              color: i === 0 ? 'var(--transfers-text-primary)' : 'var(--transfers-text-secondary)',
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Seções placeholder */}
      <div className="space-y-6 mt-6">
        {/* Visão geral */}
        <section>
          <h3 className="text-[11px] uppercase tracking-[0.06em] mb-4" style={{ color: 'var(--transfers-text-muted)' }}>
            Visão geral
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <KpiCard
                key={i}
                label="INDICADOR"
                value="—"
                subtext="Descrição do indicador"
                accent="var(--transfers-color-todos)"
              />
            ))}
          </div>
        </section>

        {/* Execução financeira */}
        <section>
          <h3 className="text-[11px] uppercase tracking-[0.06em] mb-4" style={{ color: 'var(--transfers-text-muted)' }}>
            Execução financeira
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <KpiCard
                key={i}
                label="FINANCEIRO"
                value="—"
                subtext="Detalhes financeiros"
                accent="var(--transfers-color-todos)"
                progress={{ paid: 0, pending: 0 }}
              />
            ))}
          </div>
        </section>

        {/* Prazos */}
        <section>
          <h3 className="text-[11px] uppercase tracking-[0.06em] mb-4" style={{ color: 'var(--transfers-text-muted)' }}>
            Prazos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <KpiCard
                key={i}
                label="PRAZO"
                value="—"
                subtext="Informações de prazo"
                accent="var(--transfers-color-todos)"
              />
            ))}
          </div>
        </section>

        {/* Distribuição geográfica */}
        <section>
          <h3 className="text-[11px] uppercase tracking-[0.06em] mb-4" style={{ color: 'var(--transfers-text-muted)' }}>
            Distribuição geográfica
          </h3>
          <div className="rounded-3xl p-4" style={{ backgroundColor: 'var(--transfers-surface)', border: '1px solid var(--transfers-border)' }}>
            <div className="text-center py-8" style={{ color: 'var(--transfers-text-muted)' }}>
              Tabela placeholder de distribuição geográfica
            </div>
          </div>
        </section>

        {/* Rankings */}
        <section>
          <h3 className="text-[11px] uppercase tracking-[0.06em] mb-4" style={{ color: 'var(--transfers-text-muted)' }}>
            Rankings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-3xl p-4"
                style={{ backgroundColor: 'var(--transfers-surface)', border: '1px solid var(--transfers-border)' }}
              >
                <div className="text-center py-4" style={{ color: 'var(--transfers-text-muted)' }}>
                  Ranking placeholder {i}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}