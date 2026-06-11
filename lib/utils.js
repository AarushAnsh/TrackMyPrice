import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const CURRENCY_ALIASES = {
  "₹": "INR",
  $: "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  inr: "INR",
  usd: "USD",
  eur: "EUR",
  gbp: "GBP",
  jpy: "JPY",
};

export function normalizeCurrencyCode(currency, fallback = "USD") {
  if (!currency || typeof currency !== "string") return fallback;

  const trimmed = currency.trim();
  const alias = CURRENCY_ALIASES[trimmed] || CURRENCY_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;

  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{3}$/.test(upper)) return upper;

  return fallback;
}

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
