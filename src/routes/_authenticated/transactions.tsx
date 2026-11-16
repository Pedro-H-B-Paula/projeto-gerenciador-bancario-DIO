import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, ReceiptText, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Amount } from "@/components/finance/Amount";
import { EmptyState } from "@/components/finance/EmptyState";
import { InstitutionAvatar } from "@/components/finance/InstitutionAvatar";
import { OriginBadge } from "@/components/finance/OriginBadge";
import { PageHeader } from "@/components/finance/PageHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinanceSnapshot } from "@/hooks/use-finance-data";
import { CATEGORIES, categoryColor, categoryLabel } from "@/lib/finance/categories";
import { addDays, addMonths, endOfMonth, startOfMonth } from "@/lib/finance/dates";
import { filterRange, summarize } from "@/lib/finance/engine";
import { formatBRL, formatDate, formatDateTime } from "@/lib/finance/format";
import { normalizeText } from "@/lib/finance/periods";
import type { CategoryId, Direction, Transaction } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transações — Finance AI" },
      { name: "description", content: "Todas as suas movimentações com filtros por período, instituição, categoria e valor." },
      { property: "og:title", content: "Transações — Finance AI" },
      { property: "og:description", content: "Extrato completo com filtros, busca e ordenação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TransactionsPage,
});

type PeriodKey = "this-month" | "last-month" | "30d" | "90d" | "all";
const PERIODS: Record<PeriodKey, string> = {
  "this-month": "Este mês",
  "last-month": "Mês passado",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  all: "Todo o histórico",
};

function periodRange(key: PeriodKey, today: string) {
  switch (key) {
    case "this-month":
      return { from: startOfMonth(today), to: today };
    case "last-month": {
      const s = addMonths(startOfMonth(today), -1);
      return { from: s, to: endOfMonth(s) };
    }
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "90d":
      return { from: addDays(today, -89), to: today };
    default:
      return null;
  }
}

const DIRECTION_LABEL: Record<Direction, string> = { income: "Receita", expense: "Despesa", transfer: "Transferência" };
type SortKey = "date" | "amount" | "description";
const PAGE = 40;

function TransactionsPage() {
  const { snapshot, today } = useFinanceSnapshot();
  const [period, setPeriod] = useState<PeriodKey>("this-month");
  const [institution, setInstitution] = useState("all");
  const [category, setCategory] = useState<"all" | CategoryId>("all");
  const [direction, setDirection] = useState<"all" | Direction>("all");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });
  const [limit, setLimit] = useState(PAGE);

  const instById = useMemo(() => new Map(snapshot.institutions.map((i) => [i.id, i])), [snapshot.institutions]);
  const accById = useMemo(() => new Map(snapshot.accounts.map((a) => [a.id, a])), [snapshot.accounts]);

  const rows = useMemo(() => {
    const range = periodRange(period, today);
    let txs: Transaction[] = range ? filterRange(snapshot.transactions, range) : snapshot.transactions;
    const minV = parseAmount(min);
    const maxV = parseAmount(max);
    const q = normalizeText(query.trim());
    txs = txs.filter(
      (t) =>
        (institution === "all" || t.institutionId === institution) &&
        (category === "all" || t.category === category) &&
        (direction === "all" || t.direction === direction) &&
        (minV === null || t.amount >= minV) &&
        (maxV === null || t.amount <= maxV) &&
        (!q || normalizeText(`${t.description} ${categoryLabel(t.category)}`).includes(q)),
    );
    const mul = sort.dir === "asc" ? 1 : -1;
    return [...txs].sort((a, b) => {
      if (sort.key === "amount") return (a.amount - b.amount) * mul;
      if (sort.key === "description") return a.description.localeCompare(b.description, "pt-BR") * mul;
      return (a.date.localeCompare(b.date) || a.id.localeCompare(b.id)) * mul;
    });
  }, [snapshot.transactions, period, today, institution, category, direction, min, max, query, sort]);

  const totals = useMemo(() => summarize(rows), [rows]);
  const filtersActive = institution !== "all" || category !== "all" || direction !== "all" || min || max || query;

  const clear = () => {
    setInstitution("all");
    setCategory("all");
    setDirection("all");
    setMin("");
    setMax("");
    setQuery("");
    setLimit(PAGE);
  };

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "description" ? "asc" : "desc" }));

  const exportCsv = () => {
    const header = ["Data", "Descrição", "Instituição", "Conta", "Categoria", "Tipo", "Valor", "Moeda", "Origem"];
    const lines = rows.map((t) =>
      [
        t.date,
        t.description,
        instById.get(t.institutionId)?.name ?? "",
        accById.get(t.accountId)?.name ?? "",
        categoryLabel(t.category),
        DIRECTION_LABEL[t.direction],
        (t.direction === "expense" ? -t.amount : t.amount).toFixed(2),
        t.currency,
        t.origin,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const blob = new Blob(["\uFEFF" + [header.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacoes-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <PageHeader
        title="Transações"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <OriginBadge origin={snapshot.origin} />
            <span>Atualizado em {formatDateTime(snapshot.updatedAt)}</span>
          </span>
        }
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download /> Exportar CSV
          </Button>
        }
      />

      <section className="surface-card mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(PAGE);
              }}
              placeholder="Buscar descrição ou categoria"
              className="pl-9"
              aria-label="Buscar transações"
            />
          </div>
          <FilterSelect label="Período" value={period} onChange={(v) => setPeriod(v as PeriodKey)} options={Object.entries(PERIODS)} />
          <FilterSelect
            label="Instituição"
            value={institution}
            onChange={setInstitution}
            options={[["all", "Todas as instituições"], ...snapshot.institutions.map((i) => [i.id, i.name] as [string, string])]}
          />
          <FilterSelect
            label="Categoria"
            value={category}
            onChange={(v) => setCategory(v as "all" | CategoryId)}
            options={[["all", "Todas as categorias"], ...Object.values(CATEGORIES).map((c) => [c.id, c.label] as [string, string])]}
          />
          <FilterSelect
            label="Tipo"
            value={direction}
            onChange={(v) => setDirection(v as "all" | Direction)}
            options={[["all", "Todos os tipos"], ["income", "Receitas"], ["expense", "Despesas"], ["transfer", "Transferências internas"]]}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Valor de</span>
            <Input inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} placeholder="R$ 0,00" className="h-8 w-28" aria-label="Valor mínimo" />
            <span className="text-xs text-muted-foreground">até</span>
            <Input inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} placeholder="sem limite" className="h-8 w-28" aria-label="Valor máximo" />
          </div>
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={clear}>
              <X /> Limpar filtros
            </Button>
          )}
          <div className="ml-auto flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span>{rows.length} transações</span>
            <span>
              Receitas <span className="tabular text-income">{formatBRL(totals.income)}</span>
            </span>
            <span>
              Despesas <span className="tabular text-foreground">{formatBRL(totals.expense)}</span>
            </span>
          </div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        {snapshot.accounts.length === 0 ? (
          <EmptyState icon={ReceiptText} title="Nenhuma conta conectada" description="Conecte uma instituição em Contas para ver transações." />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Nenhuma transação encontrada"
            description="Nenhuma movimentação corresponde aos filtros escolhidos. Tente ampliar o período ou limpar os filtros."
            action={
              filtersActive ? (
                <Button variant="outline" onClick={clear}>
                  Limpar filtros
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <SortHeader label="Descrição" k="description" sort={sort} onSort={toggleSort} className="pl-5" />
                    <th className="px-3 py-3 font-medium">Instituição</th>
                    <SortHeader label="Data" k="date" sort={sort} onSort={toggleSort} />
                    <th className="px-3 py-3 font-medium">Categoria</th>
                    <th className="px-3 py-3 font-medium">Tipo</th>
                    <SortHeader label="Valor" k="amount" sort={sort} onSort={toggleSort} className="pr-5 text-right" align="right" />
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, limit).map((t) => {
                    const inst = instById.get(t.institutionId);
                    return (
                      <tr key={t.id} className="border-b last:border-0 transition-colors hover:bg-surface/60">
                        <td className="py-3 pl-5 pr-3">
                          <p className="text-foreground">{t.description}</p>
                          <p className="text-xs text-muted-foreground">{accById.get(t.accountId)?.name}</p>
                        </td>
                        <td className="px-3 py-3">
                          {inst && (
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <InstitutionAvatar institution={inst} className="size-6 rounded-md text-[0.6rem]" />
                              {inst.name}
                            </span>
                          )}
                        </td>
                        <td className="tabular whitespace-nowrap px-3 py-3 text-muted-foreground">{formatDate(t.date)}</td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <span className="size-2 rounded-full" style={{ background: categoryColor(t.category) }} />
                            {categoryLabel(t.category)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={t.direction === "income" ? "income" : t.direction === "expense" ? "expense" : "muted"}>
                            {DIRECTION_LABEL[t.direction]}
                          </Badge>
                        </td>
                        <td className="py-3 pl-3 pr-5 text-right">
                          <Amount value={t.amount} direction={t.direction} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="divide-y md:hidden">
              {rows.slice(0, limit).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{t.description}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="size-1.5 rounded-full" style={{ background: categoryColor(t.category) }} />
                      {categoryLabel(t.category)} · {formatDate(t.date)}
                    </p>
                  </div>
                  <Amount value={t.amount} direction={t.direction} className="text-sm" />
                </li>
              ))}
            </ul>

            {rows.length > limit && (
              <div className="border-t p-3 text-center">
                <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
                  Mostrar mais ({rows.length - limit} restantes)
                </Button>
              </div>
            )}
          </>
        )}
      </section>
      <p className="mt-3 text-xs text-muted-foreground">
        Transferências internas (ex.: pagamento da fatura do cartão) movem dinheiro entre suas próprias contas e não entram
        nos totais de receitas e despesas, para não contar o mesmo valor duas vezes.
      </p>
    </AppShell>
  );
}

function parseAmount(s: string): number | null {
  const clean = s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SortHeader({
  label,
  k,
  sort,
  onSort,
  className,
  align = "left",
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
  className?: string;
  align?: "left" | "right";
}) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={cn("px-3 py-3 font-medium", className)} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        onClick={() => onSort(k)}
        className={cn("inline-flex items-center gap-1 transition-colors hover:text-foreground", active && "text-foreground", align === "right" && "flex-row-reverse")}
      >
        {label} <Icon className="size-3" />
      </button>
    </th>
  );
}
