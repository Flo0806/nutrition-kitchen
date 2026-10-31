import type { Finder, Hit } from "@thereforejs/food-finder/de";

type Language = "de" | "en";

// Static imports per language, so the bundler splits them and loads only the one in use.
const loaders: Record<Language, () => Promise<Finder>> = {
  de: async () => {
    const [{ createFinder }, { meanings }, { names }] = await Promise.all([
      import("@thereforejs/food-finder/de"),
      import("@thereforejs/food-finder/de/meanings"),
      import("@thereforejs/foods/names/de"),
    ]);
    return createFinder(names, { meanings: [meanings] });
  },
  en: async () => {
    const [{ createFinder }, { meanings }, { names }] = await Promise.all([
      import("@thereforejs/food-finder/en"),
      import("@thereforejs/food-finder/en/meanings"),
      import("@thereforejs/foods/names/en"),
    ]);
    return createFinder(names, { meanings: [meanings] });
  },
};

// One finder per language for the whole session; it holds every name prepared for searching and
// stays out of Vue's reactivity.
const finders = new Map<Language, Promise<Finder>>();

/** Searches foods by what people type, in the current language. Names load on first use. */
export function useFoodFinder() {
  const { locale } = useI18n();
  const language = computed<Language>(() => (locale.value === "en" ? "en" : "de"));

  function finder() {
    let found = finders.get(language.value);
    if (!found) {
      found = loaders[language.value]().then(markRaw);
      finders.set(language.value, found);
    }
    return found;
  }

  async function search(query: string): Promise<Hit[]> {
    if (!query.trim()) return [];
    return (await finder()).search(query, { limit: 8 });
  }

  return { prepare: finder, search };
}

/** The finder's rule: take a hit without asking only when it is the one exact hit. */
export function directHit(hits: Hit[]): Hit | undefined {
  const [first] = hits;
  if (first?.match !== "exact") return undefined;
  return hits.filter((hit) => hit.match === "exact").length === 1 ? first : undefined;
}
