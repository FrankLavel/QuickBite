/**
 * components/LiveTrackingModal.tsx
 * Modal de seguimiento en vivo: se suscribe a la ubicación del repartidor y la
 * muestra en un mapa, con la marca de tiempo de la última actualización.
 */
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LiveMap } from './LiveMap';
import { listenTracking } from '../services/trackingService';
import type { DeliveryTracking } from '../types/tracking';
import { colors, radius, spacing, typography } from '../utils/theme';

interface Props {
  orderId: string;
  driverName?: string;
  visible: boolean;
  onClose: () => void;
}

function toDate(v: unknown): Date | null {
  const anyV = v as { toDate?: () => Date; seconds?: number } | null;
  if (anyV?.toDate) return anyV.toDate();
  if (typeof anyV?.seconds === 'number') return new Date(anyV.seconds * 1000);
  return null;
}

function updatedLabel(v: unknown): string {
  const d = toDate(v);
  if (!d) return 'Esperando señal…';
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 15) return 'Actualizado ahora';
  if (s < 60) return `Actualizado hace ${s}s`;
  const m = Math.floor(s / 60);
  return `Actualizado hace ${m} min`;
}

export function LiveTrackingModal({
  orderId,
  driverName,
  visible,
  onClose,
}: Props) {
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTracking(null);
    return listenTracking(orderId, setTracking);
  }, [visible, orderId]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Ubicación en vivo</Text>
              <Text style={styles.subtitle}>
                {driverName ?? 'Repartidor'} ·{' '}
                {tracking ? updatedLabel(tracking.updatedAt) : 'Conectando…'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Feather name="x" size={20} color={colors.text} />
            </Pressable>
          </View>

          {tracking ? (
            <LiveMap lat={tracking.lat} lng={tracking.lng} height={360} />
          ) : (
            <View style={styles.waiting}>
              <Feather name="navigation" size={26} color={colors.textMuted} />
              <Text style={styles.waitingText}>
                Aún no hay ubicación. Aparecerá cuando el repartidor comparta su
                posición.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.h3, color: colors.text, fontWeight: '800' },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waiting: {
    height: 360,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  waitingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
