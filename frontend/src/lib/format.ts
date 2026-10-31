export const formatPKR = (amount: number): string => `Rs ${amount.toLocaleString('en-PK')}`;
export const formatKm = (km: number): string => `${km.toFixed(1)} km`;
export const formatEta = (minutes: number | null): string => (minutes === null ? '—' : `${minutes} min`);
export const titleCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
