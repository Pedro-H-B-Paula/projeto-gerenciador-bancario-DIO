import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, CreditCard, Info, MessageSquare, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useMemo } from "react";

import { BalanceAreaChart, CompareBarChart, DonutChart, LegendList } from "@/components/finance/charts";
import { Amount } from "@/components/finance/Amount";
import { EmptyState } from "@/components/finance/EmptyState";
import { InstitutionAvatar } from "@/components/finance/InstitutionAvatar";
import { OriginBadge } from "@/components/finance/OriginBadge";
import { PageHeader, Panel } from "@/components/finance/PageHeader";
import { StatCard } from "@/components/finance/StatCard";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-auth";
import { useFinanceSnapshot } from "@/hooks/use-finance-data";
import { categoryColor, categoryLabel } from "@/lib/finance/categories";
import {
  availableBalance,
  balanceHistory,
  categoryBreakdown,
  comparePeriods,
  creditDebt,
  filterRange,
  monthToDateRanges,
  monthlySeries,
  summarize,
} from "@/lib/finance/engine";
import { formatBRL, formatDateShort, formatDateTime, formatPercent, monthShort } from "@/lib/finance/format";
import { computeInsights, type InsightTone } from "@/lib/finance/insights";
import { currentMonthRange } from "@/lib/finance/periods";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Visão geral — Finance AI" },
      { name: "description", content: "Saldo disponível, receitas, despesas, categorias e insights do seu agente financeiro." },
      { property: "og:title", content: "Visão geral — Finance AI" },
      { property: "og:description", content: "Saldo, receitas, despesas e insights em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

const INSIGHT_ICON: Record<InsightTone, { icon: typeof Info; cls: string }> = {
  positive: { icon: CheckCircle2, cls: "bg-income-soft text-income" },
  warning: { icon: AlertTriangle, cls: "bg-warning-soft text-warning" },
  neutral: { icon: Info, cls: "bg-info-soft text-info" },
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function DashboardPage() {
  const { snapshot, today } = useFinanceSnapshot();
  const user = useCurrentUser();
  const firstName = ((user?.user_metadata?.["display_name"] as string | undefined) ?? "").split(" ")[0];

  const d = useMemo(() => {
    const txs = snapshot.transactions;
    const monthTx = filterRange(txs, currentMonthRange(today));
    const { current, previous } = monthToDateRanges(today);
    return {
      available: availableBalance(snapshot),
      debt: creditDebt(snapshot),
      month: summarize(monthTx),
      cmp: comparePeriods(txs, current, previous),
      history: balanceHistory(snapshot, today, 90).map((p) => ({ label: formatDateShort(p.date), balance: p.balance })),
      series: monthlySeries(txs, today, 6).map((m) => ({ label: monthShort(m.month), a: m.income, b: m.expense })),
      cats: categoryBreakdown(monthTx),
      recent: [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 7),
      insights: computeInsights(snapshot, today),
    };
  }, [snapshot, today]);

  const accountName = (id: string) => {
    const a = snapshot.accounts.find((x) => x.id === id);
    return a ? `${a.name} •• ${a.mask}` : "—";
  };
  const pct = d.cmp.expenseChangePct;

  return (
    <AppShell>
      <PageHeader
        title={firstName ? `${greeting()}, ${firstName}` : "Visão geral"}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <OriginBadge origin={snapshot.origin} />
            <span>Atualizado em {formatDateTime(snapshot.updatedAt)}</span>
          </span>
        }
        actions={
          <Button asChild>
            <Link to="/chat">
              <MessageSquare /> Perguntar ao agente
            </Link>
          </Button>
        }
      />

      {snapshot.accounts.length === 0 ? (
        <div className="surface-card">
          <EmptyState
            icon={Building2}
            title="Nenhuma conta conectada"
            description="Sem contas conectadas não há dados para mostrar. Reconecte as instituições de demonstração em Contas."
            action={
              <Button asChild>
                <Link to="/accounts">Ir para Contas</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Saldo disponível" value={formatBRL(d.available)} icon={Wallet} tone="primary" footer="Conta corrente + poupança" />
            <StatCard label="Receitas do mês" value={formatBRL(d.month.income)} icon={TrendingUp} tone="income" footer={`Resultado: ${formatBRL(d.month.net)}`} />
            <StatCard
              label="Despesas do mês"
              value={formatBRL(d.month.expense)}
              icon={TrendingDown}
              tone="expense"
              footer={
                pct === null ? (
                  "Sem base de comparação"
                ) : (
                  <span>
                    <span className={pct > 0 ? "text-expense" : "text-income"}>
                      {pct > 0 ? "▲" : "▼"} {formatPercent(Math.abs(pct), 1)}
                    </span>{" "}
                    vs. mesmos dias do mês anterior
                  </span>
                )
              }
            />
            <StatCard label="Fatura do cartão" value={formatBRL(d.debt)} icon={CreditCard} footer="Não descontada do saldo" />
          </div>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
            <Panel title="Saldo disponível" description="Últimos 90 dias" className="lg:col-span-2">
              <BalanceAreaChart data={d.history} />
            </Panel>
            <Panel
              title="Insights do agente"
              description="Calculados a partir das suas movimentações"
            >
              {d.insights.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ainda não há dados suficientes para gerar insights.</p>
              ) : (
                <ul className="space-y-3.5">
                  {d.insights.slice(0, 4).map((i) => {
                    const meta = INSIGHT_ICON[i.tone];
                    return (
                      <li key={i.id} className="flex gap-3">
                        <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-md", meta.cls)}>
                          <meta.icon className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug text-foreground">{i.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{i.detail}</p>
                          <details className="mt-1 text-xs text-muted-foreground">
                            <summary className="cursor-pointer select-none hover:text-foreground">Como calculei</summary>
                            <p className="mt-1 leading-relaxed">{i.methodology}</p>
                          </details>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
            <Panel title="Receitas × despesas" description="Últimos 6 meses (mês atual até hoje)" className="lg:col-span-2">
              <CompareBarChart data={d.series} labels={["Receitas", "Despesas"]} />
            </Panel>
            <Panel title="Despesas por categoria" description="Este mês">
              {d.cats.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma despesa neste mês.</p>
              ) : (
                <>
                  <DonutChart
                    data={d.cats.slice(0, 6).map((c) => ({ label: c.label, value: c.total, color: categoryColor(c.category) }))}
                    height={180}
                    centerLabel="Total"
                    centerValue={formatBRL(d.month.expense)}
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
          </div>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
            <Panel
              title="Últimas movimentações"
              className="lg:col-span-2"
              actions={
                <Link to="/transactions" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  Ver todas <ArrowRight className="size-3.5" />
                </Link>
              }
            >
              <ul className="-mx-1 divide-y">
                {d.recent.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-1 py-2.5">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: categoryColor(t.category) }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{t.description}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDateShort(t.date)} · {categoryLabel(t.category)} · {accountName(t.accountId)}
                      </p>
                    </div>
                    <Amount value={t.amount} direction={t.direction} className="text-sm" />
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel
              title="Contas"
              actions={
                <Link to="/accounts" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  Gerenciar <ArrowRight className="size-3.5" />
                </Link>
              }
            >
              <ul className="space-y-3">
                {snapshot.accounts.map((a) => {
                  const inst = snapshot.institutions.find((i) => i.id === a.institutionId);
                  return (
                    <li key={a.id} className="flex items-center gap-3">
                      {inst && <InstitutionAvatar institution={inst} />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">{a.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {inst?.name} •• {a.mask}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="tabular text-sm font-medium text-foreground">{formatBRL(a.balance)}</p>
                        {a.type === "credit" && <p className="text-[0.7rem] text-muted-foreground">fatura</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>
        </div>
      )}
    </AppShell>
  );
}
