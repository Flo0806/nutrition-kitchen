import { maxAmount } from "~/utils/draft";

type Language = "de" | "en";

const separators: Record<Language, { decimal: string; group: string }> = {
  de: { decimal: ",", group: "." },
  en: { decimal: ".", group: "," },
};

/**
 * A decimal as people type it, as exact decimal text ("12,5" is "12.5"). The language's decimal mark
 * always works; the other mark counts as a thousands separator only when groups of three follow
 * ("1.000" in German is 1000), otherwise as a decimal mark too ("12.5" means 12,5). Empty is `null`,
 * anything else unreadable is `"invalid"`.
 */
export function parseDecimal(text: string, language: Language): string | null | "invalid" {
  const { decimal, group } = separators[language];
  const compact = text.replace(/\s/g, "");
  if (compact === "") return null;

  const grouped = new RegExp(`^\\d{1,3}(\\${group}\\d{3})+(\\${decimal}\\d+)?$`);
  const normalized = grouped.test(compact)
    ? compact.replaceAll(group, "").replace(decimal, ".")
    : compact.replace(/[.,]/, ".");
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(normalized)) return "invalid";
  // Shortest spelling ("012.50" is "12.5"); from 1e21 on JavaScript would write an exponent.
  const value = Number(normalized);
  return value < 1e21 ? String(value) : "invalid";
}

/** Grams as people type them, at most one tonne. */
export function parseAmount(text: string, language: Language): number | null | "invalid" {
  const decimal = parseDecimal(text, language);
  if (decimal === null || decimal === "invalid") return decimal;
  const amount = Number(decimal);
  return amount <= maxAmount ? amount : "invalid";
}

/** Grams for the input field: no grouping, at most two decimals, the language's decimal mark. */
export function formatAmount(amount: number | null, language: Language): string {
  if (amount === null) return "";
  return new Intl.NumberFormat(language, { maximumFractionDigits: 2, useGrouping: false }).format(
    amount,
  );
}
