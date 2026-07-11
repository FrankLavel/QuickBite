/**
 * components/layout/Sidebar.tsx
 * Navegación lateral izquierda con iconos Feather.
 * Modo rail (fijo en desktop) o drawer (móvil).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { MainStackParamList } from '../../types/navigation';
import { colors, radius, spacing, typography } from '../../utils/theme';

export type SidebarRoute = keyof MainStackParamList;
type FeatherIconName = ComponentProps<typeof Feather>['name'];

interface NavItem {
  key: SidebarRoute;
  label: string;
  icon: FeatherIconName;
}

const MAIN_ITEMS: NavItem[] = [
  { key: 'Panel', label: 'Panel', icon: 'grid' },
  { key: 'Pedidos', label: 'Pedidos', icon: 'clipboard' },
  { key: 'Entregas', label: 'Entregas', icon: 'truck' },
  { key: 'Menu', label: 'Menú', icon: 'book-open' },
  { key: 'Promociones', label: 'Promociones', icon: 'gift' },
  { key: 'Analiticas', label: 'Analíticas', icon: 'bar-chart-2' },
  { key: 'Clientes', label: 'Clientes', icon: 'users' },
  { key: 'Notificaciones', label: 'Notificaciones', icon: 'bell' },
];

const FOOTER_ITEMS: NavItem[] = [
  { key: 'Configuracion', label: 'Configuración', icon: 'settings' },
];

export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_BREAKPOINT = 960;

interface SidebarContentProps {
  activeRoute: SidebarRoute;
  onNavigate: (route: SidebarRoute) => void;
  onLogout: () => void;
  onItemPress?: () => void;
}

function SidebarContent({
  activeRoute,
  onNavigate,
  onLogout,
  onItemPress,
}: SidebarContentProps) {
  const renderItem = (item: NavItem) => {
    const active = activeRoute === item.key;
    return (
      <Pressable
        key={item.key}
        style={({ pressed }) => [
          styles.item,
          active && styles.itemActive,
          pressed && !active && styles.itemPressed,
        ]}
        onPress={() => {
          onNavigate(item.key);
          onItemPress?.();
        }}
      >
        {active ? <View style={styles.activeBar} /> : null}
        <Feather
          name={item.icon}
          size={20}
          color={active ? colors.primaryLight : 'rgba(255,255,255,0.75)'}
          style={styles.itemIconWrap}
        />
        <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <>
      <View style={styles.brand}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Feather name="coffee" size={18} color={colors.primaryLight} />
          </View>
          <View>
            <Text style={styles.brandTitle}>QuickBite</Text>
            <Text style={styles.brandSubtitle}>Portal Restaurante</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.nav}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.navContent}
      >
        <Text style={styles.sectionLabel}>PRINCIPAL</Text>
        {MAIN_ITEMS.map(renderItem)}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.sectionLabel}>CUENTA</Text>
        {FOOTER_ITEMS.map(renderItem)}
        <Pressable
          style={({ pressed }) => [
            styles.logout,
            pressed && styles.itemPressed,
          ]}
          onPress={onLogout}
        >
          <Feather
            name="log-out"
            size={20}
            color="#FCA5A5"
            style={styles.itemIconWrap}
          />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </>
  );
}

/** Barra lateral fija (desktop) */
export function SidebarRail({
  activeRoute,
  onNavigate,
  onLogout,
}: SidebarContentProps) {
  return (
    <SafeAreaView style={styles.rail} edges={['top', 'bottom', 'left']}>
      <SidebarContent
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
    </SafeAreaView>
  );
}

/** Drawer deslizable desde la izquierda (móvil / tablet) */
interface SidebarDrawerProps extends SidebarContentProps {
  visible: boolean;
  onClose: () => void;
}

export function SidebarDrawer({
  visible,
  activeRoute,
  onClose,
  onNavigate,
  onLogout,
}: SidebarDrawerProps) {
  const handleLogout = () => {
    onClose();
    onLogout();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.drawer} edges={['top', 'bottom', 'left']}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={12}
            accessibilityLabel="Cerrar menú"
          >
            <Feather name="x" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <SidebarContent
            activeRoute={activeRoute}
            onNavigate={onNavigate}
            onLogout={handleLogout}
            onItemPress={onClose}
          />
        </SafeAreaView>
        <Pressable style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
}

/** @deprecated Usar SidebarRail + SidebarDrawer vía ScreenShell */
export function Sidebar(props: SidebarDrawerProps) {
  return <SidebarDrawer {...props} />;
}

export function useSidebarLayout() {
  const { width } = useWindowDimensions();
  return { isRail: width >= SIDEBAR_BREAKPOINT, width };
}

const styles = StyleSheet.create({
  rail: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.sidebar,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawer: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.sidebar,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(36, 226, 117, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    ...typography.h3,
    color: colors.textOnSidebar,
    fontWeight: '700',
  },
  brandSubtitle: {
    ...typography.caption,
    color: colors.textSoft,
    marginTop: 2,
  },
  nav: { flex: 1 },
  navContent: { padding: spacing.sm, paddingTop: spacing.md },
  sectionLabel: {
    ...typography.label,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: spacing.sm,
    marginLeft: spacing.md,
    marginTop: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  itemActive: {
    backgroundColor: 'rgba(36, 226, 117, 0.18)',
  },
  itemPressed: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.primaryLight,
  },
  itemIconWrap: { width: 24, marginRight: spacing.sm },
  itemLabel: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    flex: 1,
  },
  itemLabelActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  footer: {
    padding: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: 4,
  },
  logoutText: {
    ...typography.body,
    color: '#FCA5A5',
    fontWeight: '600',
    flex: 1,
  },
});
