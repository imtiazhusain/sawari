const RIDER_KEY = 'sawari.riderId';
const RIDE_KEY = 'sawari.activeRideId';

function read(key: string): string | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string) : null;
  } catch {
    return null; // storage disabled or corrupted — behave as signed-out
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — state simply won't survive a refresh */
  }
}

export const getRiderId = () => read(RIDER_KEY);
export const setRiderId = (id: string) => write(RIDER_KEY, id);
export const getActiveRideId = () => read(RIDE_KEY);
export const setActiveRideId = (id: string | null) => write(RIDE_KEY, id);
