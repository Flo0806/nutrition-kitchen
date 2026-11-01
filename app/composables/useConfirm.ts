import { LazyConfirmModal } from "#components";

/** Asks a yes or no question in a dialog; resolves `true` only on the confirm button. */
export function useConfirm() {
  const modal = useOverlay().create(LazyConfirmModal);
  return async (props: {
    title: string;
    description?: string;
    confirm: string;
    danger?: boolean;
  }) => (await modal.open(props).result) === true;
}
