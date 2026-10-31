import * as foods from "@thereforejs/foods";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { findFood, foodCode } from "../../server/utils/foods";

const codes = Object.keys(foods);

describe("findFood", () => {
  it("returns names, values and marks of a known food", () => {
    expect(findFood("R459000")).toEqual({
      code: "R459000",
      name: { de: "Backhefe frisch (Frischbackhefe)", en: "Baker's yeast fresh, pressed" },
      per100g: foods.R459000.per100g,
      marks: {},
    });
  });

  it("leaves the source bookkeeping out", () => {
    expect(findFood("C214200")).not.toHaveProperty("sources");
  });

  it("finds every food under its own code", () => {
    for (const code of codes) expect(findFood(code)?.code).toBe(code);
  });

  it("finds nothing for unknown codes and object keys", () => {
    for (const code of ["X999999", "c214200", "", "constructor", "__proto__", "toString"]) {
      expect(findFood(code)).toBeUndefined();
    }
  });

  it("never throws and only answers with the asked code", () => {
    fc.assert(
      fc.property(fc.string(), (code) => {
        const food = findFood(code);
        return food === undefined || food.code === code;
      }),
    );
  });
});

describe("foodCode", () => {
  it("accepts every shipped code and own codes", () => {
    for (const code of [...codes, "H_000001"]) expect(foodCode.safeParse(code).success).toBe(true);
  });

  it("refuses what cannot be a code", () => {
    for (const code of ["", "C21420", "C2142000X", "c214200", "C214 00", "../etc", "<script>"]) {
      expect(foodCode.safeParse(code).success).toBe(false);
    }
  });
});
