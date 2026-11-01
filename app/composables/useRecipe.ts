import type { RecipeOptions } from "#shared/utils/declaration";
import { defaultRecipeOptions } from "#shared/utils/recipe";
import { parseDraft, serializeDraft, type SavedRecipe } from "~/utils/draft";
import type { Source } from "#shared/utils/source";

export type RecipeRow = Source & { id: number; amount: number | null };

const storageKey = "nutrition-kitchen:draft";
let nextId = 1;

type Contents = { rows: (Source & { amount: number | null })[]; options: RecipeOptions };

/**
 * The recipe being edited: one row per ingredient in the order of the list, its label options, and
 * the saved recipe it came from, if any.
 */
export function useRecipe() {
  const rows = useState<RecipeRow[]>("recipe-rows", () => []);
  const options = useState<RecipeOptions>("recipe-options", () => ({ ...defaultRecipeOptions }));
  const saved = useState<SavedRecipe | null>("recipe-saved", () => null);
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

  /** Puts a whole recipe into the builder, replacing what was there. */
  function open(contents: Contents, from: SavedRecipe | null) {
    rows.value = [];
    for (const { amount, ...source } of contents.rows) add(source, amount);
    options.value = { ...contents.options };
    saved.value = from;
  }

  function startNew() {
    open({ rows: [], options: defaultRecipeOptions }, null);
  }

  return { rows, options, saved, add, replace, remove, setAmount, move, open, startNew };
}

/**
 * Mirrors the recipe to localStorage on every change and restores it once on load. Call it in one
 * component only.
 */
export function useRecipeDraft() {
  const { rows, options, saved, open } = useRecipe();
  const toast = useToast();
  const { t } = useI18n();

  onMounted(() => {
    const draft = parseDraft(localStorage.getItem(storageKey));
    if (draft === "broken") {
      localStorage.removeItem(storageKey);
      toast.add({ title: t("builder.draftBroken"), color: "warning" });
    } else if (draft && rows.value.length === 0) {
      open(draft, draft.saved);
    }
    watch(
      [rows, options, saved],
      () =>
        localStorage.setItem(
          storageKey,
          serializeDraft({ rows: rows.value, options: options.value, saved: saved.value }),
        ),
      { deep: true },
    );
  });
}
