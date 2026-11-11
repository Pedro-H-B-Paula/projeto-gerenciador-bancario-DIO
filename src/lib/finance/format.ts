/** pt-BR presentation helpers. Values always show two decimals: R$ 1.250,00 */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Intl inserts a non-breaking space after "R$"; normalize to a regular space for consistent output. */
export function formatBRL(value: number): string {
  return brl.format(round2(value)).replace(/\u00a0/g, " ");
}

export function formatMoney(value: number, currency: string): string {
  if (currency === "BRL") return formatBRL(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(round2(value))
    .replace(/\u00a0/g, " ");
}

export function formatSignedBRL(value: number): string {
  const s = formatBRL(Math.abs(value));
  return value < 0 ? `− ${s}` : `+ ${s}`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

export function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTHS_LONG = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function formatDateShort(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${d} ${MONTHS_SHORT[Number(m) - 1]}`;
}

export function formatDateTime(iso: string): string {
  const dt = new Date(iso);
  return dt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function monthShort(monthKey: string): string {
  return MONTHS_SHORT[Number(monthKey.slice(5, 7)) - 1];
}

export function monthLong(monthKey: string): string {
  return `${MONTHS_LONG[Number(monthKey.slice(5, 7)) - 1]} de ${monthKey.slice(0, 4)}`;
}

export { MONTHS_LONG, MONTHS_SHORT };
