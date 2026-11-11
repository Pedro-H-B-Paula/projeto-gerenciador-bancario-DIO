import type { Institution } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export function InstitutionAvatar({ institution, className }: { institution: Pick<Institution, "initials" | "colorToken">; className?: string }) {
  return (
    <span
      className={cn("grid size-9 shrink-0 place-items-center rounded-lg text-xs font-semibold text-primary-foreground", className)}
      style={{ background: `var(${institution.colorToken})` }}
      aria-hidden="true"
    >
      {institution.initials}
    </span>
  );
}
