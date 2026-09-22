import { CategorySelector } from '@/components/transfers/CategorySelector';
import { KpiCard } from '@/components/transfers/KpiCard';
import { AlertBanner } from '@/components/transfers/AlertBanner';
import { EmptyState } from '@/components/transfers/EmptyState';
import { useCategory } from '@/contexts/CategoryContext';
import { AlertTriangle, Calendar, TrendingUp, Building2 } from 'lucide-react';

export default function TransferDashboard() {
  const { category } = useCategory();

  // Estado vazio para Promoção turística
  if (category === 'promo') {
    return (
      <div className="min-h-screen p-6 px-7 max-w-[1280px] mx-auto" style={{ backgroundColor: 'var(--transfers-bg)' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--transfers-text-primary)' }}>Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--transfers-text-muted)' }}>Visão executiva geral</p>
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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--transfers-text-primary)' }}>Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--transfers-text-muted)' }}>Visão executiva geral</p>
      </div>

      {/* CategorySelector */}
      <CategorySelector />

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <KpiCard
            key={i}
            label="MÉTRICA PLACEHOLDER"
            value="—"
            subtext="Subtexto complementar"
            accent="var(--transfers-color-todos)"
          />
        ))}
      </div>

      {/* Seção de alertas */}
      <div className="space-y-2 mt-6">
        <AlertBanner
          icon={<AlertTriangle />}
          message="53 processos com vigência vencida"
          linkText="Ver"
          onLinkClick={() => {}}
          variant="danger"
        />
        <AlertBanner
          icon={<Calendar />}
          message="12 processos vencem nos próximos 7 dias"
          linkText="Ver"
          onLinkClick={() => {}}
          variant="warning"
        />
        <AlertBanner
          icon={<TrendingUp />}
          message="Novos repasses aprovados esta semana"
          linkText="Ver"
          onLinkClick={() => {}}
          variant="info"
        />
        <AlertBanner
          icon={<Building2 />}
          message="3 municípios aguardando documentação"
          linkText="Ver"
          onLinkClick={() => {}}
          variant="info"
        />
      </div>

      {/* Grid de gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-3xl h-[220px] flex items-center justify-center"
            style={{ backgroundColor: 'var(--transfers-surface-alt)' }}
          >
            <span className="text-sm" style={{ color: 'var(--transfers-text-muted)' }}>Gráfico placeholder</span>
          </div>
        ))}
      </div>

      {/* Tabela de regiões */}
      <div className="mt-6 rounded-3xl overflow-hidden" style={{ backgroundColor: 'var(--transfers-surface)', border: '1px solid var(--transfers-border)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--transfers-border)' }}>
          <h3 className="text-[11px] uppercase tracking-[0.06em]" style={{ color: 'var(--transfers-text-muted)' }}>
            Distribuição por Região
          </h3>
        </div>
        <div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex justify-between items-center" style={{ borderBottom: i < 5 ? '1px solid var(--transfers-border)' : 'none' }}>
              <span className="text-sm" style={{ color: 'var(--transfers-text-secondary)' }}>Região {i}</span>
              <span className="text-sm" style={{ color: 'var(--transfers-text-primary)' }}>—</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}