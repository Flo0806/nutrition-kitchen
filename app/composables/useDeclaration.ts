import type { ComputedRef, InjectionKey } from "vue";
import { declareRecipe, type Declared } from "#shared/utils/declaration";

const key: InjectionKey<ComputedRef<Declared>> = Symbol("declaration");

/** The live declaration of the recipe, calculated once for the page and every row in it. */
export function provideDeclaration() {
  const { rows, options } = useRecipe();
  const { foods } = useFoods();
  const declared = computed(() => declareRecipe(rows.value, foods.value, options.value));
  provide(key, declared);
  return declared;
}

export function useDeclaration() {
  const declared = inject(key);
  if (!declared) throw new Error("useDeclaration needs provideDeclaration in a parent component");
  return declared;
}
