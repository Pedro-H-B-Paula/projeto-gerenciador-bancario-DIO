import { categoryLabel } from "./categories";
import { addDays, startOfWeek } from "./dates";
import {
  availableBalance,
  balanceHistory,
  comparePeriods,
  detectRecurring,
  filterRange,
  monthToDateRanges,
  savingsEstimate,
  summarize,
  unusualExpenses,
} from "./engine";
import { formatBRL, formatDate, formatPercent } from "./format";
import type { FinancialSnapshot } from "./types";

export type InsightTone = "positive" | "warning" | "neutral";

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  detail: string;
  methodology: string;
}

/** Insights are pure functions of the snapshot — never random, never invented. */
export function computeInsights(snapshot: FinancialSnapshot, today: string): Insight[] {
  const txs = snapshot.transactions;
  if (txs.length === 0) return [];
  const out: Insight[] = [];

  // 1. Biggest category change, month-to-date vs same days of previous month.
  const { current, previous } = monthToDateRanges(today);
  const cmp = comparePeriods(txs, current, previous);
  const change = cmp.byCategory.find((c) => c.pct !== null && c.a > 0 && c.b >= 100 && Math.abs(c.pct) >= 10);
  if (change && change.pct !== null) {
    const up = change.pct > 0;
    out.push({
      id: "category-change",
      tone: up ? "warning" : "positive",
      title: `Seus gastos com ${change.label.toLowerCase()} ${up ? "aumentaram" : "diminuíram"} ${formatPercent(Math.abs(change.pct))}`,
      detail: `${formatBRL(change.a)} neste mês até hoje, contra ${formatBRL(change.b)} no mesmo período do mês anterior.`,
      methodology: `Compara ${formatDate(current.from)}–${formatDate(current.to)} com ${formatDate(previous.from)}–${formatDate(previous.to)}, apenas despesas, sem transferências internas.`,
    });
  }

  // 2. Recurring expenses this week.
  const recurring = detectRecurring(txs);
  const weekStart = startOfWeek(today);
  const thisWeek = recurring.filter((r) => r.lastDate >= weekStart && r.lastDate <= today);
  if (thisWeek.length > 0) {
    const total = thisWeek.reduce((s, r) => s + r.averageAmount, 0);
    out.push({
      id: "recurring-week",
      tone: "neutral",
      title: `Você teve ${thisWeek.length} ${thisWeek.length === 1 ? "despesa recorrente" : "despesas recorrentes"} nesta semana`,
      detail: `${thisWeek.map((r) => r.description).join(", ")} — cerca de ${formatBRL(total)} no total.`,
      methodology: "Recorrente = mesma descrição em 3 ou mais meses, com variação de valor de até 15%.",
    });
  } else {
    const next7 = recurring.filter((r) => r.nextExpected > today && r.nextExpected <= addDays(today, 7));
    if (next7.length > 0) {
      out.push({
        id: "recurring-upcoming",
        tone: "neutral",
        title: `${next7.length} ${next7.length === 1 ? "despesa recorrente prevista" : "despesas recorrentes previstas"} para os próximos 7 dias`,
        detail: `${next7.map((r) => `${r.description} (≈ ${formatBRL(r.averageAmount)})`).join(", ")}. Estimativa baseada no histórico.`,
        methodology: "Previsão = data da última ocorrência + 1 mês. É uma estimativa, não um lançamento confirmado.",
      });
    }
  }

  // 3. Balance vs 90-day average.
  const history = balanceHistory(snapshot, today, 90);
  const avg = history.reduce((s, p) => s + p.balance, 0) / history.length;
  const bal = availableBalance(snapshot);
  if (avg > 0) {
    const pct = ((bal - avg) / avg) * 100;
    if (Math.abs(pct) >= 3) {
      out.push({
        id: "balance-vs-average",
        tone: pct < 0 ? "warning" : "positive",
        title: `Seu saldo está ${formatPercent(Math.abs(pct))} ${pct < 0 ? "abaixo" : "acima"} da média dos últimos três meses`,
        detail: `Saldo atual de ${formatBRL(bal)} contra média diária de ${formatBRL(avg)}.`,
        methodology: "Média dos saldos diários das contas corrente e poupança nos últimos 90 dias.",
      });
    }
  }

  // 4. Spending vs income, month-to-date.
  const mtd = summarize(filterRange(txs, current));
  if (mtd.expense > mtd.income && mtd.income > 0) {
    out.push({
      id: "spending-over-income",
      tone: "warning",
      title: "Você está gastando mais do que recebeu neste mês",
      detail: `Despesas de ${formatBRL(mtd.expense)} contra receitas de ${formatBRL(mtd.income)} até hoje.`,
      methodology: "Receitas e despesas do mês corrente até hoje; transferências entre suas contas não entram.",
    });
  }

  // 5. Savings rate, last 3 complete months.
  const sav = savingsEstimate(txs, today, 3);
  if (sav.savingsRate !== null) {
    out.push({
      id: "savings-rate",
      tone: sav.totalNet > 0 ? "positive" : "warning",
      title:
        sav.totalNet > 0
          ? `Você guardou cerca de ${formatPercent(sav.savingsRate)} da sua renda nos últimos 3 meses`
          : "Nos últimos 3 meses suas despesas superaram as receitas",
      detail: `Resultado acumulado de ${formatBRL(sav.totalNet)} (média de ${formatBRL(sav.averageNet)} por mês).`,
      methodology: "Receitas menos despesas dos 3 últimos meses completos.",
    });
  }

  // 6. Unusual expense this month.
  const unusual = unusualExpenses(txs).filter((t) => t.date >= current.from);
  if (unusual[0]) {
    out.push({
      id: "unusual",
      tone: "warning",
      title: `Gasto fora do padrão em ${categoryLabel(unusual[0].category).toLowerCase()}`,
      detail: `${unusual[0].description}: ${formatBRL(unusual[0].amount)} em ${formatDate(unusual[0].date)}.`,
      methodology: "Acima de R$ 150,00 e mais que o dobro do maior valor já pago no mesmo estabelecimento — ou, se for novo, 2,5× a mediana da categoria.",
    });
  }

  return out;
}
