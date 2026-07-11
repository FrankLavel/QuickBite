/**
 * services/storageService.ts
 * Rutas de Storage según el PDF:
 * /restaurants/{restId}/products/{prodId}.jpg
 * /restaurants/{restId}/logo.jpg | cover.jpg
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

const UPLOAD_TIMEOUT_MS = 45_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

async function uriToBlob(localUri: string): Promise<Blob> {
  const response = await fetch(localUri);
  if (!response.ok) {
    throw new Error('No se pudo leer la imagen seleccionada');
  }
  const blob = await response.blob();
  if (!blob.size) {
    throw new Error('La imagen está vacía o no es válida');
  }
  return blob;
}

async function uploadUri(path: string, localUri: string): Promise<string> {
  const blob = await uriToBlob(localUri);
  const storageRef = ref(storage, path);
  const contentType = blob.type?.startsWith('image/')
    ? blob.type
    : 'image/jpeg';

  await withTimeout(
    uploadBytes(storageRef, blob, { contentType }),
    UPLOAD_TIMEOUT_MS,
    'La subida tardó demasiado. Verifica las reglas de Firebase Storage ' +
      '(Firebase Console → Storage → Reglas) y tu conexión.'
  );

  return getDownloadURL(storageRef);
}

export async function uploadProductImage(
  restaurantId: string,
  productId: string,
  localUri: string
): Promise<string> {
  try {
    return await uploadUri(
      `restaurants/${restaurantId}/products/${productId}.jpg`,
      localUri
    );
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === 'storage/unauthorized') {
      throw new Error(
        'Sin permiso para subir imágenes. Publica las reglas de Storage en Firebase Console.'
      );
    }
    throw error;
  }
}

export async function uploadRestaurantLogo(
  restaurantId: string,
  localUri: string
): Promise<string> {
  return uploadUri(`restaurants/${restaurantId}/logo.jpg`, localUri);
}

export async function uploadRestaurantCover(
  restaurantId: string,
  localUri: string
): Promise<string> {
  return uploadUri(`restaurants/${restaurantId}/cover.jpg`, localUri);
}

export async function uploadOfferImage(
  restaurantId: string,
  offerId: string,
  localUri: string
): Promise<string> {
  return uploadUri(`offers/${restaurantId}/${offerId}.jpg`, localUri);
}

export async function deleteStoragePath(path: string): Promise<void> {
  try {
    await deleteObject(ref(storage, path));
  } catch {
    // Ignorar si el archivo no existe
  }
}
