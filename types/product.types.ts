/** Subcolección /restaurants/{restId}/categories/{catId}. Solo lectura. */
export interface Category {
  id: string;
  name: string;
  /** Orden de aparición en el menú (ascendente). */
  order: number;
  /** Solo se muestran al cliente las categorías con isActive = true. */
  isActive: boolean;
}

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

/** Subcolección /restaurants/{restId}/products/{prodId}. Solo lectura. */
export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageURL: string;
  /** Solo se muestran al cliente los productos con isAvailable = true. */
  isAvailable: boolean;
  toppings: Topping[];
  tags: string[];
  /** Orden dentro de la categoría. */
  order: number;
}
