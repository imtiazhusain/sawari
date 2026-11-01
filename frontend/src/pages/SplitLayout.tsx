import type { ReactNode } from 'react';

/** Map on top for phones, side-by-side from `lg` up. */
export function SplitLayout({ panel, map }: { panel: ReactNode; map: ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(380px,460px)_1fr]">
      <div className="order-2 bg-surface px-5 py-6 sm:px-8 lg:order-1 lg:py-10">
        <div className="mx-auto max-w-md mt-6">{panel}</div>
      </div>
      <div className="order-1 h-56 lg:order-2 lg:h-auto">{map}</div>
    </div>
  );
}
