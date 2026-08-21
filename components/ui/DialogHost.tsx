import { useDialogStore } from '@/store/dialogStore';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Host global de diálogos: se monta una sola vez en el layout raíz y renderiza
 * el aviso/confirmación en cola (ver `showAlert`/`showConfirm` en dialogStore).
 * Permite disparar diálogos temáticos desde cualquier lugar —incluso hooks y
 * servicios— sin estado local ni el `Alert.alert` nativo.
 */
export function DialogHost() {
  const current = useDialogStore((s) => s.queue[0]);
  const resolveTop = useDialogStore((s) => s.resolveTop);

  return (
    <ConfirmDialog
      visible={!!current}
      title={current?.title ?? ''}
      message={current?.message ?? ''}
      confirmLabel={current?.confirmLabel ?? ''}
      cancelLabel={current?.cancelLabel ?? ''}
      hideCancel={current?.hideCancel ?? true}
      destructive={current?.destructive ?? false}
      onConfirm={() => resolveTop(true)}
      onCancel={() => resolveTop(false)}
    />
  );
}
