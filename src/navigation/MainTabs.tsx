/**
 * navigation/MainTabs.tsx
 * Tabs inferiores del repartidor autenticado (theme-aware).
 */
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { TabParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { AvailableOrdersScreen } from '../screens/AvailableOrdersScreen';
import { MyDeliveriesScreen } from '../screens/MyDeliveriesScreen';
import { EarningsScreen } from '../screens/EarningsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Available: 'fast-food-outline',
  MyDeliveries: 'bicycle-outline',
  Earnings: 'wallet-outline',
  Profile: 'person-outline',
};

export function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen
        name="Available"
        component={AvailableOrdersScreen}
        options={{ title: 'Disponibles' }}
      />
      <Tab.Screen
        name="MyDeliveries"
        component={MyDeliveriesScreen}
        options={{ title: 'Mis entregas' }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ title: 'Ganancias' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}
