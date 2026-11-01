import { LazyBuilderMaterialModal } from "#components";
import type { CustomMaterial } from "~/utils/material";

/** Asks for a raw material of one's own; resolves with it, or `undefined` when cancelled. */
export function useMaterialForm() {
  const modal = useOverlay().create(LazyBuilderMaterialModal);
  return (initial?: { name?: string; per100g?: CustomMaterial["per100g"] }) =>
    modal.open({ initial }).result;
}
