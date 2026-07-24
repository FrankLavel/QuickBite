/**
 * components/layout/ScreenShell.tsx
 * Layout con sidebar fijo a la izquierda (desktop) o drawer (móvil).
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from './AppHeader';
import {
  SidebarDrawer,
  SidebarRail,
  useSidebarLayout,
  type SidebarRoute,
} from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import type { MainStackParamList } from '../../types/navigation';
import { colors } from '../../utils/theme';
import { confirmAction } from '../../utils/confirm';

interface ScreenShellProps {
  children: React.ReactNode;
  searchPlaceholder?: string;
  onSearchChange?: (text: string) => void;
}

export function ScreenShell({
  children,
  searchPlaceholder,
  onSearchChange,
}: ScreenShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isRail } = useSidebarLayout();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute();
  const { logout } = useAuth();

  const activeRoute = route.name as SidebarRoute;

  const handleNavigate = (routeName: SidebarRoute) => {
    if (routeName !== activeRoute) {
      navigation.navigate(routeName);
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirmAction(
      'Cerrar sesión',
      '¿Deseas salir de QuickBite?',
      { confirmText: 'Salir', cancelText: 'Cancelar', destructive: true }
    );
    if (confirmed) await logout();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.row}>
        {isRail ? (
          <SidebarRail
            activeRoute={activeRoute}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        ) : null}

        <View style={styles.main}>
          <AppHeader
            showMenuButton={!isRail}
            onMenuPress={() => setDrawerOpen(true)}
            searchPlaceholder={searchPlaceholder}
            onSearchChange={onSearchChange}
            onEditProfile={() => navigation.navigate('Configuracion')}
            onPreferences={() => navigation.navigate('Preferencias')}
            onLogout={handleLogout}
          />
          <View style={styles.content}>{children}</View>
        </View>
      </View>

      {!isRail ? (
        <SidebarDrawer
          visible={drawerOpen}
          activeRoute={activeRoute}
          onClose={() => setDrawerOpen(false)}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  row: { flex: 1, flexDirection: 'row' },
  main: { flex: 1, minWidth: 0 },
  content: { flex: 1 },
});
