import { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  accent?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'danger' | 'info';
  };
  progress?: {
    paid: number;
    pending: number;
  };
}

const badgeStyles = {
  success: { bg: 'var(--transfers-success-bg)', text: 'var(--transfers-success)' },
  warning: { bg: 'var(--transfers-warning-bg)', text: 'var(--transfers-warning)' },
  danger: { bg: 'var(--transfers-danger-bg)', text: 'var(--transfers-danger)' },
  info: { bg: 'var(--transfers-info-bg)', text: 'var(--transfers-info)' },
};

export function KpiCard({ label, value, subtext, accent, badge, progress }: KpiCardProps) {
  const accentColor = accent || 'var(--transfers-color-todos)';

  return (
    <div
      className="rounded-3xl p-4 px-4.5 hover:-translate-y-px transition-transform duration-100"
      style={{
        backgroundColor: 'var(--transfers-surface)',
        border: '1px solid var(--transfers-border)',
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <div className="text-[11px] uppercase tracking-[0.06em] mb-1" style={{ color: 'var(--transfers-text-muted)' }}>
        {label}
      </div>
      <div className="text-[26px] font-semibold mb-1" style={{ color: 'var(--transfers-text-primary)' }}>
        {value}
      </div>
      {subtext && (
        <div className="text-[12px] mb-2" style={{ color: 'var(--transfers-text-secondary)' }}>
          {subtext}
        </div>
      )}
      {badge && (
        <div 
          className="inline-block text-[11px] px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: badgeStyles[badge.variant].bg,
            color: badgeStyles[badge.variant].text,
          }}
        >
          {badge.text}
        </div>
      )}
      {progress && (
        <div className="mt-3">
          <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--transfers-text-muted)' }}>
            <span>Pago {progress.paid}%</span>
            <span>Pendente {progress.pending}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--transfers-border)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress.paid}%`,
                backgroundColor: accentColor,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}