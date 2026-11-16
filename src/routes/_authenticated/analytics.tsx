import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, LineChart, MessageSquare, PiggyBank, Repeat, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { CompareBarChart, DonutChart, LegendList, SimpleBarChart } from "@/components/finance/charts";
import { Amount } from "@/components/finance/Amount";
import { EmptyState } from "@/components/finance/EmptyState";
import { OriginBadge } from "@/components/finance/OriginBadge";
import { PageHeader, Panel } from "@/components/finance/PageHeader";
import { StatCard } from "@/components/finance/StatCard";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinanceSnapshot } from "@/hooks/use-finance-data";
import { categoryColor, categoryLabel } from "@/lib/finance/categories";
import { addMonths, endOfMonth, startOfMonth } from "@/lib/finance/dates";
import {
  averageMonthlyExpense,
  categoryBreakdown,
  comparePeriods,
  detectRecurring,
  filterRange,
  monthToDateRanges,
  monthlySeries,
  savingsEstimate,
  summarize,
  topTransactions,
  unusualExpenses,
} from "@/lib/finance/engine";
import { formatBRL, formatDate, formatDateTime, formatPercent, monthLong, monthShort } from "@/lib/finance/format";
import type { DateRange } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Análises — Finance AI" },
      { name: "description", content: "Categorias, evolução de gastos, assinaturas, recorrências e estimativa de economia." },
      { property: "og:title", content: "Análises — Finance AI" },
      { property: "og:description", content: "Inteligência financeira calculada a partir das suas transações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalyticsPage,
});

type Window = "month" | "3m" | "6m";
const WINDOW_LABEL: Record<Window, string> = { month: "Este mês", "3m": "Últimos 3 meses", "6m": "Últimos 6 meses" };

function windowRange(w: Window, today: string): DateRange {
  if (w === "month") return { from: startOfMonth(today), to: today, label: "este mês" };
  const n = w === "3m" ? 3 : 6;
  // Last N complete months.
  const end = endOfMonth(addMonths(startOfMonth(today), -1));
  return { from: addMonths(startOfMonth(today), -n), to: end, label: `últimos ${n} meses completos` };
}

function AnalyticsPage() {
  const { snapshot, today } = useFinanceSnapshot();
  const [win, setWin] = useState<Window>("3m");

  const d = useMemo(() => {
    const txs = snapshot.transactions;
    const range = windowRange(win, today);
    const inWin = filterRange(txs, range);
    const { current, previous } = monthToDateRanges(today);
    const lastMonthStart = addMonths(startOfMonth(today), -1);
    const lastMonth: DateRange = { from: lastMonthStart, to: endOfMonth(lastMonthStart), label: monthLong(lastMonthStart.slice(0, 7)) };
    const prevMonthStart = addMonths(startOfMonth(today), -2);
    const prevMonth: DateRange = { from: prevMonthStart, to: endOfMonth(prevMonthStart), label: monthLong(prevMonthStart.slice(0, 7)) };
    const series = monthlySeries(txs, today, 6);
    return {
      range,
      summary: summarize(inWin),
      cats: categoryBreakdown(inWin),
      top: topTransactions(inWin, 8),
      recurring: detectRecurring(txs),
      unusual: unusualExpenses(filterRange(txs, { from: addMonths(startOfMonth(today), -3), to: today })).slice(0, 5),
      mtd: comparePeriods(txs, current, previous),
      months: comparePeriods(txs, lastMonth, prevMonth),
      lastMonth,
      prevMonth,
      series,
      savings: savingsEstimate(txs, today, 3),
      avgExpense: averageMonthlyExpense(txs, today, 3),
    };
  }, [snapshot.transactions, today, win]);

  const subs = d.recurring.filter((r) => r.isSubscription);
  const subsTotal = subs.reduce((s, r) => s + r.averageAmount, 0);
  const recurringTotal = d.recurring.reduce((s, r) => s + r.averageAmount, 0);
  const ratio = d.summary.income > 0 ? (d.summary.expense / d.summary.income) * 100 : null;

  return (
    <AppShell>
      <PageHeader
        title="Análises"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <OriginBadge origin={snapshot.origin} />
            <span>Atualizado em {formatDateTime(snapshot.updatedAt)}</span>
          </span>
        }
        actions={
          <Button asChild variant="outline">
            <Link to="/chat">
              <MessageSquare /> Perguntar ao agente
            </Link>
          </Button>
        }
      />

      {snapshot.transactions.length === 0 ? (
        <div className="surface-card">
          <EmptyState icon={LineChart} title="Dados indisponíveis" description="Conecte uma instituição em Contas para gerar análises." />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={win} onValueChange={(v) => setWin(v as Window)}>
              <TabsList>
                {(Object.keys(WINDOW_LABEL) as Window[]).map((w) => (
                  <TabsTrigger key={w} value={w}>
                    {WINDOW_LABEL[w]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <span className="text-xs text-muted-foreground">
              Período: {formatDate(d.range.from)} a {formatDate(d.range.to)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Receitas" value={formatBRL(d.summary.income)} icon={TrendingUp} tone="income" />
            <StatCard label="Despesas" value={formatBRL(d.summary.expense)} icon={TrendingDown} tone="expense" />
            <StatCard
              label="Resultado"
              value={<span className={d.summary.net < 0 ? "text-expense" : ""}>{formatBRL(d.summary.net)}</span>}
              icon={Scale}
              tone={d.summary.net < 0 ? "expense" : "primary"}
              footer={d.summary.net < 0 ? "Gastou mais do que ganhou" : "Ganhou mais do que gastou"}
            />
            <StatCard
              label="Despesas / receitas"
              value={ratio === null ? "—" : formatPercent(ratio)}
              icon={PiggyBank}
              footer={ratio === null ? "Sem receitas no período" : `A cada R$ 100,00 recebidos, R$ ${ratio.toFixed(2).replace(".", ",")} foram gastos`}
            />
          </div>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-5">
            <Panel title="Categorias que mais consomem" description={`Despesas · ${d.range.label}`} className="lg:col-span-2">
              {d.cats.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma despesa no período.</p>
              ) : (
                <>
                  <DonutChart
                    data={d.cats.map((c) => ({ label: c.label, value: c.total, color: categoryColor(c.category) }))}
                    height={200}
                    centerLabel="Total"
                    centerValue={formatBRL(d.summary.expense)}
                  />
                  <div className="mt-4">
                    <LegendList
                      items={d.cats.slice(0, 6).map((c) => ({
                        label: c.label,
                        value: formatBRL(c.total),
                        color: categoryColor(c.category),
                        hint: formatPercent(c.share),
                      }))}
                    />
                  </div>
                </>
              )}
            </Panel>

            <Panel title="Evolução dos gastos" description="Despesas por mês (mês atual até hoje)" className="lg:col-span-3">
              <SimpleBarChart
                data={d.series.map((m, i) => ({
                  label: monthShort(m.month),
                  value: m.expense,
                  color: i === d.series.length - 1 ? "var(--primary)" : "var(--chart-8)",
                }))}
                name="Despesas"
                height={260}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Média dos últimos 3 meses completos: <span className="tabular text-foreground">{formatBRL(d.avgExpense)}</span> por mês.
              </p>
            </Panel>
          </div>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <Panel title="Receitas x despesas" description="Últimos 6 meses">
              <CompareBarChart
                data={d.series.map((m) => ({ label: monthShort(m.month), a: m.income, b: m.expense }))}
                labels={["Receitas", "Despesas"]}
                colors={["var(--income)", "var(--expense)"]}
                height={240}
              />
            </Panel>

            <Panel
              title="Comparação entre períodos"
              description={`${capitalizeFirst(d.lastMonth.label)} x ${d.prevMonth.label} · despesas por categoria`}
            >
              <ComparisonSummary a={d.months.a.expense} b={d.months.b.expense} pct={d.months.expenseChangePct} />
              <ul className="mt-4 space-y-2">
                {d.months.byCategory.slice(0, 6).map((c) => (
                  <li key={c.category} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="size-2 rounded-full" style={{ background: categoryColor(c.category) }} />
                      {c.label}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="tabular text-foreground">{formatBRL(c.a)}</span>
                      <span className={cn("tabular w-24 text-right text-xs", c.diff > 0 ? "text-expense" : c.diff < 0 ? "text-income" : "text-muted-foreground")}>
                        {c.diff > 0 ? "+" : c.diff < 0 ? "−" : ""}
                        {formatBRL(Math.abs(c.diff))}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Este mês até hoje: {formatBRL(d.mtd.a.expense)} em despesas, contra {formatBRL(d.mtd.b.expense)} nos mesmos dias do mês anterior
                {d.mtd.expenseChangePct !== null && ` (${d.mtd.expenseChangePct > 0 ? "+" : ""}${formatPercent(d.mtd.expenseChangePct, 1)})`}.
              </p>
            </Panel>
          </div>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <Panel
              title="Assinaturas e despesas recorrentes"
              description="Mesma descrição em 3 ou mais meses, com valores parecidos (±15%)"
              actions={<Repeat className="size-4 text-muted-foreground" />}
            >
              {d.recurring.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma despesa recorrente identificada.</p>
              ) : (
                <>
                  <div className="mb-3 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-surface p-3">
                      <p className="text-xs text-muted-foreground">Recorrentes por mês</p>
                      <p className="tabular mt-1 font-semibold text-foreground">{formatBRL(recurringTotal)}</p>
                    </div>
                    <div className="rounded-lg bg-surface p-3">
                      <p className="text-xs text-muted-foreground">Assinaturas ({subs.length})</p>
                      <p className="tabular mt-1 font-semibold text-foreground">{formatBRL(subsTotal)}</p>
                    </div>
                  </div>
                  <ul className="divide-y">
                    {d.recurring.map((r) => (
                      <li key={r.key} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate text-sm text-foreground">
                            {r.description}
                            {r.isSubscription && <Badge variant="warning">Assinatura</Badge>}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarClock className="size-3" /> {categoryLabel(r.category)} · {r.months} meses · próxima prevista ~{formatDate(r.nextExpected)}
                          </p>
                        </div>
                        <span className="tabular text-sm text-foreground">{formatBRL(r.averageAmount)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">A data da próxima cobrança é uma estimativa, não uma cobrança confirmada.</p>
                </>
              )}
            </Panel>

            <div className="space-y-4 sm:space-y-5">
              <Panel title="Maiores despesas" description={d.range.label}>
                {d.top.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma despesa no período.</p>
                ) : (
                  <ul className="divide-y">
                    {d.top.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">{t.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {categoryLabel(t.category)} · {formatDate(t.date)}
                          </p>
                        </div>
                        <Amount value={t.amount} direction={t.direction} className="text-sm" />
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Gastos incomuns" description="Últimos 3 meses" actions={<AlertTriangle className="size-4 text-warning" />}>
                {d.unusual.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">Nenhum gasto fora do padrão encontrado.</p>
                ) : (
                  <ul className="divide-y">
                    {d.unusual.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">{t.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {categoryLabel(t.category)} · {formatDate(t.date)}
                          </p>
                        </div>
                        <Amount value={t.amount} direction={t.direction} className="text-sm" />
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Critério: a partir de R$ 150,00 e mais de 2× o maior valor anterior no mesmo estabelecimento, ou 2,5× a mediana da categoria.
                </p>
              </Panel>
            </div>
          </div>

          <Panel title="Estimativa de economia" description="Baseada nos 3 últimos meses completos — é uma estimativa, não um valor confirmado">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Sobra total no período</p>
                <p className={cn("tabular mt-1 text-2xl font-semibold", d.savings.totalNet < 0 ? "text-expense" : "text-foreground")}>
                  {formatBRL(d.savings.totalNet)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Média por mês</p>
                <p className="tabular mt-1 text-2xl font-semibold text-foreground">{formatBRL(d.savings.averageNet)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa de economia</p>
                <p className="tabular mt-1 text-2xl font-semibold text-primary">
                  {d.savings.savingsRate === null ? "—" : formatPercent(d.savings.savingsRate, 1)}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {d.savings.months.map((m) => (
                <div key={m.month} className="rounded-lg bg-surface p-3 text-xs">
                  <p className="font-medium capitalize text-foreground">{monthLong(m.month)}</p>
                  <p className="mt-1 text-muted-foreground">
                    {formatBRL(m.income)} − {formatBRL(m.expense)} ={" "}
                    <span className={cn("tabular", m.net < 0 ? "text-expense" : "text-income")}>{formatBRL(m.net)}</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Como calculamos: receitas menos despesas de cada mês. Transferências entre suas próprias contas (como pagar a
              fatura ou guardar na poupança) não contam como gasto. A taxa de economia é a sobra dividida pelas receitas.
            </p>
          </Panel>
        </div>
      )}
    </AppShell>
  );
}

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ComparisonSummary({ a, b, pct }: { a: number; b: number; pct: number | null }) {
  return (
    <div className="flex items-end gap-4">
      <div>
        <p className="text-xs text-muted-foreground">Mês passado</p>
        <p className="tabular text-xl font-semibold text-foreground">{formatBRL(a)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Mês anterior</p>
        <p className="tabular text-xl font-semibold text-muted-foreground">{formatBRL(b)}</p>
      </div>
      {pct !== null && (
        <Badge variant={pct > 0 ? "expense" : "income"} className="mb-1">
          {pct > 0 ? "+" : ""}
          {formatPercent(pct, 1)}
        </Badge>
      )}
    </div>
  );
}
