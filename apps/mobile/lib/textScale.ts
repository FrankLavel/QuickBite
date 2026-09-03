import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

/**
 * Escala de texto global para accesibilidad ("Texto más grande"). Se aplica
 * parcheando el render de <Text> para multiplicar el fontSize ya resuelto por
 * NativeWind. El root actualiza la escala con setTextScale() y re-renderiza el
 * árbol, así todos los textos toman el nuevo tamaño.
 *
 * Es defensivo: ante cualquier problema devuelve el elemento original, así que
 * en el peor caso simplemente no escala (nunca rompe el texto).
 */
let scale = 1;

export function setTextScale(next: number) {
  scale = next;
}

const anyText = RNText as unknown as {
  render?: (...args: unknown[]) => React.ReactElement | null;
  __scalePatched?: boolean;
};

if (anyText.render && !anyText.__scalePatched) {
  anyText.__scalePatched = true;
  const originalRender = anyText.render.bind(anyText);
  anyText.render = function patchedRender(...args: unknown[]) {
    const element = originalRender(...args);
    try {
      if (scale === 1 || !element) return element;
      const flat = StyleSheet.flatten((element.props as { style?: unknown }).style) as
        | { fontSize?: number; lineHeight?: number }
        | undefined;
      if (!flat || typeof flat.fontSize !== 'number') return element;
      const extra: { fontSize: number; lineHeight?: number } = {
        fontSize: flat.fontSize * scale,
      };
      if (typeof flat.lineHeight === 'number') extra.lineHeight = flat.lineHeight * scale;
      return React.cloneElement(element, {
        style: [(element.props as { style?: unknown }).style, extra],
      } as Partial<typeof element.props>);
    } catch {
      return element;
    }
  };
}
