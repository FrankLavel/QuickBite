/**
 * utils/notify.ts
 * Sistema de avisos (toasts) global y sin dependencias. Reemplaza a
 * `Alert.alert` para mensajes informativos, ya que Alert NO se muestra en
 * React Native Web. Es un pub/sub simple: se puede llamar desde cualquier
 * lugar (handlers, servicios) sin necesidad de un hook o contexto.
 *
 * Para diálogos de confirmación (sí/no) usar `confirmAction` de utils/confirm.
 */

export type NotifyType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  type: NotifyType;
  text: string;
  /** Título corto opcional. */
  title?: string;
  /** Acción al tocar la tarjeta (ej. navegar). Muestra indicador tocable. */
  onPress?: () => void;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let listeners: Listener[] = [];
let seq = 0;

function emit() {
  for (const l of listeners) l(toasts);
}

/** Suscribe un listener; devuelve la función para desuscribir. */
export function subscribeToasts(listener: Listener): () => void {
  listeners.push(listener);
  listener(toasts);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

interface NotifyOptions {
  title?: string;
  /** Milisegundos antes de auto-cerrar. 0 = no se cierra solo. */
  durationMs?: number;
  /** Acción al tocar la tarjeta (ej. navegar a una pantalla). */
  onPress?: () => void;
}

/** Muestra un aviso. Devuelve el id (por si se quiere cerrar manualmente). */
export function notify(
  text: string,
  type: NotifyType = 'info',
  options: NotifyOptions = {}
): number {
  const { title, onPress, durationMs = type === 'error' ? 5000 : 3500 } = options;
  const id = ++seq;
  toasts = [...toasts, { id, type, text, title, onPress }];
  emit();
  if (durationMs > 0) {
    setTimeout(() => dismissToast(id), durationMs);
  }
  return id;
}

export const notifySuccess = (text: string, title?: string) =>
  notify(text, 'success', { title });
export const notifyError = (text: string, title?: string) =>
  notify(text, 'error', { title });
export const notifyInfo = (text: string, title?: string) =>
  notify(text, 'info', { title });
