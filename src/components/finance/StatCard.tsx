import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  footer,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: "neutral" | "income" | "expense" | "primary";
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-card flex flex-col gap-3 p-4 sm:p-5 animate-fade-up", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[0.8125rem] text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className={cn(
              "grid size-7 place-items-center rounded-md",
              tone === "income" && "bg-income-soft text-income",
              tone === "expense" && "bg-expense-soft text-expense",
              tone === "primary" && "bg-primary-soft text-primary",
              tone === "neutral" && "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="size-3.5" />
          </span>
        )}
      </div>
      <div className="tabular text-lg font-semibold tracking-tight text-foreground sm:text-2xl">{value}</div>
      {footer && <div className="text-xs text-muted-foreground">{footer}</div>}
    </div>
  );
}
