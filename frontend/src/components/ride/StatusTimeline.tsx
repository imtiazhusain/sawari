import type { RideStatus } from '../../types';

const STEPS: { status: RideStatus; label: string }[] = [
  { status: 'requested', label: 'Requested' },
  { status: 'accepted', label: 'Driver assigned' },
  { status: 'completed', label: 'Completed' },
];

export function StatusTimeline({ status }: { status: RideStatus }) {
  const steps = status === 'cancelled' ? [STEPS[0], { status: 'cancelled' as const, label: 'Cancelled' }] : STEPS;
  const current = steps.findIndex((s) => s.status === status);

  return (
    <ol className="flex items-center gap-2" aria-label="Ride progress">
      {steps.map((s, i) => {
        const done = i <= current;
        const bad = s.status === 'cancelled';
        return (
          <li key={s.status} aria-current={i === current ? 'step' : undefined} className="flex flex-1 flex-col gap-1">
            <span className={`h-1.5 rounded-full ${done ? (bad ? 'bg-brick' : 'bg-pine') : 'bg-line'}`} />
            <span className={`text-xs ${i === current ? 'font-semibold text-ink' : 'text-ink-faint'}`}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
