import type { ComputedRef, InjectionKey } from "vue";
import { declareRecipe, type Declared, type RecipeOptions } from "#shared/utils/declaration";
import type { RecipeRow } from "~/composables/useRecipe";

type Recipe = { rows: Readonly<Ref<RecipeRow[]>>; options: Readonly<Ref<RecipeOptions>> };
type Context = Recipe & { declared: ComputedRef<Declared> };

const key: InjectionKey<Context> = Symbol("declaration");

/**
 * The live declaration of a recipe, calculated once for the page and every row in it: the one in
 * the builder, or a shared one to read.
 */
export function provideDeclaration(recipe: Recipe = useRecipe()) {
  const { foods } = useFoods();
  const declared = computed(() =>
    declareRecipe(recipe.rows.value, foods.value, recipe.options.value),
  );
  provide(key, { ...recipe, declared });
  return declared;
}

export function useDeclaration() {
  const context = inject(key);
  if (!context) throw new Error("useDeclaration needs provideDeclaration in a parent component");
  return context;
}
