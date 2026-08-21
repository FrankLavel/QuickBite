/**
 * share.ts
 * Compartir restaurantes y platillos con un enlace https que genera vista previa
 * rica (imagen + título + descripción) en WhatsApp/redes. El enlace apunta a una
 * página con Open Graph servida por la Cloud Function `share` (vía Firebase
 * Hosting); al abrirla hay un botón para entrar a la app (deep link quickbite://).
 *
 * Solo texto + enlace → funciona igual en Android e iOS y es JS puro (OTA), sin
 * módulos nativos.
 */

import { Share } from 'react-native';
import { useLangStore } from '@/store/langStore';
import { translate } from '@/lib/i18n';
import type { Restaurant } from '@/types/restaurant.types';
import type { Product } from '@/types/product.types';

// Base de las páginas de compartir (Firebase Hosting → función `share`).
const SHARE_BASE = 'https://quickbite-6dee7.web.app';

const tr = (key: string, params?: Record<string, string | number>) =>
  translate(useLangStore.getState().lang, key, params);

const money = (n: number) => `$${n.toFixed(2)}`;

async function shareMessage(message: string): Promise<void> {
  try {
    await Share.share({ message });
  } catch {
    // Cancelado por el usuario: no molestar.
  }
}

/** Comparte un restaurante: enlace con vista previa (portada, nombre, cocina). */
export function shareRestaurant(restaurant: Restaurant): Promise<void> {
  const link = `${SHARE_BASE}/r/${restaurant.id}`;
  return shareMessage(
    tr('share.restaurantMsg', {
      name: restaurant.name,
      cuisines: restaurant.cuisineTypes.join(' · '),
      rating: restaurant.rating.toFixed(1),
      link,
    })
  );
}

/** Comparte un platillo: enlace con vista previa (foto, nombre, precio). */
export function shareProduct(product: Product, restaurant: Restaurant): Promise<void> {
  const link = `${SHARE_BASE}/p/${restaurant.id}/${product.id}`;
  return shareMessage(
    tr('share.productMsg', {
      name: product.name,
      price: money(product.price),
      restaurant: restaurant.name,
      link,
    })
  );
}
