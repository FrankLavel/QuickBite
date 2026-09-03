import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/users.service';

/** Clave de un platillo favorito. */
export const productKey = (restaurantId: string, productId: string) =>
  `${restaurantId}|${productId}`;

/**
 * Maneja favoritos (restaurantes y platillos) leyendo del store y sincronizando
 * con Firestore. Actualización optimista con reversión si falla.
 */
export function useFavorites() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const favoriteIds = user?.favoriteIds ?? [];
  const favoriteProductIds = user?.favoriteProductIds ?? [];

  // — Restaurantes —
  const isFavorite = (restaurantId: string) => favoriteIds.includes(restaurantId);

  const toggleFavorite = async (restaurantId: string) => {
    if (!user) return;
    const wasFavorite = favoriteIds.includes(restaurantId);
    const next = wasFavorite
      ? favoriteIds.filter((id) => id !== restaurantId)
      : [...favoriteIds, restaurantId];

    setUser({ ...user, favoriteIds: next });
    try {
      if (wasFavorite) await usersService.removeFavorite(user.uid, restaurantId);
      else await usersService.addFavorite(user.uid, restaurantId);
    } catch {
      setUser({ ...user, favoriteIds });
    }
  };

  // — Platillos —
  const isFavoriteProduct = (restaurantId: string, productId: string) =>
    favoriteProductIds.includes(productKey(restaurantId, productId));

  const toggleFavoriteProduct = async (restaurantId: string, productId: string) => {
    if (!user) return;
    const key = productKey(restaurantId, productId);
    const wasFavorite = favoriteProductIds.includes(key);
    const next = wasFavorite
      ? favoriteProductIds.filter((k) => k !== key)
      : [...favoriteProductIds, key];

    setUser({ ...user, favoriteProductIds: next });
    try {
      if (wasFavorite) await usersService.removeFavoriteProduct(user.uid, key);
      else await usersService.addFavoriteProduct(user.uid, key);
    } catch {
      setUser({ ...user, favoriteProductIds });
    }
  };

  return {
    favoriteIds,
    favoriteProductIds,
    isFavorite,
    toggleFavorite,
    isFavoriteProduct,
    toggleFavoriteProduct,
  };
}
