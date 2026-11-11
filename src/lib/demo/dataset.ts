/**
 * Demonstration dataset. Fictional institutions and transactions, generated deterministically
 * (seeded per month) so the same day always shows the same numbers. Always labeled "demo".
 */
import { addMonths, endOfMonth, startOfMonth } from "@/lib/finance/dates";
import { round2 } from "@/lib/finance/format";
import type { Account, CategoryId, Direction, FinancialSnapshot, Institution, Transaction } from "@/lib/finance/types";

export const DEMO_INSTITUTIONS: Institution[] = [
  {
    id: "demo-aurora",
    name: "Banco Aurora",
    provider: "demo",
    origin: "demo",
    connectionType: "Demonstração",
    status: "active",
    lastSyncAt: "",
    initials: "BA",
    colorToken: "--chart-1",
  },
  {
    id: "demo-nimbus",
    name: "Nimbus Cartões",
    provider: "demo",
    origin: "demo",
    connectionType: "Demonstração",
    status: "active",
    lastSyncAt: "",
    initials: "NC",
    colorToken: "--chart-2",
  },
];

const CHECKING = "demo-aurora-cc";
const SAVINGS = "demo-aurora-poup";
const CARD = "demo-nimbus-card";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Draft {
  day: number;
  accountId: string;
  description: string;
  category: CategoryId;
  amount: number;
  direction: Direction;
  counterpartAccountId?: string;
}

function generateMonth(monthStart: string, isCurrent: boolean, prevCardTotal: number | null): Draft[] {
  const [y, m] = monthStart.split("-").map(Number);
  const rnd = mulberry32(y * 100 + m);
  const between = (a: number, b: number) => round2(a + rnd() * (b - a));
  const int = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1));
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
  const last = Number(endOfMonth(monthStart).slice(8, 10));
  const d: Draft[] = [];
  const add = (x: Draft) => d.push(x);

  add({ day: 1, accountId: SAVINGS, description: "Rendimento poupança", category: "rendimentos", amount: between(78, 96), direction: "income" });
  add({ day: 5, accountId: CHECKING, description: "Salário — Empresa Exemplo Ltda", category: "salario", amount: 7850, direction: "income" });
  if (rnd() < 0.55) add({ day: 18, accountId: CHECKING, description: "Pix recebido — Projeto freelance", category: "freelance", amount: between(900, 2200), direction: "income" });

  add({ day: 6, accountId: CHECKING, description: "Transferência para poupança", category: "transferencia", amount: 800, direction: "transfer", counterpartAccountId: SAVINGS });
  if (prevCardTotal !== null && prevCardTotal > 0)
    add({ day: 8, accountId: CHECKING, description: "Pagamento de fatura — Nimbus", category: "transferencia", amount: round2(prevCardTotal), direction: "transfer", counterpartAccountId: CARD });

  add({ day: 10, accountId: CHECKING, description: "Aluguel", category: "moradia", amount: 2350, direction: "expense" });
  add({ day: 10, accountId: CHECKING, description: "Condomínio", category: "moradia", amount: 480, direction: "expense" });
  add({ day: 12, accountId: CHECKING, description: "Internet fibra", category: "contas", amount: 119.9, direction: "expense" });
  add({ day: 15, accountId: CHECKING, description: "Conta de luz", category: "contas", amount: between(188, 232), direction: "expense" });
  add({ day: 20, accountId: CARD, description: "Plano de celular", category: "contas", amount: 59.9, direction: "expense" });

  add({ day: 2, accountId: CARD, description: "Academia Movimento", category: "saude", amount: 129.9, direction: "expense" });
  add({ day: 3, accountId: CARD, description: "StreamFlix", category: "assinaturas", amount: 55.9, direction: "expense" });
  add({ day: 7, accountId: CARD, description: "SomPlay Música", category: "assinaturas", amount: 21.9, direction: "expense" });
  add({ day: 14, accountId: CARD, description: "Nuvem Backup", category: "assinaturas", amount: 9.9, direction: "expense" });

  const foodBoost = isCurrent ? 1.18 : 1;
  const food = ["Delivery — Sabor Caseiro", "Padaria Pão Dourado", "Restaurante Bistrô 21", "Café Grão Nobre", "Burger Station", "Sushi Kenzo"];
  for (let i = 0, n = int(10, 15); i < n; i++)
    add({ day: int(1, last), accountId: CARD, description: pick(food), category: "alimentacao", amount: round2(between(26, 135) * foodBoost), direction: "expense" });

  const grocery = ["Supermercado Bom Preço", "Hortifruti Central", "Atacadão Econômico"];
  for (let i = 0, n = int(3, 5); i < n; i++)
    add({ day: int(1, last), accountId: CARD, description: pick(grocery), category: "mercado", amount: between(140, 330), direction: "expense" });

  for (let i = 0, n = int(6, 12); i < n; i++)
    add({ day: int(1, last), accountId: CARD, description: "Corrida por app — VaiJá", category: "transporte", amount: between(14, 48), direction: "expense" });
  for (let i = 0; i < 2; i++)
    add({ day: int(1, last), accountId: CARD, description: "Posto Rota Sul", category: "transporte", amount: between(205, 262), direction: "expense" });

  for (let i = 0, n = int(1, 2); i < n; i++)
    add({ day: int(1, last), accountId: CARD, description: "Drogaria Vida", category: "saude", amount: between(32, 160), direction: "expense" });

  const fun = ["Cine Arte", "Ingresso — Show ao vivo", "Bar do Centro", "Parque Aventura"];
  for (let i = 0, n = int(2, 4); i < n; i++)
    add({ day: int(1, last), accountId: CARD, description: pick(fun), category: "lazer", amount: between(40, 210), direction: "expense" });

  const shop = ["Loja Online Mix", "Moda Urbana", "Casa & Decor"];
  for (let i = 0, n = int(1, 3); i < n; i++)
    add({ day: int(1, last), accountId: CARD, description: pick(shop), category: "compras", amount: between(80, 380), direction: "expense" });
  if (rnd() < 0.5) add({ day: int(1, last), accountId: CARD, description: "Livraria Página", category: "educacao", amount: between(45, 120), direction: "expense" });

  return d;
}

/** Builds the demo snapshot for `today` (YYYY-MM-DD), covering the current and previous 6 months. */
export function buildDemoSnapshot(today: string, updatedAt: string, enabledInstitutionIds?: string[]): FinancialSnapshot {
  const first = addMonths(startOfMonth(today), -6);
  const all: Transaction[] = [];
  let prevCardTotal: number | null = null;
  for (let i = 0; i <= 6; i++) {
    const ms = addMonths(first, i);
    const fullMonth = generateMonth(ms, i === 6, prevCardTotal);
    const drafts = fullMonth
      .map((x) => ({ ...x, date: `${ms.slice(0, 8)}${String(x.day).padStart(2, "0")}` }))
      .filter((x) => x.date <= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    // Card bill paid next month = purchases of this whole month.
    prevCardTotal = fullMonth.filter((x) => x.accountId === CARD && x.direction === "expense").reduce((s, x) => s + x.amount, 0);
    drafts.forEach((x, j) => {
      all.push({
        id: `demo-${ms.slice(0, 7)}-${String(j).padStart(3, "0")}`,
        accountId: x.accountId,
        institutionId: x.accountId === CARD ? "demo-nimbus" : "demo-aurora",
        date: x.date,
        description: x.description,
        category: x.category,
        amount: round2(x.amount),
        direction: x.direction,
        currency: "BRL",
        origin: "demo",
        counterpartAccountId: x.counterpartAccountId,
      });
    });
  }

  // Balances from flows, starting from fixed opening balances.
  let checking = 9500;
  let savings = 15000;
  let card = 0;
  for (const t of all) {
    if (t.accountId === CHECKING) {
      if (t.direction === "income") checking += t.amount;
      else checking -= t.amount;
      if (t.direction === "transfer" && t.counterpartAccountId === SAVINGS) savings += t.amount;
      if (t.direction === "transfer" && t.counterpartAccountId === CARD) card -= t.amount;
    } else if (t.accountId === SAVINGS) {
      if (t.direction === "income") savings += t.amount;
      else savings -= t.amount;
    } else if (t.accountId === CARD) {
      if (t.direction === "expense") card += t.amount;
    }
  }

  const accounts: Account[] = [
    { id: CHECKING, institutionId: "demo-aurora", name: "Conta corrente", type: "checking", mask: "4821", balance: round2(checking), currency: "BRL", origin: "demo" },
    { id: SAVINGS, institutionId: "demo-aurora", name: "Poupança", type: "savings", mask: "0937", balance: round2(savings), currency: "BRL", origin: "demo" },
    { id: CARD, institutionId: "demo-nimbus", name: "Cartão Platinum", type: "credit", mask: "7710", balance: round2(Math.max(card, 0)), currency: "BRL", origin: "demo" },
  ];

  const enabled = new Set(enabledInstitutionIds ?? DEMO_INSTITUTIONS.map((i) => i.id));
  const institutions = DEMO_INSTITUTIONS.filter((i) => enabled.has(i.id)).map((i) => ({ ...i, lastSyncAt: updatedAt }));
  // When one institution is disconnected its accounts and transactions disappear. Transfers whose
  // counterpart disappeared stay as transfers (still excluded from totals).
  return {
    institutions,
    accounts: accounts.filter((a) => enabled.has(a.institutionId)),
    transactions: all.filter((t) => enabled.has(t.institutionId)),
    updatedAt,
    origin: "demo",
  };
}
