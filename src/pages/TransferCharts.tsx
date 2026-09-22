import { CategorySelector } from '@/components/transfers/CategorySelector';
import { EmptyState } from '@/components/transfers/EmptyState';
import { useCategory } from '@/contexts/CategoryContext';
import { Building2, BarChart3 } from 'lucide-react';

export default function TransferCharts() {
  const { category } = useCategory();

  // Estado vazio para Promoção turística
  if (category === 'promo') {
    return (
      <div className="min-h-screen p-6 px-7 max-w-[1280px] mx-auto" style={{ backgroundColor: 'var(--transfers-bg)' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--transfers-text-primary)' }}>Gráficos</h1>
          <p className="text-sm" style={{ color: 'var(--transfers-text-muted)' }}>Visualizações ricas</p>
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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--transfers-text-primary)' }}>Gráficos</h1>
        <p className="text-sm" style={{ color: 'var(--transfers-text-muted)' }}>Visualizações ricas</p>
      </div>

      {/* CategorySelector */}
      <CategorySelector />

      {/* Contador de gráficos */}
      <div className="flex items-center gap-2 mt-6 text-sm" style={{ color: 'var(--transfers-text-muted)' }}>
        <BarChart3 className="w-4 h-4" />
        <span>20 visualizações disponíveis</span>
      </div>

      {/* Grid de gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((i) => (
          <div
            key={i}
            className="rounded-3xl h-[300px] flex flex-col"
            style={{ backgroundColor: 'var(--transfers-surface)', border: '1px solid var(--transfers-border)' }}
          >
            <div className="p-4" style={{ borderBottom: '1px solid var(--transfers-border)' }}>
              <h4 className="text-sm font-medium" style={{ color: 'var(--transfers-text-primary)' }}>
                Gráfico {i}
              </h4>
            </div>
            <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--transfers-surface-alt)' }}>
              <span className="text-sm" style={{ color: 'var(--transfers-text-muted)' }}>Placeholder de gráfico</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}