import type { Diagnostic, NutrientKey } from "@thereforejs/nutrition";
import type { FoodEntry } from "#shared/types/food";
import { explainGap, type ReportedNutrient } from "~/utils/declaration";
import { labelLocales } from "~/utils/labelText";

/** Report and refusals as plain sentences, in the language of the interface. */
export function useLabelText() {
  const { t, locale } = useI18n();
  const language = computed(() => (locale.value === "en" ? "en" : "de"));

  function nutrientName(key: NutrientKey): string {
    const labels: Partial<Record<NutrientKey, string>> = labelLocales[language.value].labels;
    return labels[key] ?? t(`label.nutrients.${key}`);
  }

  const list = (keys: NutrientKey[]) =>
    new Intl.ListFormat(locale.value, { type: "conjunction" }).format(keys.map(nutrientName));

  function describeGap(food: FoodEntry | undefined, nutrients: ReportedNutrient[]): string {
    const { missing, belowDetection, traces, energyShort } = explainGap(food, nutrients);
    return [
      missing.length > 0 && t("label.gaps.missing", { nutrients: list(missing) }),
      belowDetection.length > 0 &&
        t("label.gaps.belowDetection", { nutrients: list(belowDetection) }),
      traces.length > 0 && t("label.gaps.traces", { nutrients: list(traces) }),
      energyShort && t("label.gaps.energy"),
    ]
      .filter(Boolean)
      .join(" ");
  }

  function describeProblem(diagnostic: Diagnostic): string {
    if (diagnostic.code === "value.partExceedsWhole") {
      const { part, whole } = diagnostic.params;
      return t(`label.diagnostics.${diagnostic.code}`, {
        part: nutrientName(part),
        whole: nutrientName(whole),
      });
    }
    return t(`label.diagnostics.${diagnostic.code}`, diagnostic.params);
  }

  return { describeGap, describeProblem };
}
