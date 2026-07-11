/**
 * services/categoryService.ts
 * Subcolección restaurants/{restId}/categories/{catId}
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, RESTAURANT_SUB } from '../utils/constants';
import type { Category } from '../types/product';

function categoriesRef(restaurantId: string) {
  return collection(
    db,
    COLLECTIONS.RESTAURANTS,
    restaurantId,
    RESTAURANT_SUB.CATEGORIES
  );
}

function mapCategory(id: string, data: Record<string, unknown>): Category {
  return {
    id,
    name: (data.name as string) ?? '',
    order: Number(data.order) || 0,
    isActive: data.isActive !== false,
  };
}

export async function getCategories(restaurantId: string): Promise<Category[]> {
  const q = query(categoriesRef(restaurantId), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapCategory(d.id, d.data()));
}

export async function createCategory(
  restaurantId: string,
  name: string,
  order = 0
): Promise<Category> {
  const payload = { name: name.trim(), order, isActive: true };
  const ref = await addDoc(categoriesRef(restaurantId), payload);
  return mapCategory(ref.id, payload);
}

export async function updateCategory(
  restaurantId: string,
  categoryId: string,
  updates: Partial<Pick<Category, 'name' | 'order' | 'isActive'>>
): Promise<void> {
  await updateDoc(
    doc(
      db,
      COLLECTIONS.RESTAURANTS,
      restaurantId,
      RESTAURANT_SUB.CATEGORIES,
      categoryId
    ),
    updates
  );
}

export async function deleteCategory(
  restaurantId: string,
  categoryId: string
): Promise<void> {
  await deleteDoc(
    doc(
      db,
      COLLECTIONS.RESTAURANTS,
      restaurantId,
      RESTAURANT_SUB.CATEGORIES,
      categoryId
    )
  );
}
