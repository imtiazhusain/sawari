import type { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const styles: Record<Variant, string> = {
  primary: 'bg-pine text-white hover:bg-pine-dark disabled:bg-line disabled:text-ink-faint',
  secondary: 'bg-surface text-ink border border-line hover:border-ink-faint disabled:text-ink-faint',
  danger: 'bg-surface text-brick border border-brick/40 hover:bg-brick-tint disabled:text-ink-faint disabled:border-line',
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {loading && (
        <Spinner />
      )}
      {children}
    </button>
  );
}
