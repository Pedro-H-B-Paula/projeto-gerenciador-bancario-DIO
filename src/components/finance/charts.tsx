import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

import { formatBRL } from "@/lib/finance/format";

const axis = { stroke: "var(--chart-axis)", fontSize: 11, tickLine: false, axisLine: false } as const;

function compactBRL(v: number) {
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return `R$ ${Math.round(v)}`;
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <div className="mb-1 text-muted-foreground">{label}</div>}
      {payload.map((p) => (
        <div key={String(p.dataKey ?? p.name)} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: (p.payload?.color as string) ?? p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="tabular ml-auto pl-3 font-medium text-foreground">{formatBRL(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

export function BalanceAreaChart({ data, height = 240 }: { data: { label: string; balance: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="label" {...axis} minTickGap={28} />
        <YAxis {...axis} width={70} tickFormatter={compactBRL} domain={["auto", "auto"]} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Area type="monotone" dataKey="balance" name="Saldo" stroke="var(--primary)" strokeWidth={2} fill="url(#balanceFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CompareBarChart({
  data,
  labels,
  colors = ["var(--income)", "var(--expense)"],
  height = 240,
}: {
  data: { label: string; a: number; b: number }[];
  labels: [string, string];
  colors?: [string, string];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barGap={4}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={70} tickFormatter={compactBRL} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--chart-grid)" }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
        <Bar dataKey="a" name={labels[0]} fill={colors[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="b" name={labels[1]} fill={colors[1]} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({
  data,
  height = 220,
  name = "Valor",
  layout = "vertical",
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  name?: string;
  layout?: "vertical" | "horizontal";
}) {
  if (layout === "horizontal") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" {...axis} width={110} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--chart-grid)" }} />
          <Bar dataKey="value" name={name} radius={[0, 4, 4, 0]} maxBarSize={18}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.color ?? "var(--primary)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={70} tickFormatter={compactBRL} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--chart-grid)" }} />
        <Bar dataKey="value" name={name} radius={[4, 4, 0, 0]} maxBarSize={36}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.color ?? "var(--primary)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  height = 220,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color: string }[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltip />} />
          <Pie data={data} dataKey="value" nameKey="label" innerRadius="64%" outerRadius="92%" paddingAngle={2} stroke="none">
            {data.map((d) => (
              <Cell key={d.label} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-[0.7rem] text-muted-foreground">{centerLabel}</div>
            <div className="tabular text-base font-semibold text-foreground">{centerValue}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function LegendList({ items }: { items: { label: string; value: string; color: string; hint?: string }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2.5 text-sm">
          <span className="size-2.5 shrink-0 rounded-sm" style={{ background: i.color }} />
          <span className="truncate text-muted-foreground">{i.label}</span>
          <span className="tabular ml-auto font-medium text-foreground">{i.value}</span>
          {i.hint && <span className="tabular w-11 text-right text-xs text-muted-foreground">{i.hint}</span>}
        </li>
      ))}
    </ul>
  );
}
