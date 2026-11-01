import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { defaultLabelOptions, maxAmount, parseDraft, serializeDraft } from "../../app/utils/draft";

const grams = fc.double({ min: 0, max: maxAmount, noNaN: true }).map((g) => (g === 0 ? 0 : g));
const amount = fc.option(grams, { nil: null });
const decimalText = fc.option(fc.stringMatching(/^[1-9]?\d(\.\d{1,3}[1-9])?$/), { nil: null });
const custom = fc.record({
  name: fc
    .string({ minLength: 1, maxLength: 120 })
    .filter((name) => name.trim() === name && name !== ""),
  per100g: fc.record({
    fat: decimalText,
    saturates: decimalText,
    carbohydrate: decimalText,
    sugars: decimalText,
    protein: decimalText,
    salt: decimalText,
    fibre: decimalText,
  }),
});
const draft = fc.record({
  rows: fc.array(
    fc.oneof(
      fc.record({ code: fc.stringMatching(/^[A-Z][A-Z0-9_]{6,7}$/), amount }),
      fc.record({ custom, amount }),
    ),
    { maxLength: 200 },
  ),
  options: fc.record({
    pieceWeight: fc.option(grams, { nil: null }),
    voluntary: fc.uniqueArray(
      fc.constantFrom("monounsaturates", "polyunsaturates", "polyols", "starch", "fibre" as const),
    ),
    referenceIntake: fc.boolean(),
  }),
});

describe("draft", () => {
  it("round-trips every recipe with its label options", () => {
    fc.assert(
      fc.property(draft, (value) => {
        expect(parseDraft(serializeDraft(value))).toEqual(value);
      }),
    );
  });

  it("drops extra fields of a row", () => {
    const rows = [{ code: "C214200", amount: 500, name: "Mehl" }];
    expect(parseDraft(serializeDraft({ rows, options: defaultLabelOptions }))).toEqual({
      rows: [{ code: "C214200", amount: 500 }],
      options: defaultLabelOptions,
    });
  });

  it("reads a draft from before label options with the defaults", () => {
    const old = '{"version":1,"rows":[{"code":"C214200","amount":500}]}';
    expect(parseDraft(old)).toEqual({
      rows: [{ code: "C214200", amount: 500 }],
      options: defaultLabelOptions,
    });
  });

  it("reads nothing as nothing", () => {
    expect(parseDraft(null)).toBeNull();
  });

  it("calls everything else broken and never throws", () => {
    const broken = [
      "",
      "{",
      "null",
      "[]",
      '{"version":2,"rows":[]}',
      '{"version":1,"rows":[{"code":"nope","amount":1}]}',
      '{"version":1,"rows":[{"code":"C214200","amount":-1}]}',
      '{"version":1,"rows":[{"code":"C214200","amount":"500"}]}',
      `{"version":1,"rows":[{"code":"C214200","amount":${maxAmount + 1}}]}`,
      '{"version":1,"rows":[],"options":{"pieceWeight":null,"voluntary":["energy"],"referenceIntake":false}}',
      '{"version":1,"rows":[{"custom":{"name":"","per100g":{}},"amount":1}]}',
      '{"version":1,"rows":[{"custom":{"name":"X","per100g":{"fat":"1,5"}},"amount":1}]}',
    ];
    for (const text of broken) expect(parseDraft(text), text).toBe("broken");
    fc.assert(fc.property(fc.string(), (text) => parseDraft(text) !== undefined));
  });
});
