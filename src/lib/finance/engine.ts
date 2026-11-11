/**
 * Deterministic financial calculations. Dashboard, analytics, insights and the agent all use
 * these functions so numbers always match across the product.
 * All functions assume amounts in BRL (convert before calling when needed).
 */
import { CATEGORIES } from "./categories";
import { addDays, addMonths, diffDays, endOfMonth, minDate, monthKey, startOfMonth } from "./dates";
import { round2 } from "./format";
import type { CategoryId, DateRange, FinancialSnapshot, Transaction } from "./types";

export function inRange(tx: Transaction, r: Pick<DateRange, "from" | "to">) {
  return tx.date >= r.from && tx.date <= r.to;
}

export function filterRange(txs: Transaction[], r: Pick<DateRange, "from" | "to">) {
  return txs.filter((t) => inRange(t, r));
}

/** De-duplicates by id so the same transaction is never counted twice. */
export function uniqueTransactions(txs: Transaction[]): Transaction[] {
  const seen = new Set<string>();
  return txs.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
}

export interface Summary {
  income: number;
  expense: number;
  net: number;
  count: number;
}

/** Income and expense totals. Transfers between own accounts are excluded. */
export function summarize(txs: Transaction[]): Summary {
  let income = 0;
  let expense = 0;
  let count = 0;
  for (const t of uniqueTransactions(txs)) {
    if (t.direction === "income") income += t.amount;
    else if (t.direction === "expense") expense += t.amount;
    else continue;
    count++;
  }
  return { income: round2(income), expense: round2(expense), net: round2(income - expense), count };
}

export interface MonthPoint {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  net: number;
}

export function monthlySeries(txs: Transaction[], today: string, months: number): MonthPoint[] {
  const out: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = addMonths(startOfMonth(today), -i);
    const s = summarize(filterRange(txs, { from: start, to: minDate(endOfMonth(start), today) }));
    out.push({ month: monthKey(start), income: s.income, expense: s.expense, net: s.net });
  }
  return out;
}

export interface CategorySlice {
  category: CategoryId;
  label: string;
  total: number;
  share: number; // 0..100
  count: number;
}

export function categoryBreakdown(txs: Transaction[]): CategorySlice[] {
  const map = new Map<CategoryId, { total: number; count: number }>();
  let all = 0;
  for (const t of uniqueTransactions(txs)) {
    if (t.direction !== "expense") continue;
    const cur = map.get(t.category) ?? { total: 0, count: 0 };
    cur.total += t.amount;
    cur.count++;
    map.set(t.category, cur);
    all += t.amount;
  }
  return [...map.entries()]
    .map(([category, v]) => ({
      category,
      label: CATEGORIES[category].label,
      total: round2(v.total),
      share: all > 0 ? round2((v.total / all) * 100) : 0,
      count: v.count,
    }))
    .sort((a, b) => b.total - a.total);
}

export function categoryTotal(txs: Transaction[], category: CategoryId): number {
  return round2(
    uniqueTransactions(txs)
      .filter((t) => t.direction === "expense" && t.category === category)
      .reduce((s, t) => s + t.amount, 0),
  );
}

export function topTransactions(txs: Transaction[], n: number, direction: "income" | "expense" = "expense") {
  return uniqueTransactions(txs)
    .filter((t) => t.direction === direction)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
}

/** Sum of asset accounts (checking, savings, investment). Credit card debt is reported separately. */
export function availableBalance(snapshot: FinancialSnapshot): number {
  return round2(
    snapshot.accounts.filter((a) => a.type !== "credit").reduce((s, a) => s + a.balance, 0),
  );
}

export function creditDebt(snapshot: FinancialSnapshot): number {
  return round2(snapshot.accounts.filter((a) => a.type === "credit").reduce((s, a) => s + a.balance, 0));
}

/** Signed effect of a transaction on its own account balance (asset-account perspective). */
function assetEffect(t: Transaction, assetIds: Set<string>): number {
  if (assetIds.has(t.accountId)) {
    if (t.direction === "income") return t.amount;
    if (t.direction === "expense") return -t.amount;
    return -t.amount; // transfer out of this asset account
  }
  if (t.direction === "transfer" && t.counterpartAccountId && assetIds.has(t.counterpartAccountId)) {
    return t.amount; // transfer into an asset account
  }
  return 0;
}

/** Daily balance of asset accounts, reconstructed backwards from the current balance. */
export function balanceHistory(snapshot: FinancialSnapshot, today: string, days: number) {
  const assetIds = new Set(snapshot.accounts.filter((a) => a.type !== "credit").map((a) => a.id));
  const byDate = new Map<string, number>();
  for (const t of uniqueTransactions(snapshot.transactions)) {
    const e = assetEffect(t, assetIds);
    if (e !== 0) byDate.set(t.date, (byDate.get(t.date) ?? 0) + e);
  }
  const points: { date: string; balance: number }[] = [];
  let bal = availableBalance(snapshot);
  for (let i = 0; i < days; i++) {
    const d = addDays(today, -i);
    points.push({ date: d, balance: round2(bal) });
    bal -= byDate.get(d) ?? 0;
  }
  return points.reverse();
}

export interface RecurringItem {
  key: string;
  description: string;
  category: CategoryId;
  averageAmount: number;
  occurrences: number;
  months: number;
  lastDate: string;
  nextExpected: string;
  isSubscription: boolean;
}

/**
 * Recurring expense: same normalized description in at least 3 distinct months, with every
 * amount within ±15% of the average.
 */
export function detectRecurring(txs: Transaction[]): RecurringItem[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of uniqueTransactions(txs)) {
    if (t.direction !== "expense") continue;
    const key = t.description.toLowerCase().replace(/\d+/g, "").replace(/\s+/g, " ").trim();
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  const out: RecurringItem[] = [];
  for (const [key, list] of groups) {
    const months = new Set(list.map((t) => monthKey(t.date)));
    if (months.size < 3) continue;
    const avg = list.reduce((s, t) => s + t.amount, 0) / list.length;
    if (!list.every((t) => Math.abs(t.amount - avg) <= avg * 0.15)) continue;
    if (list.length > months.size * 1.5) continue; // many per month = habit, not a bill
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const last = sorted[sorted.length - 1];
    out.push({
      key,
      description: last.description,
      category: last.category,
      averageAmount: round2(avg),
      occurrences: list.length,
      months: months.size,
      lastDate: last.date,
      nextExpected: addMonths(last.date, 1),
      isSubscription: last.category === "assinaturas",
    });
  }
  return out.sort((a, b) => b.averageAmount - a.averageAmount);
}

export interface PeriodComparison {
  a: Summary;
  b: Summary;
  expenseChangePct: number | null;
  byCategory: { category: CategoryId; label: string; a: number; b: number; diff: number; pct: number | null }[];
}

/** Compares period A (current) against B (reference). */
export function comparePeriods(txs: Transaction[], a: DateRange, b: DateRange): PeriodComparison {
  const ta = filterRange(txs, a);
  const tb = filterRange(txs, b);
  const sa = summarize(ta);
  const sb = summarize(tb);
  const ca = new Map(categoryBreakdown(ta).map((c) => [c.category, c.total]));
  const cb = new Map(categoryBreakdown(tb).map((c) => [c.category, c.total]));
  const cats = new Set<CategoryId>([...ca.keys(), ...cb.keys()]);
  const byCategory = [...cats]
    .map((category) => {
      const va = ca.get(category) ?? 0;
      const vb = cb.get(category) ?? 0;
      return {
        category,
        label: CATEGORIES[category].label,
        a: va,
        b: vb,
        diff: round2(va - vb),
        pct: vb > 0 ? round2(((va - vb) / vb) * 100) : null,
      };
    })
    .sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff));
  return {
    a: sa,
    b: sb,
    expenseChangePct: sb.expense > 0 ? round2(((sa.expense - sb.expense) / sb.expense) * 100) : null,
    byCategory,
  };
}

/** Month-to-date of the current month vs the same days of the previous month (fair comparison). */
export function monthToDateRanges(today: string): { current: DateRange; previous: DateRange } {
  const day = Number(today.slice(8, 10));
  const prevStart = addMonths(startOfMonth(today), -1);
  const prevEnd = minDate(addDays(prevStart, day - 1), endOfMonth(prevStart));
  return {
    current: { from: startOfMonth(today), to: today, label: "este mês até hoje" },
    previous: { from: prevStart, to: prevEnd, label: "mesmo período do mês anterior" },
  };
}

export interface SavingsEstimate {
  months: MonthPoint[];
  totalNet: number;
  averageNet: number;
  savingsRate: number | null; // % of income
}

/** Uses the last N *complete* months. Presented as an estimate, never as a confirmed value. */
export function savingsEstimate(txs: Transaction[], today: string, n = 3): SavingsEstimate {
  const lastComplete = addMonths(startOfMonth(today), -1);
  const months = monthlySeries(txs, endOfMonth(lastComplete), n);
  const totalNet = round2(months.reduce((s, m) => s + m.net, 0));
  const totalIncome = months.reduce((s, m) => s + m.income, 0);
  return {
    months,
    totalNet,
    averageNet: round2(totalNet / n),
    savingsRate: totalIncome > 0 ? round2((totalNet / totalIncome) * 100) : null,
  };
}

/** Expenses far above the category's typical value (> 2.5× the category median, min R$ 150). */
export function unusualExpenses(txs: Transaction[]) {
  const byCat = new Map<CategoryId, number[]>();
  const expenses = uniqueTransactions(txs).filter((t) => t.direction === "expense");
  for (const t of expenses) byCat.set(t.category, [...(byCat.get(t.category) ?? []), t.amount]);
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  };
  return expenses
    .filter((t) => {
      const list = byCat.get(t.category)!;
      return list.length >= 4 && t.amount >= 150 && t.amount > median(list) * 2.5;
    })
    .sort((a, b) => b.amount - a.amount);
}

export function averageMonthlyExpense(txs: Transaction[], today: string, n = 3) {
  const lastComplete = endOfMonth(addMonths(startOfMonth(today), -1));
  const series = monthlySeries(txs, lastComplete, n);
  return round2(series.reduce((s, m) => s + m.expense, 0) / n);
}

export { diffDays };
