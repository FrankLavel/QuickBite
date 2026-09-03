/**
 * utils/sound.ts
 * Sonido de aviso para pedidos nuevos. En web usa la Web Audio API (sin
 * dependencias ni archivos): un pequeño "ding-dong" de dos notas. En nativo
 * es no-op por ahora (se podría añadir expo-av más adelante).
 */

import { Platform } from 'react-native';

let ctx: AudioContext | null = null;

/** Reproduce un chime corto de dos notas. Silencioso si el audio no está listo. */
export function playNewOrderChime() {
  if (Platform.OS !== 'web') return;
  try {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    // Los navegadores suspenden el audio hasta que hay interacción del usuario;
    // como el comerciante ya inició sesión y navegó, normalmente se puede reanudar.
    if (ctx.state === 'suspended') void ctx.resume();

    const now = ctx.currentTime;
    const notes: Array<[number, number]> = [
      [880, 0], // A5
      [1174.66, 0.12], // D6
    ];
    for (const [freq, offset] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.3);
    }
  } catch {
    // El sonido es un extra; nunca debe interrumpir el flujo si falla.
  }
}
