/** The only file that touches import.meta.env (Vite-specific syntax); tests swap it for a stub. */
export const API_URL = import.meta.env.VITE_API_URL as string | undefined;
