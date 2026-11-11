import { describe, expect, it } from "vitest";

import { answerQuestion, detectIntent } from "@/lib/agent/demo-agent";
import { buildDemoSnapshot } from "@/lib/demo/dataset";
import { availableBalance, detectRecurring, monthToDateRanges, summarize } from "@/lib/finance/engine";
import { formatBRL } from "@/lib/finance/format";
import { normalizePlaidAmount, normalizePluggyAmount } from "@/lib/finance/normalize";
import { resolvePeriod } from "@/lib/finance/periods";
import type { Transaction } from "@/lib/finance/types";

const tx = (p: Partial<Transaction>): Transaction => ({
  id: "t",
  accountId: "a",
  institutionId: "i",
  date: "2026-11-05",
  description: "x",
  category: "outros",
  amount: 10,
  direction: "expense",
  currency: "BRL",
  origin: "demo",
  ...p,
});

describe("formato brasileiro", () => {
  it("mostra R$ 1.250,00 com duas casas", () => {
    expect(formatBRL(1250)).toBe("R$ 1.250,00");
    expect(formatBRL(847.5)).toBe("R$ 847,50");
  });
});

describe("normalização de sinais", () => {
  it("Plaid: positivo é saída, negativo é entrada", () => {
    expect(normalizePlaidAmount(25.4)).toEqual({ amount: 25.4, direction: "expense" });
    expect(normalizePlaidAmount(-500)).toEqual({ amount: 500, direction: "income" });
  });
  it("Pluggy: direção vem do campo type", () => {
    expect(normalizePluggyAmount(-80, "DEBIT")).toEqual({ amount: 80, direction: "expense" });
    expect(normalizePluggyAmount(1200, "CREDIT")).toEqual({ amount: 1200, direction: "income" });
  });
});

describe("totais", () => {
  it("não conta transferências entre contas próprias", () => {
    const s = summarize([
      tx({ id: "1", amount: 100, direction: "expense" }),
      tx({ id: "2", amount: 100, direction: "transfer" }),
      tx({ id: "3", amount: 300, direction: "income" }),
    ]);
    expect(s).toMatchObject({ income: 300, expense: 100, net: 200 });
  });
  it("não soma a mesma transação duas vezes", () => {
    const t = tx({ id: "dup", amount: 50 });
    expect(summarize([t, t]).expense).toBe(50);
  });
  it("saldo disponível exclui a fatura do cartão", () => {
    const snap = buildDemoSnapshot("2026-11-11", "2026-11-11T12:00:00.000Z");
    const assets = snap.accounts.filter((a) => a.type !== "credit").reduce((s, a) => s + a.balance, 0);
    expect(availableBalance(snap)).toBeCloseTo(assets, 2);
  });
});

describe("períodos em linguagem natural", () => {
  const today = "2026-11-11"; // quarta-feira
  it("semana passada = segunda a domingo anteriores", () => {
    expect(resolvePeriod("quanto gastei semana passada?", today)).toMatchObject({ from: "2026-11-02", to: "2026-11-08" });
  });
  it("mês passado = outubro inteiro", () => {
    expect(resolvePeriod("e no mês passado?", today)).toMatchObject({ from: "2026-10-01", to: "2026-10-31" });
  });
  it("últimos 30 dias inclui hoje", () => {
    expect(resolvePeriod("nos últimos 30 dias", today)).toMatchObject({ from: "2026-10-13", to: "2026-11-11" });
  });
  it("desde janeiro = 1º de janeiro do ano corrente", () => {
    expect(resolvePeriod("desde janeiro", today)).toMatchObject({ from: "2026-01-01", to: today });
  });
  it("comparação do mês usa os mesmos dias do mês anterior", () => {
    expect(monthToDateRanges(today).previous).toMatchObject({ from: "2026-10-01", to: "2026-10-11" });
  });
});

describe("agente de demonstração", () => {
  const snap = buildDemoSnapshot("2026-11-11", "2026-11-11T12:00:00.000Z");
  it("recusa operações financeiras", () => {
    expect(detectIntent("transfira 100 reais para João")).toBe("transfer");
  });
  it("responde saldo com o valor calculado", () => {
    const a = answerQuestion("Quanto tenho disponível atualmente?", snap, "2026-11-11");
    expect(a.content).toContain(formatBRL(availableBalance(snap)));
  });
  it("sem contas conectadas, não inventa números", () => {
    const empty = buildDemoSnapshot("2026-11-11", "2026-11-11T12:00:00.000Z", []);
    const a = answerQuestion("Quanto gastei neste mês?", empty, "2026-11-11");
    expect(a.content).not.toMatch(/R\$/);
  });
  it("detecta assinaturas como recorrentes", () => {
    expect(detectRecurring(snap.transactions).map((r) => r.description)).toContain("StreamFlix");
  });
});
