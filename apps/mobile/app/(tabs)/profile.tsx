import { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useAuth, signOutUser } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useTranslation } from '@/hooks/useTranslation';
import { EditProfileSheet } from '@/components/profile/EditProfileSheet';
import { DeliveryAddressSheet } from '@/components/address/DeliveryAddressSheet';
import { PaymentMethodsSheet } from '@/components/payment/PaymentMethodsSheet';

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 4 },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders } = useOrders();
  const { t } = useTranslation();
  const [editVisible, setEditVisible] = useState(false);
  const [addressVisible, setAddressVisible] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);

  const accountItems: { label: string; icon: IconName; onPress?: () => void }[] = [
    { label: t('profile.personalInfo'), icon: 'person', onPress: () => setEditVisible(true) },
    { label: t('profile.savedAddresses'), icon: 'location-on', onPress: () => setAddressVisible(true) },
    { label: t('profile.paymentMethods'), icon: 'payments', onPress: () => setPaymentVisible(true) },
  ];

  const appItems: { label: string; icon: IconName; onPress?: () => void }[] = [
    { label: t('profile.appSettings'), icon: 'settings', onPress: () => router.push('/settings') },
    { label: t('profile.help'), icon: 'help-outline', onPress: () => router.push('/settings?section=help') },
  ];

  const handleLogout = async () => {
    await signOutUser();
    router.replace('/(auth)/login');
  };

  const OptionItem = ({
    label,
    icon,
    onPress,
    accent,
  }: {
    label: string;
    icon: IconName;
    onPress?: () => void;
    accent?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="flex-row items-center justify-between p-4 bg-surface-container-lowest rounded-xl"
      style={cardShadow}
    >
      <View className="flex-row items-center gap-4">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: accent ? palette.secondaryContainer : palette.surfaceContainer }}
        >
          <Icon name={icon} color={accent ? palette.onSecondaryContainer : palette.onSurfaceVariant} />
        </View>
        <Text className="text-base font-semibold text-on-surface">{label}</Text>
      </View>
      <Icon name="chevron-right" color={palette.onSurfaceVariant} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* TopAppBar */}
      <View className="flex-row items-center px-4 py-2 bg-background">
        <View className="flex-row items-center gap-2">
          <Icon name="person" color={palette.primary} />
          <Text className="text-xl font-bold text-primary">QuickBite</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-4 py-6">
        {/* Profile header */}
        <View className="items-center mb-8">
          <View className="relative mb-4">
            <View className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface-container-lowest bg-surface-container items-center justify-center" style={cardShadow}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Icon name="person" color={palette.outline} size={48} />
              )}
            </View>
            <TouchableOpacity
              onPress={() => setEditVisible(true)}
              className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center border-2 border-surface-container-lowest"
              accessibilityRole="button"
              accessibilityLabel={t('editProfile.changePhoto')}
            >
              <Icon name="edit" color="#ffffff" size={18} />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-on-background">{user?.name ?? t('profile.guest')}</Text>
          <Text className="text-base text-on-surface-variant">{user?.email ?? ''}</Text>
        </View>

        {/* Stats */}
        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-surface-container-lowest p-4 rounded-xl border border-surface-variant/30 items-center" style={cardShadow}>
            <Text className="text-xl font-bold text-primary">{orders.length}</Text>
            <Text className="text-xs text-on-surface-variant">{t('profile.ordersPlaced')}</Text>
          </View>
          <View className="flex-1 bg-surface-container-lowest p-4 rounded-xl border border-surface-variant/30 items-center" style={cardShadow}>
            <Text className="text-xl font-bold text-tertiary">{user?.favoriteIds.length ?? 0}</Text>
            <Text className="text-xs text-on-surface-variant">{t('profile.favorites')}</Text>
          </View>
        </View>

        {/* Account Settings */}
        <Text className="text-sm font-semibold text-on-surface-variant px-1 mb-2">{t('profile.accountSettings')}</Text>
        <View className="gap-2">
          {accountItems.map((item) => (
            <OptionItem key={item.label} label={item.label} icon={item.icon} onPress={item.onPress} accent />
          ))}
        </View>

        {/* Application */}
        <Text className="text-sm font-semibold text-on-surface-variant px-1 mt-6 mb-2">{t('profile.application')}</Text>
        <View className="gap-2">
          {appItems.map((item) => (
            <OptionItem key={item.label} label={item.label} icon={item.icon} onPress={item.onPress} />
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.9}
          className="flex-row items-center justify-between p-4 bg-surface-container-lowest rounded-xl mt-8"
          style={cardShadow}
        >
          <View className="flex-row items-center gap-4">
            <View className="w-10 h-10 rounded-full bg-error-container/20 items-center justify-center">
              <Icon name="logout" color={palette.error} />
            </View>
            <Text className="text-base font-semibold text-error">{t('profile.logout')}</Text>
          </View>
          <Icon name="arrow-forward" color={palette.error} />
        </TouchableOpacity>
      </ScrollView>

      <EditProfileSheet visible={editVisible} onClose={() => setEditVisible(false)} />
      <DeliveryAddressSheet visible={addressVisible} onClose={() => setAddressVisible(false)} />
      <PaymentMethodsSheet visible={paymentVisible} onClose={() => setPaymentVisible(false)} />
    </SafeAreaView>
  );
}
