import type { ReactNode } from 'react';

interface Props {
  tone?: 'error' | 'info';
  children: ReactNode;
  action?: { label: string; onClick: () => void };
}

export function Alert({ tone = 'error', children, action }: Props) {
  const color = tone === 'error' ? 'border-brick/30 bg-brick-tint text-brick' : 'border-pine/20 bg-pine-tint text-pine-dark';

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${color}`}
    >
      <p>
        {children}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="shrink-0 rounded font-semibold underline underline-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
