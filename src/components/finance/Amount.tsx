import { formatBRL } from "@/lib/finance/format";
import type { Direction } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export function Amount({ value, direction, className }: { value: number; direction: Direction; className?: string }) {
  const sign = direction === "income" ? "+" : direction === "expense" ? "−" : "";
  return (
    <span
      className={cn(
        "tabular whitespace-nowrap font-medium",
        direction === "income" && "text-income",
        direction === "expense" && "text-foreground",
        direction === "transfer" && "text-muted-foreground",
        className,
      )}
    >
      {sign && `${sign} `}
      {formatBRL(value)}
    </span>
  );
}
