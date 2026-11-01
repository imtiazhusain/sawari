import { formatEta, formatPKR, titleCase } from '../../lib/format';
import type { EstimateOption, RideCategory } from '../../types';

const COPY: Record<RideCategory, string> = {
  economy: 'Compact hatchback, up to 3 riders',
  comfort: 'Newer sedan with air conditioning',
};

interface Props {
  options: EstimateOption[];
  selected: RideCategory;
  onSelect: (c: RideCategory) => void;
}

export function CategorySelector({ options, selected, onSelect }: Props) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink-soft">
        Ride type
      </legend>
      <div className="grid gap-2">
        {options.map((o) => {
          const checked = o.category === selected;

          return (
            <label
              key={o.category}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pine ${checked ? 'border-pine bg-pine-tint' : 'border-line bg-surface'
                } ${o.available ? '' : 'cursor-not-allowed opacity-60'}`}
            >
              <input
                type="radio"
                name="category"
                className="sr-only"
                value={o.category}
                checked={checked}
                disabled={!o.available}
                onChange={() => {
                  return onSelect(o.category);
                }}
              />
              <span>
                <span className="block font-display text-lg font-semibold">
                  {titleCase(o.category)}
                </span>
                <span className="block text-sm text-ink-soft">
                  {o.available ? COPY[o.category] : 'No drivers nearby'}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-lg font-semibold">
                  {formatPKR(o.fare.total)}
                </span>
                <span className="block text-sm text-ink-soft">
                  {o.available ? `${formatEta(o.etaMinutes)} away` : '—'}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
