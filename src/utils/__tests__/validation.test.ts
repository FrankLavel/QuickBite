/**
 * Tests de utils/validation.ts — validaciones de formularios y traducción de
 * errores de Firebase a mensajes en español.
 */
import {
  isValidEmail,
  isValidPassword,
  isValidPrice,
  getAuthErrorMessage,
  getErrorMessage,
} from '../validation';

describe('isValidEmail', () => {
  it('acepta correos válidos y recorta espacios', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('  user@example.com  ')).toBe(true);
  });

  it('rechaza correos mal formados', () => {
    expect(isValidEmail('user@example')).toBe(false);
    expect(isValidEmail('user example.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('exige al menos 6 caracteres', () => {
    expect(isValidPassword('12345')).toBe(false);
    expect(isValidPassword('123456')).toBe(true);
  });
});

describe('isValidPrice', () => {
  it('acepta números y strings numéricos no negativos', () => {
    expect(isValidPrice(0)).toBe(true);
    expect(isValidPrice('10.5')).toBe(true);
    expect(isValidPrice('0')).toBe(true);
  });

  it('rechaza negativos y no numéricos', () => {
    expect(isValidPrice(-1)).toBe(false);
    expect(isValidPrice('abc')).toBe(false);
  });
});

describe('getAuthErrorMessage', () => {
  it('traduce códigos conocidos', () => {
    expect(getAuthErrorMessage('auth/invalid-credential')).toBe(
      'Correo o contraseña incorrectos.'
    );
  });

  it('devuelve mensaje genérico ante código desconocido', () => {
    expect(getAuthErrorMessage('auth/lo-que-sea')).toBe(
      'Ocurrió un error. Intenta de nuevo.'
    );
  });
});

describe('getErrorMessage', () => {
  it('detecta permission-denied y muestra la ayuda de reglas', () => {
    const msg = getErrorMessage({ code: 'permission-denied' });
    expect(msg).toContain('Firestore');
  });

  it('extrae el código auth/... embebido en el mensaje', () => {
    const err = new Error('Firebase: Error (auth/wrong-password).');
    expect(getErrorMessage(err)).toBe('Contraseña incorrecta.');
  });

  it('devuelve el mensaje de un Error normal no-Firebase', () => {
    expect(getErrorMessage(new Error('Falló la red local'))).toBe(
      'Falló la red local'
    );
  });

  it('cae al mensaje genérico ante valores desconocidos', () => {
    expect(getErrorMessage(undefined)).toBe(
      'Ocurrió un error. Intenta de nuevo.'
    );
  });
});
