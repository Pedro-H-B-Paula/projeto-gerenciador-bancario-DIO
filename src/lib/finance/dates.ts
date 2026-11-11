/** Date helpers on plain YYYY-MM-DD strings (local calendar, no timezone drift). */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y = 1970, m = 1, d = 1] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function addMonths(s: string, n: number): string {
  const d = parseISODate(s);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toISODate(d);
}

export function monthKey(s: string): string {
  return s.slice(0, 7);
}

export function startOfMonth(s: string): string {
  return `${s.slice(0, 7)}-01`;
}

export function endOfMonth(s: string): string {
  const d = parseISODate(startOfMonth(s));
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function daysInMonth(s: string): number {
  return Number(endOfMonth(s).slice(8, 10));
}

/** Monday-based week start. */
export function startOfWeek(s: string): string {
  const d = parseISODate(s);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return toISODate(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86_400_000);
}

export function minDate(a: string, b: string) {
  return a < b ? a : b;
}
