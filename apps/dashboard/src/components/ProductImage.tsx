/**
 * components/ProductImage.tsx
 * Imagen de platillo con fallback si la URL falla o está vacía.
 */

import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';
import {
  PLACEHOLDER_IMAGE,
  normalizeImageUrl,
} from '../utils/imageUrl';

interface ProductImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  dimmed?: boolean;
}

export function ProductImage({ uri, style, dimmed }: ProductImageProps) {
  const normalized = normalizeImageUrl(uri);
  const [displayUri, setDisplayUri] = useState(
    normalized ?? PLACEHOLDER_IMAGE
  );

  useEffect(() => {
    setDisplayUri(normalized ?? PLACEHOLDER_IMAGE);
  }, [normalized]);

  return (
    <Image
      source={{ uri: displayUri }}
      style={[style, dimmed && { opacity: 0.55 }]}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      onError={() => {
        if (displayUri !== PLACEHOLDER_IMAGE) {
          setDisplayUri(PLACEHOLDER_IMAGE);
        }
      }}
    />
  );
}
