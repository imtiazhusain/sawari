import { useId, useMemo, useState } from 'react';
import type { Place } from '../../types';

interface Props {
  label: string;
  value: Place | null;
  places: Place[];
  onChange: (place: Place | null) => void;
  excludeId?: string;
  disabled?: boolean;
  placeholder?: string;
  shape: 'circle' | 'square';
}

/** Accessible combobox (WAI-ARIA 1.2 list autocomplete) over a known set of Lahore places. */
export function LocationInput({ label, value, places, onChange, excludeId, disabled, placeholder, shape }: Props) {
  const uid = useId();
  const listId = `${uid}-list`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places
      .filter((p) => p.id !== excludeId)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q))
      .slice(0, 6);
  }, [places, query, excludeId]);

  const select = (place: Place) => {
    onChange(place);
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open && matches[active]) {
      e.preventDefault();
      select(matches[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <label htmlFor={`${uid}-input`} className="mb-1 flex items-center gap-2 text-sm font-medium text-ink-soft">
        <span aria-hidden className={`inline-block h-2.5 w-2.5 ${shape === 'circle' ? 'rounded-full bg-pine' : 'bg-marigold'}`} />
        {label}
      </label>
      <input
        id={`${uid}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${uid}-opt-${matches[active].id}` : undefined}
        autoComplete="off"
        disabled={disabled}
        placeholder={disabled ? 'Loading places…' : placeholder}
        value={value ? value.name : query}
        onChange={(e) => {
          if (value) onChange(null); // editing a chosen place clears it until a new one is picked
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="min-h-12 w-full rounded-lg border border-line bg-surface px-3 text-base placeholder:text-ink-faint disabled:bg-canvas"
      />
      {value && <p className="mt-1 text-xs text-ink-faint">{value.area}</p>}
      {open && !value && (
        <ul id={listId} role="listbox" aria-label={`${label} suggestions`} className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-line bg-surface py-1 shadow-lg">
          {matches.length === 0 && <li className="px-3 py-2 text-sm text-ink-soft">No matching place in Lahore</li>}
          {matches.map((p, i) => (
            <li
              key={p.id}
              id={`${uid}-opt-${p.id}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault(); // keep focus so onBlur doesn't close the list before the click lands
                select(p);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 ${i === active ? 'bg-pine-tint' : ''}`}
            >
              <span className="block text-sm font-medium">{p.name}</span>
              <span className="block text-xs text-ink-soft">{p.area}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
