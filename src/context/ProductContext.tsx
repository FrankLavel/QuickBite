/**
 * context/ProductContext.tsx
 * Estado del menú: productos y categorías del restaurante autenticado.
 */

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  setProductAvailability,
} from '../services/productService';
import {
  getCategories,
  createCategory,
} from '../services/categoryService';
import { useAuth } from '../hooks/useAuth';
import type { Product, ProductFormData, Category } from '../types/product';

interface ProductContextValue {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addProduct: (form: ProductFormData) => Promise<void>;
  editProduct: (productId: string, form: ProductFormData) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  toggleAvailability: (productId: string, isAvailable: boolean) => Promise<void>;
  addCategory: (name: string) => Promise<Category>;
  getProduct: (productId: string) => Product | undefined;
}

export const ProductContext = createContext<ProductContextValue | undefined>(
  undefined
);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const restaurantId = user?.restaurantId;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId) {
      setProducts([]);
      setCategories([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [prods, cats] = await Promise.all([
        getProducts(restaurantId),
        getCategories(restaurantId),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo cargar el menú'
      );
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addProduct = useCallback(
    async (form: ProductFormData) => {
      if (!restaurantId) return;
      setLoading(true);
      try {
        const created = await createProduct(restaurantId, form);
        setProducts((prev) => [...prev, created]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudo crear el producto'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [restaurantId]
  );

  const editProduct = useCallback(
    async (productId: string, form: ProductFormData) => {
      if (!restaurantId) return;
      setLoading(true);
      try {
        await updateProduct(restaurantId, productId, form);
        await refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudo actualizar el producto'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [restaurantId, refresh]
  );

  const removeProduct = useCallback(
    async (productId: string) => {
      if (!restaurantId) return;
      setLoading(true);
      try {
        await deleteProduct(restaurantId, productId);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudo eliminar el producto'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [restaurantId]
  );

  const toggleAvailability = useCallback(
    async (productId: string, isAvailable: boolean) => {
      if (!restaurantId) return;
      await setProductAvailability(restaurantId, productId, isAvailable);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isAvailable } : p))
      );
    },
    [restaurantId]
  );

  const addCategory = useCallback(
    async (name: string) => {
      if (!restaurantId) throw new Error('Sin restaurante');
      const cat = await createCategory(restaurantId, name, categories.length);
      setCategories((prev) => [...prev, cat]);
      return cat;
    },
    [restaurantId, categories.length]
  );

  const getProduct = useCallback(
    (productId: string) => products.find((p) => p.id === productId),
    [products]
  );

  const value = useMemo(
    () => ({
      products,
      categories,
      loading,
      error,
      refresh,
      addProduct,
      editProduct,
      removeProduct,
      toggleAvailability,
      addCategory,
      getProduct,
    }),
    [
      products,
      categories,
      loading,
      error,
      refresh,
      addProduct,
      editProduct,
      removeProduct,
      toggleAvailability,
      addCategory,
      getProduct,
    ]
  );

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}
