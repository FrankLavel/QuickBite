/**
 * services/productService.ts
 * CRUD restaurants/{restId}/products/{prodId}
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { uploadProductImage } from './storageService';
import { COLLECTIONS, RESTAURANT_SUB } from '../utils/constants';
import { normalizeImageUrl } from '../utils/imageUrl';
import type { Product, ProductFormData } from '../types/product';

function productsRef(restaurantId: string) {
  return collection(
    db,
    COLLECTIONS.RESTAURANTS,
    restaurantId,
    RESTAURANT_SUB.PRODUCTS
  );
}

function productDoc(restaurantId: string, productId: string) {
  return doc(
    db,
    COLLECTIONS.RESTAURANTS,
    restaurantId,
    RESTAURANT_SUB.PRODUCTS,
    productId
  );
}

function mapProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    categoryId: (data.categoryId as string) ?? '',
    name: (data.name as string) ?? '',
    description: (data.description as string) ?? '',
    price: Number(data.price) || 0,
    imageURL: normalizeImageUrl(data.imageURL as string) ?? '',
    isAvailable: data.isAvailable !== false,
    toppings: (data.toppings as Product['toppings']) ?? [],
    tags: (data.tags as string[]) ?? [],
    order: Number(data.order) || 0,
  };
}

export async function getProducts(restaurantId: string): Promise<Product[]> {
  const q = query(productsRef(restaurantId), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapProduct(d.id, d.data()));
}

export async function getProductById(
  restaurantId: string,
  productId: string
): Promise<Product | null> {
  const snap = await getDoc(productDoc(restaurantId, productId));
  if (!snap.exists()) return null;
  return mapProduct(snap.id, snap.data());
}

export async function createProduct(
  restaurantId: string,
  form: ProductFormData
): Promise<Product> {
  const docRef = doc(productsRef(restaurantId));
  let imageURL = normalizeImageUrl(form.imageURL) ?? '';

  // Subir primero; si falla, no se crea el documento en Firestore
  if (form.localImageUri) {
    imageURL = await uploadProductImage(
      restaurantId,
      docRef.id,
      form.localImageUri
    );
  }

  const payload = {
    categoryId: form.categoryId,
    name: form.name.trim(),
    description: form.description.trim(),
    price: parseFloat(form.price) || 0,
    imageURL,
    isAvailable: form.isAvailable,
    toppings: form.toppings,
    tags: form.tags,
    order: form.order,
  };

  await setDoc(docRef, payload);
  return mapProduct(docRef.id, payload);
}

export async function updateProduct(
  restaurantId: string,
  productId: string,
  form: ProductFormData
): Promise<void> {
  let imageURL = normalizeImageUrl(form.imageURL) ?? '';

  if (form.localImageUri) {
    imageURL = await uploadProductImage(
      restaurantId,
      productId,
      form.localImageUri
    );
  }

  await setDoc(
    productDoc(restaurantId, productId),
    {
      categoryId: form.categoryId,
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price) || 0,
      imageURL,
      isAvailable: form.isAvailable,
      toppings: form.toppings,
      tags: form.tags,
      order: form.order,
    },
    { merge: true }
  );
}

export async function setProductAvailability(
  restaurantId: string,
  productId: string,
  isAvailable: boolean
): Promise<void> {
  await updateDoc(productDoc(restaurantId, productId), { isAvailable });
}

export async function deleteProduct(
  restaurantId: string,
  productId: string
): Promise<void> {
  await deleteDoc(productDoc(restaurantId, productId));
}
