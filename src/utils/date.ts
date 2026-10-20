/**
 * Converts a Unix timestamp (seconds or milliseconds) into the UTC day range [start, end).
 * Values below 1e12 are treated as seconds.
 */
export const getUtcDayRange = (timestamp: number): { start: Date; end: Date } => {
  const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const date = new Date(ms);

  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
};
