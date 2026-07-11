/**
 * types/product.ts
 * Subcolección restaurants/{restId}/products/{prodId}
 * y restaurants/{restId}/categories/{catId}
 */

export interface ToppingOption {
  name: string;
  price: number;
}

export interface Topping {
  name: string;
  price: number;
  required: boolean;
  options: ToppingOption[];
}

export interface Category {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageURL: string;
  isAvailable: boolean;
  toppings: Topping[];
  tags: string[];
  order: number;
}

/** Formulario de alta/edición de producto */
export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  imageURL: string;
  isAvailable: boolean;
  tags: string[];
  toppings: Topping[];
  order: number;
  /** URI local de ImagePicker antes de subir a Storage */
  localImageUri?: string;
}
