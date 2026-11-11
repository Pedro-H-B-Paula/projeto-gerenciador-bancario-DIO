import { addDays, addMonths, endOfMonth, minDate, startOfMonth, startOfWeek } from "./dates";
import { MONTHS_LONG, formatDate, monthLong } from "./format";
import type { DateRange } from "./types";

/** Lowercase, accent-free text for keyword matching. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const NUMBER_WORDS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6,
  sete: 7, oito: 8, nove: 9, dez: 10, doze: 12, quinze: 15, trinta: 30, noventa: 90,
};

const MONTH_INDEX: Record<string, number> = Object.fromEntries(
  MONTHS_LONG.map((m, i) => [normalizeText(m), i]),
);

function toNumber(token: string): number | null {
  if (/^\d+$/.test(token)) return Number(token);
  return NUMBER_WORDS[token] ?? null;
}

export function currentMonthRange(today: string): DateRange {
  return { from: startOfMonth(today), to: today, label: `este mês (${monthLong(today.slice(0, 7))})` };
}

export function previousMonthRange(today: string): DateRange {
  const prev = addMonths(startOfMonth(today), -1);
  return { from: prev, to: endOfMonth(prev), label: `mês passado (${monthLong(prev.slice(0, 7))})` };
}

/**
 * Resolves natural-language Brazilian Portuguese period expressions into an explicit date range.
 * Returns null when no period is mentioned so callers can apply their own default.
 */
export function resolvePeriod(text: string, today: string): DateRange | null {
  const t = normalizeText(text);

  if (/\bhoje\b/.test(t)) return { from: today, to: today, label: "hoje" };
  if (/\bontem\b/.test(t)) {
    const y = addDays(today, -1);
    return { from: y, to: y, label: "ontem" };
  }

  const lastN = t.match(/ultim[oa]s? (\d+|[a-z]+) (dias?|semanas?|mes|meses)/);
  if (lastN) {
    const n = toNumber(lastN[1]);
    if (n && n > 0) {
      const unit = lastN[2];
      if (unit.startsWith("dia")) {
        return { from: addDays(today, -(n - 1)), to: today, label: `últimos ${n} dias` };
      }
      if (unit.startsWith("semana")) {
        return { from: addDays(today, -(n * 7 - 1)), to: today, label: `últimas ${n} semanas` };
      }
      // "últimos 3 meses" = the 3 full months before the current one plus nothing partial? We use
      // a rolling window: same day N months ago (+1 day) until today.
      return { from: addDays(addMonths(today, -n), 1), to: today, label: `últimos ${n} meses` };
    }
  }

  if (/semana passada|semana anterior|ultima semana/.test(t)) {
    const start = addDays(startOfWeek(today), -7);
    return { from: start, to: addDays(start, 6), label: `semana passada (${formatDate(start)} a ${formatDate(addDays(start, 6))})` };
  }
  if (/(essa|esta|nesta|nessa) semana/.test(t)) {
    return { from: startOfWeek(today), to: today, label: "esta semana" };
  }

  if (/mes passado|mes anterior|ultimo mes/.test(t)) return previousMonthRange(today);
  if (/(este|esse|neste|nesse) mes|mes atual/.test(t)) return currentMonthRange(today);

  if (/ano passado/.test(t)) {
    const y = Number(today.slice(0, 4)) - 1;
    return { from: `${y}-01-01`, to: `${y}-12-31`, label: `ano de ${y}` };
  }
  if (/(este|esse|neste|nesse) ano|no ano/.test(t)) {
    return { from: `${today.slice(0, 4)}-01-01`, to: today, label: `este ano (${today.slice(0, 4)})` };
  }

  const since = t.match(/desde (?:o (?:inicio|comeco) de )?([a-z]+)/);
  if (since && since[1] in MONTH_INDEX) {
    const idx = MONTH_INDEX[since[1]];
    let year = Number(today.slice(0, 4));
    const candidate = `${year}-${String(idx + 1).padStart(2, "0")}-01`;
    if (candidate > today) year -= 1;
    const from = `${year}-${String(idx + 1).padStart(2, "0")}-01`;
    return { from, to: today, label: `desde ${MONTHS_LONG[idx]} de ${year}` };
  }

  const inMonth = t.match(/\b(?:em|de|no mes de) ([a-z]+)\b/);
  if (inMonth && inMonth[1] in MONTH_INDEX) {
    const idx = MONTH_INDEX[inMonth[1]];
    let year = Number(today.slice(0, 4));
    let from = `${year}-${String(idx + 1).padStart(2, "0")}-01`;
    if (from > today) {
      year -= 1;
      from = `${year}-${String(idx + 1).padStart(2, "0")}-01`;
    }
    return { from, to: minDate(endOfMonth(from), today), label: `${MONTHS_LONG[idx]} de ${year}` };
  }

  return null;
}
