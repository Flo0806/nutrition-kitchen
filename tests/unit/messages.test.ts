import type { DiagnosticCode } from "@thereforejs/nutrition";
import { describe, expect, it } from "vitest";
import de from "../../i18n/locales/de.json";
import en from "../../i18n/locales/en.json";

// Typed as a record, so a code the library adds fails the typecheck until it has a sentence.
const codes = Object.keys({
  "input.invalid": true,
  "options.invalid": true,
  "pieceWeight.zero": true,
  "weight.zero": true,
  "value.missing": true,
  "salt.sodiumMismatch": true,
  "value.above100": true,
  "value.partExceedsWhole": true,
  "value.unknownKey": true,
  "value.invalid": true,
} satisfies Record<DiagnosticCode, true>);

const lookup = (messages: object, path: string): unknown =>
  path
    .split(".")
    .reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], messages);

describe.each([
  ["German", de],
  ["English", en],
])("%s messages", (_, messages) => {
  it.each(codes)("say what %s means", (code) => {
    expect(lookup(messages, `label.diagnostics.${code}`)).toEqual(expect.any(String));
  });

  it("hold the same keys as the other language", () => {
    const keys = (node: object, prefix = ""): string[] =>
      Object.entries(node).flatMap(([key, value]) =>
        typeof value === "object" ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
      );
    expect(keys(messages).sort()).toEqual(keys(de).sort());
  });
});
