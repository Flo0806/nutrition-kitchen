import { describe, expect, it } from "vitest";
import { checkMaterial } from "../../shared/utils/material";
import type { CustomMaterial } from "../../shared/utils/source";

const sheet = (values: Partial<CustomMaterial["per100g"]>): CustomMaterial["per100g"] => ({
  fat: "0.4",
  saturates: "0.08",
  carbohydrate: "12.5",
  sugars: null,
  protein: "40.2",
  salt: "1.25",
  fibre: null,
  ...values,
});

describe("checkMaterial", () => {
  it("accepts a supplier sheet with unknown values", () => {
    expect(checkMaterial(sheet({}))).toEqual([]);
  });

  it("puts more sugars than carbohydrate at the sugars field", () => {
    expect(checkMaterial(sheet({ carbohydrate: "20", sugars: "35" }))).toMatchObject([
      {
        field: "sugars",
        diagnostic: {
          code: "value.partExceedsWhole",
          params: { part: "sugars", whole: "carbohydrate" },
        },
      },
    ]);
  });

  it("refuses more than 100 g in 100 g at its field", () => {
    expect(checkMaterial(sheet({ protein: "140" }))).toMatchObject([
      { field: "protein", diagnostic: { code: "value.above100" } },
    ]);
  });

  // The library stops at its first refusal; the next one shows once the first is fixed.
  it("names the first refusal, then the next", () => {
    const both = sheet({ fat: "1", saturates: "2", carbohydrate: "1", sugars: "2" });
    expect(checkMaterial(both).map((problem) => problem.field)).toEqual(["sugars"]);
    expect(checkMaterial({ ...both, sugars: "1" }).map((problem) => problem.field)).toEqual([
      "saturates",
    ]);
  });
});
