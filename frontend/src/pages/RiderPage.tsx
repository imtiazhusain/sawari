import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';
import { BookingForm } from '../components/booking/BookingForm';
import { MapPlaceholder } from '../components/booking/MapPlaceholder';
import { RideStatusCard } from '../components/ride/RideStatusCard';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { friendlyError } from '../lib/errors';
import { getActiveRideId, setActiveRideId } from '../lib/session';
import { uuid } from '../lib/uuid';
import { useCancelRide, useCreateRide, useEstimate, usePlaces, useRide, useRiderSession } from '../hooks/queries';
import type { Place, RideCategory } from '../types';
import { SplitLayout } from './SplitLayout';

export default function RiderPage() {
  const session = useRiderSession();
  const placesQuery = usePlaces();
  const places = placesQuery.data ?? [];

  const [pickup, setPickup] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [category, setCategory] = useState<RideCategory>('economy');
  const [rideId, setRideId] = useState<string | null>(() => getActiveRideId());

  // One idempotency key per booking attempt: reused on retries, regenerated only when the request itself changes.
  const idempotencyKey = useRef(uuid());
  useEffect(() => {
    idempotencyKey.current = uuid();
  }, [pickup?.id, destination?.id, category]);

  const estimate = useEstimate(pickup, destination);
  const createRide = useCreateRide();
  const rideQuery = useRide(rideId);
  const cancelRide = useCancelRide();

  // A remembered ride that no longer exists should not trap the rider on a dead screen.
  useEffect(() => {
    if (rideQuery.error instanceof ApiError && rideQuery.error.status === 404) clearRide();
  }, [rideQuery.error]);

  function clearRide() {
    setActiveRideId(null);
    setRideId(null);
    createRide.reset();
    cancelRide.reset();
  }

  function startOver() {
    clearRide();
    setPickup(null);
    setDestination(null);
    setCategory('economy');
    idempotencyKey.current = uuid();
  }

  function submit() {
    if (!pickup || !destination) return;
    createRide.mutate(
      { pickup, destination, category, idempotencyKey: idempotencyKey.current },
      {
        onSuccess: (ride) => {
          setActiveRideId(ride.id);
          setRideId(ride.id);
        },
      },
    );
  }

  const ride = rideQuery.data;
  const mapPickup = ride?.pickup ?? pickup;
  const mapDestination = ride?.destination ?? destination;

  let panel;
  if (session.isLoading) {
    panel = <Spinner label="Getting things ready…" />;
  } else if (session.isError) {
    panel = <Alert action={{ label: 'Try again', onClick: () => session.refetch() }}>{friendlyError(session.error)}</Alert>;
  } else if (rideId) {
    if (ride) {
      panel = (
        <RideStatusCard
          ride={ride}
          onCancel={() => cancelRide.mutate(ride.id)}
          cancelling={cancelRide.isPending}
          cancelError={cancelRide.error}
          onReset={startOver}
          refreshError={rideQuery.isRefetchError ? rideQuery.error : undefined}
        />
      );
    } else if (rideQuery.isError) {
      panel = <Alert action={{ label: 'Retry', onClick: () => rideQuery.refetch() }}>{friendlyError(rideQuery.error)}</Alert>;
    } else {
      panel = <Spinner label="Loading your ride…" />;
    }
  } else {
    panel = (
      <BookingForm
        places={places}
        placesLoading={placesQuery.isLoading}
        placesError={placesQuery.isError}
        onRetryPlaces={() => placesQuery.refetch()}
        pickup={pickup}
        destination={destination}
        category={category}
        onPickup={setPickup}
        onDestination={setDestination}
        onCategory={setCategory}
        estimate={estimate.data}
        estimateLoading={estimate.isFetching && !estimate.data}
        estimateError={estimate.error}
        onRetryEstimate={() => estimate.refetch()}
        submitting={createRide.isPending}
        submitError={createRide.error}
        onSubmit={submit}
      />
    );
  }

  return (
    <SplitLayout
      panel={panel}
      map={<MapPlaceholder places={places} pickup={mapPickup} destination={mapDestination} driver={ride?.driver?.location ?? null} />}
    />
  );
}
