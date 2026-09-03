/**
 * components/LiveMap.web.tsx
 * Versión WEB del mapa: embed de OpenStreetMap por <iframe> con un marcador en
 * la posición del repartidor. Sin API key ni dependencias externas.
 *
 * Nota: en React Native Web el renderer final es ReactDOM, así que un <iframe>
 * (elemento del DOM) se renderiza correctamente. Se castea el tag para evitar
 * depender de los tipos JSX del DOM en el proyecto RN.
 */
import type { ComponentType } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../utils/theme';
import type { LiveMapProps } from './LiveMap';

// Tag DOM tipado como componente para no requerir JSX.IntrinsicElements del DOM.
const Iframe = 'iframe' as unknown as ComponentType<{
  src: string;
  title: string;
  style: Record<string, unknown>;
  loading?: string;
}>;

export function LiveMap({ lat, lng, height = 320 }: LiveMapProps) {
  // Caja (bbox) pequeña alrededor del punto para un zoom cercano.
  const d = 0.006;
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  const src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
    `&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <View style={[styles.wrap, { height }]}>
      <Iframe
        src={src}
        title="Ubicación del repartidor"
        loading="lazy"
        style={{ border: '0', width: '100%', height: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
