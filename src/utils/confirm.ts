/**
 * confirm.ts
 * Diálogo de confirmación (sí/no) global.
 * - En web: NO usa window.confirm (feo, fuera del diseño). Publica la solicitud
 *   a un host (ConfirmHost) que renderiza un modal con el estilo del dashboard.
 *   Es un pub/sub simple, igual que utils/notify.ts, así se puede llamar desde
 *   cualquier lugar (handlers, servicios) y solo se espera el booleano.
 * - En nativo: usa Alert.alert.
 */

import { Alert, Platform } from 'react-native';

export interface ConfirmOptions {
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export interface ConfirmRequest {
  id: number;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  destructive: boolean;
  resolve: (ok: boolean) => void;
}

type Listener = (req: ConfirmRequest | null) => void;

let listeners: Listener[] = [];
let current: ConfirmRequest | null = null;
let seq = 0;

/** Suscribe un listener al diálogo activo; devuelve la función para desuscribir. */
export function subscribeConfirm(listener: Listener): () => void {
  listeners.push(listener);
  listener(current);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function setCurrent(req: ConfirmRequest | null) {
  current = req;
  for (const l of listeners) l(current);
}

/** El host resuelve el diálogo activo (confirmar/cancelar) y lo cierra. */
export function resolveConfirm(ok: boolean) {
  const r = current;
  if (!r) return;
  setCurrent(null);
  r.resolve(ok);
}

export function confirmAction(
  title: string,
  message: string,
  options: ConfirmOptions = {}
): Promise<boolean> {
  const {
    confirmText = 'Aceptar',
    cancelText = 'Cancelar',
    destructive = false,
  } = options;

  if (Platform.OS !== 'web') {
    return new Promise((resolve) => {
      Alert.alert(title, message, [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ]);
    });
  }

  return new Promise((resolve) => {
    // Si ya había un diálogo abierto, se descarta como "cancelado".
    if (current) current.resolve(false);
    setCurrent({
      id: ++seq,
      title,
      message,
      confirmText,
      cancelText,
      destructive,
      resolve,
    });
  });
}
