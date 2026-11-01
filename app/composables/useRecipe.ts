import type { LabelOptions } from "~/utils/declaration";
import { defaultLabelOptions, parseDraft, serializeDraft } from "~/utils/draft";
import type { Source } from "~/utils/material";

export type RecipeRow = Source & { id: number; amount: number | null };

const storageKey = "nutrition-kitchen:draft";
let nextId = 1;

/** The recipe being edited: one row per ingredient in the order of the list, and its label options. */
export function useRecipe() {
  const rows = useState<RecipeRow[]>("recipe-rows", () => []);
  const options = useState<LabelOptions>("recipe-options", () => ({ ...defaultLabelOptions }));
  const { load } = useFoods();

  function add(source: Source, amount: number | null = null): RecipeRow {
    const row = { ...source, id: nextId++, amount };
    rows.value.push(row);
    if ("code" in source) load(source.code);
    return row;
  }

  /** Replaces what a row is, keeping its place and amount: an edited raw material. */
  function replace(id: number, source: Source) {
    const index = rows.value.findIndex((row) => row.id === id);
    const row = rows.value[index];
    if (row) rows.value.splice(index, 1, { ...source, id, amount: row.amount });
  }

  function remove(id: number) {
    rows.value = rows.value.filter((row) => row.id !== id);
  }

  function setAmount(id: number, amount: number | null) {
    const row = rows.value.find((candidate) => candidate.id === id);
    if (row) row.amount = amount;
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= rows.value.length) return;
    const [row] = rows.value.splice(from, 1);
    if (row) rows.value.splice(to, 0, row);
  }

  return { rows, options, add, replace, remove, setAmount, move };
}

/**
 * Mirrors the recipe to localStorage on every change and restores it once on load. Call it in one
 * component only.
 */
export function useRecipeDraft() {
  const { rows, options, add } = useRecipe();
  const toast = useToast();
  const { t } = useI18n();

  onMounted(() => {
    const draft = parseDraft(localStorage.getItem(storageKey));
    if (draft === "broken") {
      localStorage.removeItem(storageKey);
      toast.add({ title: t("builder.draftBroken"), color: "warning" });
    } else if (draft && rows.value.length === 0) {
      for (const { amount, ...source } of draft.rows) add(source, amount);
      options.value = draft.options;
    }
    watch(
      [rows, options],
      () =>
        localStorage.setItem(
          storageKey,
          serializeDraft({ rows: rows.value, options: options.value }),
        ),
      { deep: true },
    );
  });
}
