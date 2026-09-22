import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <div 
      className="rounded-3xl p-12 px-6 text-center"
      style={{
        backgroundColor: 'var(--transfers-surface)',
        border: '1px dashed var(--transfers-border-strong)',
      }}
    >
      <div className="mb-4 flex justify-center" style={{ fontSize: '48px', opacity: 0.25, color: 'var(--transfers-text-muted)' }}>
        {icon}
      </div>
      <div className="text-[15px] mb-2" style={{ color: 'var(--transfers-text-secondary)' }}>
        {title}
      </div>
      <div className="text-[13px]" style={{ color: 'var(--transfers-text-muted)' }}>
        {subtitle}
      </div>
    </div>
  );
}