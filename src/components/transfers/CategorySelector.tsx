import { useCategory, Category } from '@/contexts/CategoryContext';

const CATEGORIES = [
  { key: 'todos' as Category, label: 'Todos' },
  { key: 'obras' as Category, label: 'Obras turísticas' },
  { key: 'eventos' as Category, label: 'Eventos' },
  { key: 'promo' as Category, label: 'Promoção turística' },
];

export function CategorySelector() {
  const { category, setCategory } = useCategory();

  return (
    <div 
      className="rounded-xl p-1 flex gap-1"
      style={{
        backgroundColor: 'var(--transfers-surface)',
        border: '1px solid var(--transfers-border)',
      }}
    >
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          onClick={() => setCategory(cat.key)}
          className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 flex items-center gap-2"
          style={{
            backgroundColor: category === cat.key ? `var(--transfers-color-${cat.key})` : 'transparent',
            color: category === cat.key ? 'white' : 'var(--transfers-text-secondary)',
            boxShadow: category === cat.key ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (category !== cat.key) {
              e.currentTarget.style.backgroundColor = 'var(--transfers-surface-alt)';
            }
          }}
          onMouseLeave={(e) => {
            if (category !== cat.key) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: `var(--transfers-color-${cat.key})` }}
          />
          {cat.label}
        </button>
      ))}
    </div>
  );
}