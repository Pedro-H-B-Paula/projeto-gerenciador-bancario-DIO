import { useMemo } from "react";

import { DEMO_INSTITUTIONS, buildDemoSnapshot } from "@/lib/demo/dataset";
import { useDemoState } from "@/lib/demo/store";
import { toISODate } from "@/lib/finance/dates";
import type { FinancialSnapshot } from "@/lib/finance/types";

export function todayISO() {
  return toISODate(new Date());
}

/**
 * Single entry point for financial data in the UI. Stage 1 serves the demonstration dataset;
 * later stages merge normalized Plaid/Pluggy data here without changing any page.
 */
export function useFinanceSnapshot(): { snapshot: FinancialSnapshot; today: string } {
  const demo = useDemoState();
  const today = todayISO();
  const snapshot = useMemo(() => {
    const enabled = DEMO_INSTITUTIONS.map((i) => i.id).filter((id) => !demo.disconnected.includes(id));
    return buildDemoSnapshot(today, demo.refreshedAt, enabled);
  }, [today, demo.disconnected, demo.refreshedAt]);
  return { snapshot, today };
}
