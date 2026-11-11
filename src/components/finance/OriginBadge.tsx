import { FlaskConical, Landmark, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { DataOrigin } from "@/lib/finance/types";

const LABELS: Record<DataOrigin, string> = {
  demo: "Dados de demonstração",
  sandbox: "Plaid Sandbox",
  real: "Dados reais",
};

export function OriginBadge({ origin, short = false }: { origin: DataOrigin; short?: boolean }) {
  const Icon = origin === "demo" ? FlaskConical : origin === "sandbox" ? Landmark : ShieldCheck;
  return (
    <Badge variant={origin} className="whitespace-nowrap">
      <Icon className="size-3" />
      {short ? (origin === "demo" ? "Demo" : origin === "sandbox" ? "Sandbox" : "Real") : LABELS[origin]}
    </Badge>
  );
}
