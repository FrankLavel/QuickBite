/**
 * validation.ts
 * Validaciones reutilizables para formularios de autenticación y platillos.
 */

export function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function isValidPrice(price: string | number): boolean {
  const value = typeof price === 'string' ? parseFloat(price) : price;
  return !Number.isNaN(value) && value >= 0;
}

export function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Este correo ya está registrado.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-not-found': 'No existe una cuenta con este correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
    'auth/network-request-failed': 'Error de red. Revisa tu conexión.',
    'auth/invalid-api-key': 'Configuración de Firebase incorrecta (apiKey).',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      'Configuración de Firebase incorrecta (apiKey).',
    'auth/operation-not-allowed':
      'El inicio con correo/contraseña no está activado en Firebase.',
    'auth/configuration-not-found':
      'Proyecto Firebase no encontrado. Revisa firebase.ts.',
    'auth/popup-closed-by-user': 'Inicio de sesión con Google cancelado.',
    'auth/cancelled-popup-request': 'Inicio de sesión con Google cancelado.',
    'auth/account-exists-with-different-credential':
      'Este correo ya está registrado con otro método de inicio de sesión.',
    'permission-denied':
      'Sin permiso para leer tu perfil. Revisa las reglas de Firestore.',
  };

  return messages[code] ?? 'Ocurrió un error. Intenta de nuevo.';
}

/** Pasos para publicar reglas (mostrar en pantallas de auth) */
export const FIRESTORE_SETUP_HINT = [
  '1. Abre console.firebase.google.com → proyecto quickbite-6dee7',
  '2. Firestore Database → pestaña Reglas',
  '3. Borra todo y pega el archivo firestore.rules.example de tu proyecto',
  '4. Pulsa Publicar y espera unos segundos',
  '5. Ve a Regístrate ahora (no solo Iniciar sesión) con un correo nuevo',
].join('\n');

/** Mensaje claro cuando Firestore bloquea lectura/escritura */
export function getFirestorePermissionMessage(): string {
  return (
    'Firestore bloqueó guardar tu restaurante. Tus reglas actuales solo permiten ' +
    'clientes (app móvil), no el portal. Debes publicar firestore.rules.example:\n\n' +
    FIRESTORE_SETUP_HINT
  );
}

/** Extrae mensaje útil de errores de Firebase u otros */
export function getErrorMessage(error: unknown): string {
  const err = (error ?? {}) as { code?: string; message?: string };
  const message =
    error instanceof Error ? error.message : (err.message ?? '');

  if (
    err.code === 'permission-denied' ||
    /insufficient permissions/i.test(message) ||
    /permission.denied/i.test(message)
  ) {
    return getFirestorePermissionMessage();
  }

  if (error instanceof Error && message && !message.startsWith('Firebase:')) {
    return message;
  }

  if (err.code) {
    return getAuthErrorMessage(err.code);
  }

  if (message) {
    const match = message.match(/\((auth\/[^)]+)\)/);
    if (match?.[1]) {
      return getAuthErrorMessage(match[1]);
    }
  }

  return 'Ocurrió un error. Intenta de nuevo.';
}
