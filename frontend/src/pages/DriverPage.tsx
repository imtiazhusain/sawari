import { useState } from 'react';
import { MapPlaceholder } from '../components/booking/MapPlaceholder';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { useDriverActions, useDrivers, useOffers, useRide } from '../hooks/queries';
import { friendlyError } from '../lib/errors';
import { formatKm, formatPKR, titleCase } from '../lib/format';
import { SplitLayout } from './SplitLayout';

/** Demo-only: lets you play the driver side so you can watch a ride move through its lifecycle. */
export default function DriverPage() {
  const drivers = useDrivers();
  const [chosenId, setChosenId] = useState<string | null>(null);

  // Try to find the selected driver in the fetched array.
  // If none is found, use the first driver.
  // At startup, the first fetched driver becomes the default selection
  const driver = drivers.data?.find((d) => d.id === chosenId) ?? drivers.data?.[0] ?? null;
  const driverId = driver?.id ?? null;

  const offers = useOffers(driver?.status === 'available' ? driverId : null);
  const currentRide = useRide(driver?.currentRideId ?? null);
  const { accept, complete, availability } = useDriverActions(driverId);
  const actionError = accept.error ?? complete.error ?? availability.error;

  let panel;
  if (drivers.isLoading) panel = <Spinner label="Loading drivers…" />;
  else if (drivers.isError) panel = <Alert action={{ label: 'Retry', onClick: () => drivers.refetch() }}>{friendlyError(drivers.error)}</Alert>;
  else if (!driver) panel = <EmptyState title="No drivers found">Run the seed script to create demo drivers.</EmptyState>;
  else {
    panel = (
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-bold leading-tight">Driver</h1>

        <div>
          <label htmlFor="driver" className="mb-1 block text-sm font-medium text-ink-soft">Driving as</label>
          <select id="driver" value={driver.id} onChange={(e) => { setChosenId(e.target.value); accept.reset(); complete.reset(); availability.reset(); }} className="min-h-12 w-full rounded-lg border border-line bg-surface px-3">
            {drivers.data!.map((d) => (
              <option key={d.id} value={d.id}>{d.name} — {titleCase(d.category)} ({d.status})</option>
            ))}
          </select>
        </div>

        {actionError != null && <Alert>{friendlyError(actionError)}</Alert>}

        {driver.status === 'busy' && currentRide.data ? (
          <div className="rounded-lg border border-line bg-surface p-4">
            <p className="text-sm text-ink-soft">Current ride</p>
            <p className="font-display text-lg font-semibold">{currentRide.data.pickup.address} → {currentRide.data.destination.address}</p>
            <p className="text-sm text-ink-soft">{formatKm(currentRide.data.distanceKm)} · {formatPKR(currentRide.data.fare.total)}</p>
            <Button className="mt-3 w-full" loading={complete.isPending} onClick={() => complete.mutate(currentRide.data!.id)}>Complete ride</Button>
          </div>
        ) : driver.status === 'available' ? (
          <section aria-label="Ride requests" className="grid gap-3">
            <h2 className="text-lg font-semibold">Requests near you</h2>
            {offers.isLoading ? (
              <Spinner label="Looking for requests…" />
            ) : offers.isError ? (
              <Alert action={{ label: 'Retry', onClick: () => offers.refetch() }}>{friendlyError(offers.error)}</Alert>
            ) : offers.data && offers.data.length > 0 ? (
              offers.data.map((r) => (
                <div key={r.id} className="rounded-lg border border-line bg-surface p-4">
                  <p className="font-medium">{r.pickup.address} → {r.destination.address}</p>
                  <p className="text-sm text-ink-soft">{formatKm(r.distanceKm)} · {formatPKR(r.fare.total)}</p>
                  <Button className="mt-3 w-full" loading={accept.isPending && accept.variables === r.id} disabled={accept.isPending} onClick={() => accept.mutate(r.id)}>Accept ride</Button>
                </div>
              ))
            ) : (
              <EmptyState title="No requests nearby">New requests appear here automatically.</EmptyState>
            )}
          </section>
        ) : (
          <EmptyState title="You're offline">Go online to receive ride requests.</EmptyState>
        )}

        {driver.status !== 'busy' && (
          <Button variant="secondary" loading={availability.isPending} onClick={() => availability.mutate(driver.status === 'available' ? 'offline' : 'available')}>
            {driver.status === 'available' ? 'Go offline' : 'Go online'}
          </Button>
        )}
      </div>
    );
  }

  return <SplitLayout panel={panel} map={<MapPlaceholder pickup={driver?.location ?? null} destination={null} />} />;
}
