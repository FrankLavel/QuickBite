import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Convierte un URI local (file://) en Blob usando XMLHttpRequest.
 * En React Native, `fetch(uri).blob()` produce un Blob que el SDK de Firebase
 * no serializa bien y la subida falla con `storage/unknown`. Este método con
 * XHR es el recomendado por la documentación de Firebase para RN.
 */
function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('No se pudo leer la imagen local'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

export const storageService = {
  /**
   * Sube la foto de perfil del usuario a Storage y devuelve su URL de descarga.
   * Usa un nombre con timestamp para forzar una URL nueva en cada cambio (evita
   * que la caché muestre la foto anterior). La URL resultante se guarda en
   * users/{uid}.photoURL (Firestore).
   */
  uploadUserAvatar: async (uid: string, localUri: string): Promise<string> => {
    const blob = await uriToBlob(localUri);
    const avatarRef = ref(storage, `users/${uid}/avatar_${Date.now()}.jpg`);
    try {
      await uploadBytes(avatarRef, blob, { contentType: 'image/jpeg' });
    } finally {
      // El Blob de XHR en RN expone close() para liberar memoria.
      (blob as unknown as { close?: () => void }).close?.();
    }
    return getDownloadURL(avatarRef);
  },

  /** Borra un archivo por su URL (de descarga o gs://). Best-effort: ignora errores. */
  deleteByUrl: async (url: string): Promise<void> => {
    try {
      await deleteObject(ref(storage, url));
    } catch {
      // el archivo no existe o no se pudo borrar: se ignora
    }
  },
};
