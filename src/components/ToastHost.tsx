/**
 * components/ToastHost.tsx
 * Renderiza los avisos (toasts) publicados por utils/notify. Se monta una sola
 * vez en la raíz de la app y flota sobre todo el contenido. Sin dependencias.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import {
  subscribeToasts,
  dismissToast,
  type ToastItem,
  type NotifyType,
} from '../utils/notify';
import { getPreferences } from '../utils/preferences';
import { colors, radius, shadows, spacing, typography } from '../utils/theme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

const TYPE_META: Record<
  NotifyType,
  { icon: FeatherIconName; fg: string; bg: string; border: string }
> = {
  success: {
    icon: 'check-circle',
    fg: colors.success,
    bg: colors.successSoft,
    border: colors.success,
  },
  error: {
    icon: 'alert-circle',
    fg: colors.danger,
    bg: colors.dangerSoft,
    border: colors.danger,
  },
  info: {
    icon: 'info',
    fg: colors.info,
    bg: colors.infoSoft,
    border: colors.info,
  },
};

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.host} pointerEvents="box-none">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </View>
  );
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const meta = TYPE_META[toast.type];
  const anim = useRef(new Animated.Value(0)).current;
  const tappable = Boolean(toast.onPress);

  useEffect(() => {
    if (getPreferences().reduceMotion) {
      anim.setValue(1);
      return;
    }
    Animated.timing(anim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [anim]);

  const handlePress = () => {
    toast.onPress?.();
    dismissToast(toast.id);
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        { borderLeftColor: meta.border, backgroundColor: colors.surface },
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-8, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        style={styles.pressArea}
        onPress={tappable ? handlePress : undefined}
        disabled={!tappable}
        accessibilityRole={tappable ? 'button' : undefined}
      >
        <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
          <Feather name={meta.icon} size={16} color={meta.fg} />
        </View>
        <View style={styles.body}>
          {toast.title ? (
            <Text style={styles.title}>{toast.title}</Text>
          ) : null}
          <Text style={styles.text}>{toast.text}</Text>
        </View>
        {tappable ? (
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        ) : null}
      </Pressable>
      <Pressable
        onPress={() => dismissToast(toast.id)}
        hitSlop={8}
        style={styles.close}
        accessibilityLabel="Cerrar aviso"
      >
        <Feather name="x" size={15} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    left: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 440,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.card,
  },
  pressArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '800',
    marginBottom: 1,
  },
  text: { ...typography.bodySmall, color: colors.textSecondary },
  close: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
