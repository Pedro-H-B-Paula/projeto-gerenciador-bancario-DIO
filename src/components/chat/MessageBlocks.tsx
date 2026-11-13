import { CompareBarChart, DonutChart, LegendList, SimpleBarChart, BalanceAreaChart } from "@/components/finance/charts";
import { OriginBadge } from "@/components/finance/OriginBadge";
import type { MessageBlock, StatTone } from "@/lib/agent/blocks";
import { formatBRL, formatDateTime } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

const TONE: Record<StatTone, string> = {
  income: "text-income",
  expense: "text-expense",
  warning: "text-warning",
  neutral: "text-foreground",
};

const FALLBACK_COLORS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--chart-6", "--chart-7", "--chart-8"];

export function MessageBlockView({ block }: { block: MessageBlock }) {
  switch (block.type) {
    case "stats":
      return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {block.items.map((i) => (
            <div key={i.label} className="rounded-lg border bg-surface px-3.5 py-3">
              <div className="text-xs text-muted-foreground">{i.label}</div>
              <div className={cn("tabular mt-1 text-lg font-semibold tracking-tight", TONE[i.tone ?? "neutral"])}>{i.value}</div>
              {i.hint && <div className="mt-0.5 text-xs text-muted-foreground">{i.hint}</div>}
            </div>
          ))}
        </div>
      );

    case "table":
      return (
        <div className="overflow-hidden rounded-lg border">
          {block.title && <div className="border-b bg-surface px-3.5 py-2 text-xs font-medium text-muted-foreground">{block.title}</div>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {block.columns.map((c) => (
                    <th
                      key={c.key}
                      className={cn("whitespace-nowrap px-3.5 py-2 text-xs font-medium text-muted-foreground", c.align === "right" ? "text-right" : "text-left")}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((r, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    {block.columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn("px-3.5 py-2.5 text-foreground", c.align === "right" ? "tabular whitespace-nowrap text-right" : "text-left")}
                      >
                        {r[c.key] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case "chart": {
      const colored = block.data.map((d, i) => ({ ...d, color: d.color ?? `var(${FALLBACK_COLORS[i % FALLBACK_COLORS.length]})` }));
      return (
        <div className="rounded-lg border bg-surface/40 p-3.5">
          <div className="mb-3 text-xs font-medium text-muted-foreground">{block.title}</div>
          {block.kind === "bar" && <SimpleBarChart data={colored} height={200} />}
          {block.kind === "line" && <BalanceAreaChart data={block.data.map((d) => ({ label: d.label, balance: d.value }))} height={200} />}
          {block.kind === "compare" && (
            <CompareBarChart
              data={block.data.map((d) => ({ label: d.label, a: d.value, b: d.value2 ?? 0 }))}
              labels={[block.seriesLabels?.[0] ?? "A", block.seriesLabels?.[1] ?? "B"]}
              {...(block.seriesLabels?.[0] === "Receitas" ? {} : { colors: ["var(--chart-8)", "var(--primary)"] as [string, string] })}
              height={220}
            />
          )}
          {block.kind === "pie" && (
            <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
              <DonutChart
                data={colored}
                height={180}
                centerLabel="Total"
                centerValue={formatBRL(colored.reduce((s, d) => s + d.value, 0))}
              />
              <LegendList items={colored.map((d) => ({ label: d.label, value: formatBRL(d.value), color: d.color }))} />
            </div>
          )}
        </div>
      );
    }

    case "source":
      return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <OriginBadge origin={block.origin} />
          <span>Atualizado em {formatDateTime(block.updatedAt)}</span>
          {block.period && <span>Período: {block.period}</span>}
          {block.note && <span>{block.note}</span>}
        </div>
      );
  }
}
