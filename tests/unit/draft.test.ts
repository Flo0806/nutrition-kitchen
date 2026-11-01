import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { parseDraft, serializeDraft } from "../../app/utils/draft";
import { defaultRecipeOptions, maxAmount } from "../../shared/utils/recipe";

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
const saved = fc.option(
  fc.record({
    id: fc.integer({ min: 1, max: 1_000_000 }),
    title: fc.string({ minLength: 1, maxLength: 120 }).filter((t) => t.trim() === t && t !== ""),
    instructions: fc.string({ maxLength: 200 }).map((t) => t.trim()),
    image: fc.option(fc.stringMatching(/^[a-z0-9]{16}\.webp$/), { nil: null }),
  }),
  { nil: null },
);

const draft = fc.record({
  saved,
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
    bakingLoss: fc.option(grams, { nil: null }),
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
    expect(
      parseDraft(serializeDraft({ rows, options: defaultRecipeOptions, saved: null })),
    ).toEqual({
      rows: [{ code: "C214200", amount: 500 }],
      options: defaultRecipeOptions,
      saved: null,
    });
  });

  it("reads a draft from before label options with the defaults", () => {
    const old = '{"version":1,"rows":[{"code":"C214200","amount":500}]}';
    expect(parseDraft(old)).toEqual({
      rows: [{ code: "C214200", amount: 500 }],
      options: defaultRecipeOptions,
      saved: null,
    });
  });

  it("reads label options from before the baking loss", () => {
    const old =
      '{"version":1,"rows":[],"options":{"pieceWeight":60,"voluntary":[],"referenceIntake":true}}';
    expect(parseDraft(old)).toMatchObject({ options: { pieceWeight: 60, bakingLoss: null } });
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
