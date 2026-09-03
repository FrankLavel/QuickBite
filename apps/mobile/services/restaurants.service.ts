import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { Restaurant } from '@/types/restaurant.types';
import { Category, Product } from '@/types/product.types';

const restaurantsCol = () => collection(db, 'restaurants');
const categoriesCol = (restId: string) =>
  collection(db, 'restaurants', restId, 'categories');
const productsCol = (restId: string) =>
  collection(db, 'restaurants', restId, 'products');

// Nota: el filtrado y ordenamiento se hacen en cliente para no requerir
// índices compuestos en Firestore. Para catálogos grandes conviene mover esto
// a queries con índices (ver índices recomendados del doc).

export const restaurantsService = {
  /** Home: restaurantes abiertos ordenados por rating (desc). */
  getOpenRestaurants: async (): Promise<Restaurant[]> => {
    const snap = await getDocs(restaurantsCol());
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Restaurant))
      .filter((r) => r.isOpen)
      .sort((a, b) => b.rating - a.rating);
  },

  /** Filtro del Home por tipo de cocina (entre los abiertos). */
  getByCuisine: async (cuisine: string): Promise<Restaurant[]> => {
    const snap = await getDocs(restaurantsCol());
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Restaurant))
      .filter((r) => r.isOpen && r.cuisineTypes.includes(cuisine))
      .sort((a, b) => b.rating - a.rating);
  },

  getById: async (id: string): Promise<Restaurant | null> => {
    const snap = await getDoc(doc(db, 'restaurants', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Restaurant) : null;
  },

  /** Favorites: trae varios restaurantes por id. */
  getByIds: async (ids: string[]): Promise<Restaurant[]> => {
    const snaps = await Promise.all(
      ids.map((id) => getDoc(doc(db, 'restaurants', id)))
    );
    return snaps
      .filter((s) => s.exists())
      .map((s) => ({ id: s.id, ...s.data() } as Restaurant));
  },

  // — Catálogo (subcolecciones, solo lectura) —

  /** Categorías visibles del menú, ordenadas. */
  getCategories: async (restId: string): Promise<Category[]> => {
    const snap = await getDocs(categoriesCol(restId));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Category))
      .filter((c) => c.isActive)
      .sort((a, b) => a.order - b.order);
  },

  /** Productos disponibles de una categoría. */
  getProductsByCategory: async (
    restId: string,
    categoryId: string
  ): Promise<Product[]> => {
    const snap = await getDocs(productsCol(restId));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Product))
      .filter((p) => p.categoryId === categoryId && p.isAvailable)
      .sort((a, b) => a.order - b.order);
  },

  /** Todos los productos disponibles del restaurante (menú completo). */
  getProducts: async (restId: string): Promise<Product[]> => {
    const snap = await getDocs(productsCol(restId));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Product))
      .filter((p) => p.isAvailable)
      .sort((a, b) => a.order - b.order);
  },

  getProductById: async (
    restId: string,
    prodId: string
  ): Promise<Product | null> => {
    const snap = await getDoc(doc(db, 'restaurants', restId, 'products', prodId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Product) : null;
  },

  // — Listeners en tiempo real (onSnapshot) —
  // Reflejan al instante los cambios que hace el restaurante desde el dashboard.
  // Cada uno devuelve la función para cancelar la suscripción.

  /** Home: restaurantes abiertos ordenados por rating (desc), en vivo. */
  listenOpenRestaurants: (
    onData: (list: Restaurant[]) => void,
    onError?: (error: Error) => void
  ): (() => void) => {
    return onSnapshot(
      restaurantsCol(),
      (snap) => {
        onData(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Restaurant))
            .filter((r) => r.isOpen)
            // Orden neutral (alfabético): no entierra a los restaurantes nuevos
            // sin puntuación. El orden por rating es opt-in desde los filtros.
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      },
      (error) => onError?.(error)
    );
  },

  /** Home filtrado por tipo de cocina (entre los abiertos), en vivo. */
  listenByCuisine: (
    cuisine: string,
    onData: (list: Restaurant[]) => void,
    onError?: (error: Error) => void
  ): (() => void) => {
    return onSnapshot(
      restaurantsCol(),
      (snap) => {
        onData(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Restaurant))
            .filter((r) => r.isOpen && r.cuisineTypes.includes(cuisine))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      },
      (error) => onError?.(error)
    );
  },

  /** Detalle: documento del restaurante, en vivo. */
  listenById: (
    id: string,
    onData: (restaurant: Restaurant | null) => void,
    onError?: (error: Error) => void
  ): (() => void) => {
    return onSnapshot(
      doc(db, 'restaurants', id),
      (snap) => {
        onData(
          snap.exists() ? ({ id: snap.id, ...snap.data() } as Restaurant) : null
        );
      },
      (error) => onError?.(error)
    );
  },

  /** Categorías visibles del menú, en vivo. */
  listenCategories: (
    restId: string,
    onData: (list: Category[]) => void,
    onError?: (error: Error) => void
  ): (() => void) => {
    return onSnapshot(
      categoriesCol(restId),
      (snap) => {
        onData(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Category))
            .filter((c) => c.isActive)
            .sort((a, b) => a.order - b.order)
        );
      },
      (error) => onError?.(error)
    );
  },

  /** Productos disponibles del restaurante (menú completo), en vivo. */
  listenProducts: (
    restId: string,
    onData: (list: Product[]) => void,
    onError?: (error: Error) => void
  ): (() => void) => {
    return onSnapshot(
      productsCol(restId),
      (snap) => {
        onData(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Product))
            .filter((p) => p.isAvailable)
            .sort((a, b) => a.order - b.order)
        );
      },
      (error) => onError?.(error)
    );
  },
};
