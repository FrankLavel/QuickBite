/**
 * pwa.ts
 * Convierte el build web en una PWA instalable (acceso directo al escritorio)
 * y mejora la ficha que ve Google. Todo corre solo en el navegador.
 *
 * Como el proyecto usa React Navigation (no Expo Router), no hay un HTML
 * propio donde meter estas etiquetas, así que las inyectamos en runtime.
 */

import { Platform } from 'react-native';

const THEME_COLOR = '#2caf4b';
const DESCRIPTION =
  'Panel de administración QuickBite para restaurantes: gestiona pedidos, ' +
  'promociones, horarios y liquidaciones en tiempo real.';

/** Crea o actualiza un <meta name="..."> en el <head>. */
function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Agrega un <link> al <head> si aún no existe uno con ese rel. */
function ensureLink(rel: string, href: string) {
  if (document.querySelector(`link[rel="${rel}"]`)) return;
  const el = document.createElement('link');
  el.setAttribute('rel', rel);
  el.setAttribute('href', href);
  document.head.appendChild(el);
}

/**
 * Registra el manifest, las metaetiquetas de SEO/tema y el service worker.
 * Idempotente: se puede llamar varias veces sin duplicar nada.
 */
export function setupWebApp() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  // Verificación de propiedad para Google Search Console.
  setMeta('google-site-verification', 'spRGZMrqDrt1RX6ByfNSMiSCLBaJnuR0ZLrNKCOhIO0');

  // PWA: manifest + color de tema para la barra del navegador/instalación.
  ensureLink('manifest', '/manifest.json');
  ensureLink('apple-touch-icon', '/icon-192.png');
  setMeta('theme-color', THEME_COLOR);
  setMeta('description', DESCRIPTION);
  setMeta('apple-mobile-web-app-capable', 'yes');
  setMeta('apple-mobile-web-app-title', 'QuickBite');

  // Service worker: requisito para que Chrome/Edge ofrezcan "Instalar".
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Sin SW la app sigue funcionando; solo se pierde la instalación.
      });
    });
  }
}
