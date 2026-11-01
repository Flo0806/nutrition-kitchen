import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { formatAmount, parseAmount, parseDecimal } from "../../app/utils/amount";
import { maxAmount } from "../../app/utils/draft";

const languages = ["de", "en"] as const;
// Amounts as the field shows them: whole grams or up to two decimals.
const amount = fc.integer({ min: 0, max: maxAmount * 100 }).map((cents) => cents / 100);

describe("parseAmount", () => {
  it("reads back everything formatAmount writes", () => {
    for (const language of languages) {
      fc.assert(
        fc.property(
          amount,
          (value) => parseAmount(formatAmount(value, language), language) === value,
        ),
      );
    }
  });

  it.each([
    ["500", 500, 500],
    ["12,5", 12.5, 12.5],
    ["12.5", 12.5, 12.5],
    ["0,5", 0.5, 0.5],
    [",5", 0.5, 0.5],
    ["1.000", 1000, 1],
    ["1,000", 1, 1000],
    ["1.234,56", 1234.56, "invalid"],
    ["1,234.56", "invalid", 1234.56],
    ["12.000.000", "invalid", "invalid"],
    [" 2 5 0 ", 250, 250],
    ["", null, null],
    ["   ", null, null],
    ["-5", "invalid", "invalid"],
    ["-0", "invalid", "invalid"],
    ["1e3", "invalid", "invalid"],
    ["abc", "invalid", "invalid"],
    ["1,2,3", "invalid", "invalid"],
    ["Infinity", "invalid", "invalid"],
    [String(maxAmount + 1), "invalid", "invalid"],
  ])("reads %j as %j in German and %j in English", (text, de, en) => {
    expect(parseAmount(text, "de")).toBe(de);
    expect(parseAmount(text, "en")).toBe(en);
  });

  it("never throws and never returns a negative or too large amount", () => {
    fc.assert(
      fc.property(fc.string(), fc.constantFrom(...languages), (text, language) => {
        const result = parseAmount(text, language);
        return typeof result !== "number" || (result >= 0 && result <= maxAmount);
      }),
    );
  });
});

describe("formatAmount", () => {
  it("writes the language's decimal mark without grouping", () => {
    expect(formatAmount(1234.5, "de")).toBe("1234,5");
    expect(formatAmount(1234.5, "en")).toBe("1234.5");
    expect(formatAmount(null, "de")).toBe("");
  });
});

describe("parseDecimal", () => {
  it.each([
    ["12,5", "12.5"],
    ["012,50", "12.5"],
    ["0,08", "0.08"],
    ["40,2", "40.2"],
    ["1.250,5", "1250.5"],
    ["", null],
    ["1e3", "invalid"],
    ["9".repeat(25), "invalid"],
  ])("reads %j in German as %j", (text, expected) => {
    expect(parseDecimal(text, "de")).toBe(expected);
  });

  it("only ever answers plain decimal text", () => {
    fc.assert(
      fc.property(fc.string(), fc.constantFrom(...languages), (text, language) => {
        const result = parseDecimal(text, language);
        return result === null || result === "invalid" || /^\d+(\.\d+)?$/.test(result);
      }),
    );
  });

  // Built as strings on both sides, so no float arithmetic hides an error.
  it("keeps every value with up to three decimals exactly", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100_000 }), (thousandths) => {
        const digits = String(thousandths).padStart(4, "0");
        const [whole, fraction] = [digits.slice(0, -3), digits.slice(-3)];
        const trimmed = fraction.replace(/0+$/, "");
        const expected = `${Number(whole)}${trimmed ? `.${trimmed}` : ""}`;
        return parseDecimal(`${whole},${fraction}`, "de") === expected;
      }),
    );
  });
});
