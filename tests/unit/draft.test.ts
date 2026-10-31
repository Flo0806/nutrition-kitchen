import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { maxAmount, parseDraft, serializeDraft, type DraftRow } from "../../app/utils/draft";

const row = fc.record({
  code: fc.stringMatching(/^[A-Z][A-Z0-9_]{6,7}$/),
  amount: fc.option(fc.double({ min: 0, max: maxAmount, noNaN: true }), { nil: null }),
});

describe("draft", () => {
  it("round-trips every recipe", () => {
    fc.assert(
      fc.property(fc.array(row, { maxLength: 200 }), (rows: DraftRow[]) => {
        // -0 is stored as 0, which is the same amount.
        const expected = rows.map((r) => ({ ...r, amount: r.amount === 0 ? 0 : r.amount }));
        expect(parseDraft(serializeDraft(rows))).toEqual(expected);
      }),
    );
  });

  it("drops extra fields of a row", () => {
    const rows = [{ code: "C214200", amount: 500, name: "Mehl" }] as DraftRow[];
    expect(parseDraft(serializeDraft(rows))).toEqual([{ code: "C214200", amount: 500 }]);
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
    ];
    for (const text of broken) expect(parseDraft(text), text).toBe("broken");
    fc.assert(fc.property(fc.string(), (text) => parseDraft(text) !== undefined));
  });
});
