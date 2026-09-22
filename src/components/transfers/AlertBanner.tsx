import { ReactNode } from 'react';

interface AlertBannerProps {
  icon: ReactNode;
  message: string;
  linkText?: string;
  onLinkClick?: () => void;
  variant: 'danger' | 'warning' | 'info';
}

const variantStyles = {
  danger: { bg: 'var(--transfers-danger-bg)', border: 'var(--transfers-danger)' },
  warning: { bg: 'var(--transfers-warning-bg)', border: 'var(--transfers-warning)' },
  info: { bg: 'var(--transfers-info-bg)', border: 'var(--transfers-info)' },
};

export function AlertBanner({ icon, message, linkText, onLinkClick, variant }: AlertBannerProps) {
  const styles = variantStyles[variant];
  
  return (
    <div
      className="rounded-lg p-2.5 px-3.5 flex items-center justify-between gap-3"
      style={{
        backgroundColor: styles.bg,
        borderLeft: `3px solid ${styles.border}`,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[18px]">{icon}</span>
        <span className="text-[13px] font-medium text-transfers-primary">
          {message}
        </span>
      </div>
      {linkText && onLinkClick && (
        <button
          onClick={onLinkClick}
          className="text-[12px] font-medium text-transfers-obras hover:underline"
        >
          {linkText} →
        </button>
      )}
    </div>
  );
}