import type { ReactNode } from 'react';

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div
      className="rounded-lg border border-dashed border-line bg-surface px-4 py-6 text-center"
    >
      <p className="font-display text-lg font-semibold">
        {title}
      </p>
      {children && (
        <p className="mt-1 text-sm text-ink-soft">
          {children}
        </p>
      )}
    </div>
  );
}
