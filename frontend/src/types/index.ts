export type RideCategory = 'economy' | 'comfort';

export type RideStatus = 'requested' | 'accepted' | 'completed' | 'cancelled';

export type DriverStatus = 'offline' | 'available' | 'busy';

export interface Place {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
}

export interface Fare {
  currency: string;
  baseFare: number;
  ratePerKm: number;
  distanceKm: number;
  total: number;
}

export interface EstimateOption {
  category: RideCategory;
  fare: Fare;
  etaMinutes: number | null;
  available: boolean;
}

export interface Estimate {
  distanceKm: number;
  options: EstimateOption[];
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  category: RideCategory;
  status: DriverStatus;
  vehicle: { model: string; plate: string };
  location: { lat: number; lng: number };
  currentRideId: string | null;
}

export interface RideLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface Ride {
  id: string;
  status: RideStatus;
  category: RideCategory;
  pickup: RideLocation;
  destination: RideLocation;
  distanceKm: number;
  etaMinutes: number;
  fare: Fare;
  driver: Driver | null;
  driverId: string | null;
  createdAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
}

export interface TripPayload {
  pickup: RideLocation;
  destination: RideLocation;
}
