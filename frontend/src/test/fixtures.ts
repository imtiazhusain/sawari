import type { Estimate, Place, Ride } from '../types';

export const LIBERTY: Place = {
  id: 'liberty-market',
  name: 'Liberty Market',
  area: 'Gulberg III',
  lat: 31.5106,
  lng: 74.3446
};

export const PACKAGES: Place = {
  id: 'packages-mall',
  name: 'Packages Mall',
  area: 'Walton Road',
  lat: 31.4707,
  lng: 74.3547
};

export const PLACES: Place[] = [LIBERTY, PACKAGES];

export const ESTIMATE: Estimate = {
  distanceKm: 5.8,
  options: [
    {
      category: 'economy',
      etaMinutes: 4,
      available: true,
      fare: {
        currency: 'PKR',
        baseFare: 100,
        ratePerKm: 35,
        distanceKm: 5.8,
        total: 310
      }
    },
    {
      category: 'comfort',
      etaMinutes: 6,
      available: true,
      fare: {
        currency: 'PKR',
        baseFare: 160,
        ratePerKm: 55,
        distanceKm: 5.8,
        total: 480
      }
    },
  ],
};

export const RIDE: Ride = {
  id: '64b7f0c2a1b2c3d4e5f60718',
  status: 'requested',
  category: 'economy',
  pickup: { address: 'Liberty Market', lat: LIBERTY.lat, lng: LIBERTY.lng },
  destination: {
    address: 'Packages Mall',
    lat: PACKAGES.lat,
    lng: PACKAGES.lng
  },
  distanceKm: 5.8,
  etaMinutes: 4,
  fare: ESTIMATE.options[0].fare,
  driver: null,
  driverId: null,
  createdAt: '2026-10-30T10:00:00.000Z',
  acceptedAt: null,
  completedAt: null,
  cancelledAt: null,
  cancelReason: null,
};

export const DRIVER = {
  id: 'd1',
  name: 'Usman Tariq',
  phone: '+923005551000',
  category: 'economy' as const,
  status: 'busy' as const,
  vehicle: { model: 'Suzuki Cultus', plate: 'LEA-1021' },
  location: { lat: 31.512, lng: 74.345 },
  currentRideId: RIDE.id,
};
