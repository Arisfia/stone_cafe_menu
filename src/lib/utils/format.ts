import type { Currency } from "@/types/models";

const currencyDecimals: Record<Currency, number> = {
  IQD: 0,
  USD: 2,
  EUR: 2,
  TRY: 2
};

export function formatMoney(minorUnits: number, currency: Currency, locale = "en") {
  const decimals = currencyDecimals[currency];
  const amount = minorUnits / 10 ** decimals;
  const formatted = new Intl.NumberFormat(locale === "ckb" ? "ar-IQ" : locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
  return `${formatted} ${currency}`;
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ى]/g, "ي")
    .replace(/[ة]/g, "ه")
    .replace(/[ك]/g, "ک")
    .replace(/[ي]/g, "ی")
    .replace(/\s+/g, " ")
    .trim();
}
