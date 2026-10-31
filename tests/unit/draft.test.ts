import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { defaultLabelOptions, maxAmount, parseDraft, serializeDraft } from "../../app/utils/draft";

const grams = fc.double({ min: 0, max: maxAmount, noNaN: true }).map((g) => (g === 0 ? 0 : g));
const draft = fc.record({
  rows: fc.array(
    fc.record({
      code: fc.stringMatching(/^[A-Z][A-Z0-9_]{6,7}$/),
      amount: fc.option(grams, { nil: null }),
    }),
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
    ];
    for (const text of broken) expect(parseDraft(text), text).toBe("broken");
    fc.assert(fc.property(fc.string(), (text) => parseDraft(text) !== undefined));
  });
});
