// Lightweight helpers to produce local-time ISO strings without trailing 'Z'.
// Example output: '2025-10-23T14:05:07' (local clock time)
export function toLocalISOString(d: Date = new Date(), withMilliseconds = false): string {
  // Shift date by timezone offset to get local time components in ISO string,
  // then drop the trailing 'Z'.
  const tzShiftMs = d.getTimezoneOffset() * 60 * 1000;
  const local = new Date(d.getTime() - tzShiftMs);
  const iso = local.toISOString(); // now reflects local components but ends with 'Z'
  const trimmed = iso.replace('Z', '');
  return withMilliseconds ? trimmed : trimmed.split('.')[0];
}

export function nowLocalISO(withMilliseconds = false): string {
  return toLocalISOString(new Date(), withMilliseconds);
}
