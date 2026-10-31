import { friendlyError } from '../../lib/errors';
import { formatKm, formatPKR, titleCase } from '../../lib/format';
import type { Ride } from '../../types';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { StatusTimeline } from './StatusTimeline';

interface Props {
  ride: Ride;
  onCancel: () => void;
  cancelling: boolean;
  cancelError: unknown;
  onReset: () => void;
  refreshError?: unknown;
}

const HEADINGS: Record<Ride['status'], string> = {
  requested: 'Finding your driver',
  accepted: 'Driver assigned',
  completed: 'Ride completed',
  cancelled: 'Ride cancelled',
};

export function RideStatusCard({ ride, onCancel, cancelling, cancelError, onReset, refreshError }: Props) {
  const canCancel = ride.status === 'requested' || ride.status === 'accepted';
  const terminal = !canCancel;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-ink-soft">{titleCase(ride.category)} · {formatKm(ride.distanceKm)}</p>
        <h1 aria-live="polite" className="text-3xl font-bold leading-tight">{HEADINGS[ride.status]}</h1>
        {ride.status === 'requested' && (
          <p className="mt-1 flex items-center gap-2 text-ink-soft">
            <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-marigold" />
            Nearby drivers are being notified. Pickup in about {ride.etaMinutes} min once accepted.
          </p>
        )}
        {ride.status === 'cancelled' && ride.cancelReason && <p className="mt-1 text-ink-soft">{ride.cancelReason}</p>}
      </div>

      <StatusTimeline status={ride.status} />

      {ride.driver && ride.status !== 'cancelled' && (
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="font-display text-lg font-semibold">{ride.driver.name}</p>
          <p className="text-sm text-ink-soft">{ride.driver.vehicle.model} · {ride.driver.vehicle.plate}</p>
          <a className="mt-1 inline-block text-sm font-medium text-pine underline underline-offset-2" href={`tel:${ride.driver.phone}`}>{ride.driver.phone}</a>
        </div>
      )}

      <dl className="grid gap-3 rounded-lg border border-line bg-surface p-4 text-sm">
        <div><dt className="text-ink-faint">Pickup</dt><dd className="font-medium">{ride.pickup.address}</dd></div>
        <div><dt className="text-ink-faint">Destination</dt><dd className="font-medium">{ride.destination.address}</dd></div>
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="text-ink-faint">Fare</dt>
          <dd className="font-display text-xl font-bold">{formatPKR(ride.fare.total)}</dd>
        </div>
      </dl>

      {refreshError != null && <Alert tone="info">Having trouble refreshing — showing the last known status.</Alert>}
      {cancelError != null && <Alert>{friendlyError(cancelError)}</Alert>}

      {canCancel && (
        <Button variant="danger" onClick={onCancel} loading={cancelling}>
          {cancelling ? 'Cancelling…' : 'Cancel ride'}
        </Button>
      )}
      {terminal && <Button onClick={onReset}>Book another ride</Button>}
    </div>
  );
}
