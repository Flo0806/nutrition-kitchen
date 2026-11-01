import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { isWater, takeBakingLoss } from "../../app/utils/bakingLoss";

const flour = { id: 1, code: "C214200", amount: 1000 };
const water = { id: 2, code: "N110000", amount: 600 };
const mineral = { id: 3, code: "N128000", amount: 100 };

describe("takeBakingLoss", () => {
  it("takes the loss off the water: the rolls of the README", () => {
    expect(takeBakingLoss([flour, water], 180)).toEqual({
      rows: [flour, { ...water, amount: 420 }],
      baked: [{ rowId: 2, amount: 420 }],
    });
  });

  it("subtracts exactly", () => {
    const result = takeBakingLoss([{ ...water, amount: 600.5 }], 180.2);
    expect(result).toMatchObject({ baked: [{ amount: 420.3 }] });
  });

  it("empties the first water row before it touches the next", () => {
    expect(takeBakingLoss([flour, water, mineral], 650)).toMatchObject({
      baked: [
        { rowId: 2, amount: 0 },
        { rowId: 3, amount: 50 },
      ],
    });
  });

  it("changes nothing without a loss", () => {
    expect(takeBakingLoss([flour, water], null)).toEqual({ rows: [flour, water], baked: [] });
    expect(takeBakingLoss([flour, water], 0)).toEqual({ rows: [flour, water], baked: [] });
  });

  it("refuses a loss without water, or more than the water", () => {
    expect(takeBakingLoss([flour], 10)).toEqual({ problem: "noWater", water: 0 });
    expect(takeBakingLoss([flour, { ...water, amount: null }], 10)).toMatchObject({
      problem: "noWater",
    });
    expect(takeBakingLoss([flour, water, mineral], 700.5)).toEqual({
      problem: "exceedsWater",
      water: 700,
    });
  });

  it("never makes water negative, and the total loses exactly the loss", () => {
    const grams = fc.integer({ min: 0, max: 100_000 }).map((hundredths) => hundredths / 100);
    fc.assert(
      fc.property(
        fc.array(grams, { minLength: 1, maxLength: 5 }),
        grams,
        grams,
        (waters, other, loss) => {
          const rows = [
            { id: 0, code: "C214200", amount: other },
            ...waters.map((amount, index) => ({ id: index + 1, code: "N110000", amount })),
          ];
          const result = takeBakingLoss(rows, loss);
          const cents = (list: { amount: number | null }[]) =>
            list.reduce((sum, row) => sum + Math.round((row.amount ?? 0) * 100), 0);
          if ("problem" in result) return Math.round(loss * 100) > cents(rows.slice(1));
          return (
            result.rows.every((row) => (row.amount ?? 0) >= 0) &&
            cents(result.rows) === cents(rows) - Math.round(loss * 100)
          );
        },
      ),
    );
  });
});

describe("isWater", () => {
  it("knows drinking, mineral and spring water, nothing else", () => {
    expect(["N110000", "N128000", "N160000"].every((code) => isWater({ code }))).toBe(true);
    expect(isWater({ code: "M111300" })).toBe(false);
    const unknown = {
      fat: null,
      saturates: null,
      carbohydrate: null,
      sugars: null,
      protein: null,
      salt: null,
      fibre: null,
    };
    expect(isWater({ custom: { name: "Wasser", per100g: unknown } })).toBe(false);
  });
});
