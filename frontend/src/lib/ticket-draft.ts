/** Suggest pickup after baggage collection, preserving the printed arrival offset. */
export function readyFromArrival(arrival?: string | null): string {
  if (!arrival) return "";
  const time = new Date(arrival).getTime();
  if (!Number.isFinite(time)) return "";
  const ready = new Date(time + 45 * 60 * 1000);
  const local = new Date(ready.getTime() - ready.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
