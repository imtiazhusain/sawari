/** crypto.randomUUID only exists in secure contexts (https/localhost); fall back for plain-http LAN testing. */
export function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    (c) => {
      const r = (Math.random() * 16) | 0;

      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    }
  );
}
