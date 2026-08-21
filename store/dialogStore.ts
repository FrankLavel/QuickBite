import { create } from 'zustand';
import { useLangStore } from '@/store/langStore';
import { translate } from '@/lib/i18n';

/** Una petición de diálogo en cola (aviso o confirmación). */
export interface DialogRequest {
  id: number;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
  hideCancel: boolean;
  resolve: (ok: boolean) => void;
}

interface DialogState {
  /** Cola de diálogos; se muestra siempre el primero. */
  queue: DialogRequest[];
  enqueue: (req: DialogRequest) => void;
  /** Resuelve el diálogo actual y avanza al siguiente. */
  resolveTop: (ok: boolean) => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  queue: [],
  enqueue: (req) => set((s) => ({ queue: [...s.queue, req] })),
  resolveTop: (ok) => {
    const [top, ...rest] = get().queue;
    top?.resolve(ok);
    set({ queue: rest });
  },
}));

let counter = 0;
const tr = (key: string) => translate(useLangStore.getState().lang, key);

interface AlertOptions {
  title: string;
  message: string;
  /** Etiqueta del único botón. Default: "Entendido". */
  confirmLabel?: string;
}

interface ConfirmOptions extends AlertOptions {
  /** Etiqueta del botón de cancelar. Default: "Cancelar". */
  cancelLabel?: string;
  /** Botón de confirmar en rojo (acción destructiva). */
  destructive?: boolean;
}

/**
 * Aviso informativo temático (un solo botón). Reemplaza a `Alert.alert` de un
 * botón y respeta el sistema de diseño + modo claro/oscuro. La promesa se
 * resuelve cuando el usuario cierra el aviso.
 */
export function showAlert(opts: AlertOptions): Promise<void> {
  return new Promise((resolve) => {
    useDialogStore.getState().enqueue({
      id: ++counter,
      title: opts.title,
      message: opts.message,
      confirmLabel: opts.confirmLabel ?? tr('common.gotIt'),
      cancelLabel: '',
      destructive: false,
      hideCancel: true,
      resolve: () => resolve(),
    });
  });
}

/**
 * Confirmación temática (dos botones). Reemplaza a `Alert.alert` con acciones.
 * La promesa resuelve `true` si el usuario confirma, `false` si cancela o cierra.
 */
export function showConfirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    useDialogStore.getState().enqueue({
      id: ++counter,
      title: opts.title,
      message: opts.message,
      confirmLabel: opts.confirmLabel ?? tr('common.gotIt'),
      cancelLabel: opts.cancelLabel ?? tr('common.cancel'),
      destructive: opts.destructive ?? false,
      hideCancel: false,
      resolve,
    });
  });
}
