// Ids the builder moves the keyboard focus between: search, then grams, then back to search.
export const searchInputId = "food-search";
export const amountInputId = (rowId: number) => `amount-${rowId}`;
export const moveHandleId = (rowId: number) => `move-${rowId}`;

export function focusById(id: string) {
  document.getElementById(id)?.focus();
}
