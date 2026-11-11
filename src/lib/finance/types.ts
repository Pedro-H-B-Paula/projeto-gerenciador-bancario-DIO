/** Internal, provider-agnostic financial model. Every provider adapter normalizes into these shapes. */

/** Where the data came from. Always surfaced in the UI and in agent answers. */
export type DataOrigin = "demo" | "sandbox" | "real";
export type ProviderId = "demo" | "plaid" | "pluggy";

/**
 * income/expense count toward results; transfer moves money between the user's own
 * accounts (e.g. paying the card bill) and is excluded from totals to avoid double counting.
 */
export type Direction = "income" | "expense" | "transfer";

export type ConnectionStatus = "active" | "syncing" | "expired" | "error";
export type AccountType = "checking" | "savings" | "credit" | "investment";

export interface Institution {
  id: string;
  name: string;
  provider: ProviderId;
  origin: DataOrigin;
  connectionType: string;
  status: ConnectionStatus;
  lastSyncAt: string; // ISO datetime
  initials: string;
  colorToken: string; // CSS var name, e.g. "--chart-1"
}

export interface Account {
  id: string;
  institutionId: string;
  name: string;
  type: AccountType;
  mask: string;
  /** Balance in the account's original currency. For credit accounts: outstanding debt (positive). */
  balance: number;
  currency: string;
  origin: DataOrigin;
}

export interface Transaction {
  id: string;
  accountId: string;
  institutionId: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: CategoryId;
  /** Always positive. Sign lives in `direction`. */
  amount: number;
  direction: Direction;
  currency: string;
  origin: DataOrigin;
  /** For transfers: the counterpart account inside the user's own accounts. */
  counterpartAccountId?: string;
}

export interface FinancialSnapshot {
  institutions: Institution[];
  accounts: Account[];
  transactions: Transaction[];
  /** When the data was last refreshed (ISO). */
  updatedAt: string;
  origin: DataOrigin;
}

export type CategoryId =
  | "alimentacao"
  | "mercado"
  | "transporte"
  | "moradia"
  | "contas"
  | "assinaturas"
  | "saude"
  | "lazer"
  | "compras"
  | "educacao"
  | "salario"
  | "freelance"
  | "rendimentos"
  | "transferencia"
  | "outros";

export interface DateRange {
  from: string; // YYYY-MM-DD inclusive
  to: string; // YYYY-MM-DD inclusive
  label: string;
}
