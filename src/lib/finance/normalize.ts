import type { Direction } from "./types";

/**
 * Sign conventions differ per provider. Each adapter converts to the internal model:
 * `amount` is always positive and `direction` carries the meaning.
 */

/** Plaid: positive amount = money leaving the account; negative = money entering. */
export function normalizePlaidAmount(amount: number): { amount: number; direction: Direction } {
  return { amount: Math.abs(amount), direction: amount > 0 ? "expense" : "income" };
}

/**
 * Pluggy: each transaction has `type` ("DEBIT" | "CREDIT"). The `type` field is the source of
 * truth for direction; the magnitude is taken from `amount` regardless of its sign.
 */
export function normalizePluggyAmount(
  amount: number,
  type: "DEBIT" | "CREDIT",
): { amount: number; direction: Direction } {
  return { amount: Math.abs(amount), direction: type === "DEBIT" ? "expense" : "income" };
}
