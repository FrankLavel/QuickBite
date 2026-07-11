/**
 * confirm.ts
 * Diálogo de confirmación compatible con web y móvil.
 * Alert.alert no muestra nada en React Native Web.
 */

import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
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

  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(window.confirm(text));
  }

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
