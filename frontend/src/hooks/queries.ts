import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/endpoints';
import { ApiError } from '../api/client';
import { getRiderId, setRiderId } from '../lib/session';
import type { Place, RideCategory } from '../types';

const DEMO_RIDER = { name: 'Imtiaz Hussain', phone: '+923111952000' };
const POLL_MS = 3000;

/** Demo sign-in: find-or-create the demo rider and remember its id for the X-Rider-Id header. */
export function useRiderSession() {
  return useQuery({
    queryKey: ['rider-session'],
    queryFn: async () => {
      const existing = getRiderId();
      if (existing) return { id: existing };
      const rider = await api.ensureRider(DEMO_RIDER);
      setRiderId(rider.id);
      return rider;
    },
     // Keep cached session data fresh indefinitely.
    staleTime: Infinity,
  });
}

export const usePlaces = () => useQuery({ queryKey: ['places'], queryFn: api.fetchPlaces, staleTime: Infinity });

export function useEstimate(pickup: Place | null, destination: Place | null) {
  const trip = pickup && destination && {
    pickup: { address: pickup.name, lat: pickup.lat, lng: pickup.lng },
    destination: { address: destination.name, lat: destination.lat, lng: destination.lng },
  };
  return useQuery({
    queryKey: ['estimate', pickup?.id, destination?.id],
    queryFn: () => api.estimateRide(trip!),
    enabled: Boolean(trip), // call api if trip is not null
    staleTime: 20_000, // driver availability changes quickly so 20 seconds
    retry: (count, error) => error instanceof ApiError && error.retryable && count < 2,
  });
}

export function useCreateRide() {
  return useMutation({
    mutationFn: (v: { pickup: Place; destination: Place; category: RideCategory; idempotencyKey: string }) =>
      api.createRide(
        {
          pickup: { address: v.pickup.name, lat: v.pickup.lat, lng: v.pickup.lng },
          destination: { address: v.destination.name, lat: v.destination.lat, lng: v.destination.lng },
          category: v.category,
        },
        v.idempotencyKey,
      ),
  });
}

/** Polls until the ride reaches a terminal state, and keeps polling through transient errors. */
export function useRide(rideId: string | null) {
  return useQuery({
    queryKey: ['ride', rideId],
    queryFn: () => api.fetchRide(rideId!),
    enabled: Boolean(rideId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'cancelled' ? false : POLL_MS;
    },
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
}

export function useCancelRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rideId: string) => api.cancelRide(rideId, 'Cancelled by rider'),
    onSuccess: (ride) => qc.setQueryData(['ride', ride.id], ride),
    onError: (_e, rideId) => qc.invalidateQueries({ queryKey: ['ride', rideId] }), // state may have changed under us
  });
}

export const useDrivers = () => useQuery({ queryKey: ['drivers'], queryFn: api.fetchDrivers, refetchInterval: POLL_MS });

export const useOffers = (driverId: string | null) =>
  useQuery({ queryKey: ['offers', driverId], queryFn: () => api.fetchOffers(driverId!), enabled: Boolean(driverId), refetchInterval: POLL_MS });

export function useDriverActions(driverId: string | null) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['drivers'] });
    qc.invalidateQueries({ queryKey: ['offers'] });
  };
  return {
    accept: useMutation({ mutationFn: (rideId: string) => api.acceptRide(rideId, driverId!), onSettled: refresh }),
    complete: useMutation({ mutationFn: (rideId: string) => api.completeRide(rideId, driverId!), onSettled: refresh }),
    availability: useMutation({ mutationFn: (s: 'available' | 'offline') => api.setDriverAvailability(driverId!, s), onSettled: refresh }),
  };
}
