export const formatPKR = (amount: number): string => {
  return `Rs ${amount.toLocaleString('en-PK')}`;
};

export const formatKm = (km: number): string => {
  return `${km.toFixed(1)} km`;
};

export const formatEta = (minutes: number | null): string => {
  return (minutes === null ? '—' : `${minutes} min`);
};

export const titleCase = (s: string): string => {
  return s.charAt(0).toUpperCase() + s.slice(1);
};
