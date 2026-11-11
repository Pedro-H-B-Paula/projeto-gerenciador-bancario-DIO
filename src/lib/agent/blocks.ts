import type { DataOrigin } from "@/lib/finance/types";

/** Structured parts of an agent answer, rendered as cards/tables/charts in the chat. */
export type StatTone = "income" | "expense" | "neutral" | "warning";

export type MessageBlock =
  | { type: "stats"; items: { label: string; value: string; tone?: StatTone; hint?: string }[] }
  | {
      type: "table";
      title?: string;
      columns: { key: string; label: string; align?: "left" | "right" }[];
      rows: Record<string, string>[];
    }
  | {
      type: "chart";
      title: string;
      kind: "bar" | "pie" | "line" | "compare";
      data: { label: string; value: number; value2?: number; color?: string }[];
      seriesLabels?: [string, string?];
    }
  | { type: "source"; origin: DataOrigin; updatedAt: string; period?: string; note?: string };

export interface AgentAnswer {
  content: string; // markdown
  blocks: MessageBlock[];
}
