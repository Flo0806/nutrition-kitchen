import type { DeclaredValue, Label, NutritionResult } from "@thereforejs/nutrition";
import { de, en } from "@thereforejs/nutrition/locales";
import { formatAmount } from "~/utils/amount";

export const labelLocales = { de, en } as const;
export type LabelLanguage = keyof typeof labelLocales;

// The words of the label itself, in the label's language (the UI may be in another one).
const headings: Record<
  LabelLanguage,
  { title: string; per100g: string; perPiece: string; referenceIntake: string }
> = {
  de: {
    title: "Nährwerte",
    per100g: "pro 100\u00a0g",
    perPiece: "pro Stück",
    referenceIntake: "% RM*",
  },
  en: {
    title: "Nutrition declaration",
    per100g: "per 100\u00a0g",
    perPiece: "per piece",
    referenceIntake: "% RI*",
  },
};

type Row = Exclude<Label, "energy" | "ofWhich" | "referenceIntake" | "sodium">;

// Annex XV: the order of the declaration; sub-rows read "of which".
const order: { key: Row; sub: boolean }[] = [
  { key: "fat", sub: false },
  { key: "saturates", sub: true },
  { key: "monounsaturates", sub: true },
  { key: "polyunsaturates", sub: true },
  { key: "carbohydrate", sub: false },
  { key: "sugars", sub: true },
  { key: "polyols", sub: true },
  { key: "starch", sub: true },
  { key: "fibre", sub: false },
  { key: "protein", sub: false },
  { key: "salt", sub: false },
];

/** A cell holds one line per unit: energy is kJ above kcal, as on a package. */
export type LabelCell = string[];

export type LabelRow = {
  key: Row | "energy";
  label: string;
  sub: boolean;
  per100g: LabelCell;
  perPiece: LabelCell | undefined;
  referenceIntake: LabelCell | undefined;
};

export type LabelTable = {
  title: string;
  columns: { per100g: string; perPiece: string | undefined; referenceIntake: string | undefined };
  rows: LabelRow[];
  statement: string | undefined;
};

/** The declaration as it goes on the package, in one language: the table and the copied text. */
export function labelTable(
  result: NutritionResult,
  language: LabelLanguage,
  pieceWeight: number | null,
): LabelTable {
  const { locale, labels } = labelLocales[language];
  const text = (value: DeclaredValue | undefined) => [value?.text[locale] ?? ""];
  const percent = (value: DeclaredValue | undefined) => {
    const found = value?.referenceIntake?.text[locale];
    return found === undefined ? undefined : [found];
  };
  const words = headings[language];
  const { per100g, perPiece, referenceIntakeStatement } = result;

  const energy: LabelRow = {
    key: "energy",
    label: labels.energy,
    sub: false,
    per100g: [...text(per100g.energy.kJ), ...text(per100g.energy.kcal)],
    perPiece: perPiece && [...text(perPiece.energy.kJ), ...text(perPiece.energy.kcal)],
    referenceIntake: percent(per100g.energy.kJ),
  };
  const nutrients = order
    .filter(({ key }) => per100g[key] !== undefined)
    .map(({ key, sub }) => ({
      key,
      label: sub ? `${labels.ofWhich} ${labels[key]}` : labels[key],
      sub,
      per100g: text(per100g[key]),
      perPiece: perPiece && text(perPiece[key]),
      referenceIntake: percent(per100g[key]),
    }));

  return {
    title: words.title,
    columns: {
      per100g: words.per100g,
      perPiece:
        perPiece && pieceWeight !== null
          ? `${words.perPiece} (${formatAmount(pieceWeight, language)}\u00a0g)`
          : undefined,
      referenceIntake: referenceIntakeStatement ? words.referenceIntake : undefined,
    },
    rows: [energy, ...nutrients],
    statement: referenceIntakeStatement && `* ${referenceIntakeStatement[locale]}`,
  };
}

/** The table as plain text, columns padded, for a mail or a document. */
export function labelText({ title, columns, rows, statement }: LabelTable): string {
  const lines = [
    ["", columns.per100g, columns.perPiece, columns.referenceIntake],
    ...rows.map((row) => [
      row.label,
      ...[row.per100g, row.perPiece, row.referenceIntake].map((cell) => cell?.join(" / ")),
    ]),
  ];
  // A column without any value (no piece weight, no % RI) is left out.
  const used = [0, 1, 2, 3].filter((column) => lines.some((line) => line[column] !== undefined));
  const width = (column: number) => Math.max(...lines.map((line) => (line[column] ?? "").length));
  const table = lines.map((line) =>
    used
      .map((column) => (line[column] ?? "").padEnd(width(column)))
      .join("  ")
      .trimEnd(),
  );
  return [title, ...table, ...(statement ? ["", statement] : [])].join("\n");
}
