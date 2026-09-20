/** Demo credits are shown as plain numbers with thousands separators (no currency symbol). */
export const formatCredits = (value: number): string => Math.round(value).toLocaleString('en-US');

export const formatMultiplier = (value: number): string => `×${value}`;

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const uuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for very old browsers / insecure contexts.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};
