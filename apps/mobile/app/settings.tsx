import { useRef, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Switch, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { config } from '@/constants/config';
import { useAuth, signOutUser } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useNotifStore } from '@/store/notifStore';
import { usersService } from '@/services/users.service';
import { useTranslation } from '@/hooks/useTranslation';
import { EditProfileSheet } from '@/components/profile/EditProfileSheet';
import { DeliveryAddressSheet } from '@/components/address/DeliveryAddressSheet';

const DECO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD9KG4zGQkGdV5dDcEy7u3KH1SHQ1_BZiJ6gZT9pYMD1ShTCOrq2Bod2qWOr5r6ZPRl4geZmlh3WzIEpKBG_dcZaMRuahjkf1xTs9UgtwZgFcxV2CgXAAqIcQHOof88erPm6v7uAmi8uXXWLpirtQqRpPycxHNhr6UmNHvk5PNvub3X9w_uUcNTBCXveBbBi3bK_6riNpoopSi3jhJLFXbJpdAz8v_PG5ju__2Tg3OOxD3FnA-1tM7m9x14l5JR6ai2qNXqg95Yie9X';

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 4 },
};

const legalLinks: { key: string; icon: IconName; route?: string }[] = [
  { key: 'settings.security', icon: 'shield', route: '/security' },
  { key: 'settings.privacy', icon: 'lock', route: '/legal?doc=privacy' },
  { key: 'settings.accessibility', icon: 'accessibility-new', route: '/accessibility' },
];

/** Preguntas frecuentes: cada una con su clave de pregunta y respuesta en i18n. */
const FAQS = [
  { q: 'faq.q1', a: 'faq.a1' },
  { q: 'faq.q2', a: 'faq.a2' },
  { q: 'faq.q3', a: 'faq.a3' },
  { q: 'faq.q4', a: 'faq.a4' },
  { q: 'faq.q5', a: 'faq.a5' },
];

function RowIcon({ icon }: { icon: IconName }) {
  return (
    <View className="p-2 bg-secondary-container rounded-lg">
      <Icon name={icon} color={palette.onSecondaryContainer} />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const { t, lang, setLang } = useTranslation();
  const darkMode = user?.darkMode ?? false;
  const notifications = useNotifStore((s) => s.enabled);
  const setNotifications = useNotifStore((s) => s.setEnabled);
  const [editVisible, setEditVisible] = useState(false);
  const [addressVisible, setAddressVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const openWhatsApp = () => {
    const msg = encodeURIComponent(t('settings.whatsappMsg'));
    Linking.openURL(`https://wa.me/${config.support.whatsapp}?text=${msg}`).catch(() => {});
  };

  const toggleDarkMode = () => {
    if (!user) return;
    const next = !user.darkMode;
    // Optimista en el store + persistencia en Firestore.
    useAuthStore.getState().setUser({ ...user, darkMode: next });
    usersService.setDarkMode(user.uid, next);
  };

  const handleLogout = async () => {
    await signOutUser();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* TopAppBar */}
      <View className="flex-row justify-between items-center px-4 py-2 bg-background">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} className="p-2 rounded-full">
            <Icon name="arrow-back" color={palette.primary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-primary tracking-tight">QuickBite</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerClassName="px-4 py-8 gap-8">
        {/* Profile anchor */}
        <View className="flex-row items-center gap-4 bg-surface-container-lowest p-6 rounded-xl" style={cardShadow}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} className="w-20 h-20 rounded-full border-4 border-primary-container" />
          ) : (
            <View className="w-20 h-20 rounded-full border-4 border-primary-container bg-surface-container items-center justify-center">
              <Icon name="person" color={palette.outline} size={40} />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-xl font-bold text-on-background">{user?.name ?? t('profile.guest')}</Text>
            <Text className="text-sm text-on-surface-variant">{user?.email ?? ''}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setEditVisible(true)}
          className="bg-primary-container self-start px-6 py-2 rounded-full -mt-4"
        >
          <Text className="text-on-primary-container text-sm font-bold">{t('settings.editProfile')}</Text>
        </TouchableOpacity>

        {/* Preferences */}
        <View className="gap-4">
          <Text className="text-lg font-bold text-primary px-1">{t('settings.preferences')}</Text>
          <View className="bg-surface-container-lowest rounded-xl overflow-hidden" style={cardShadow}>
            {/* Notifications */}
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-4">
                <RowIcon icon="notifications" />
                <Text className="text-base text-on-surface">{t('settings.notifications')}</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ true: palette.primary, false: palette.outlineVariant }}
                thumbColor="#ffffff"
              />
            </View>
            {/* Dark Mode */}
            <View className="flex-row items-center justify-between p-4 border-t border-surface-variant">
              <View className="flex-row items-center gap-4">
                <RowIcon icon="dark-mode" />
                <Text className="text-base text-on-surface">{t('settings.darkMode')}</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ true: palette.primary, false: palette.outlineVariant }}
                thumbColor="#ffffff"
              />
            </View>
            {/* Language */}
            <View className="flex-row items-center justify-between p-4 border-t border-surface-variant">
              <View className="flex-row items-center gap-4">
                <RowIcon icon="language" />
                <Text className="text-base text-on-surface">{t('settings.language')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setLang(lang === 'es' ? 'en' : 'es')}
                className="flex-row items-center bg-surface-container-low rounded-lg px-3 py-1.5 gap-1"
              >
                <Text className="text-sm text-on-surface">{lang === 'es' ? 'Español' : 'English'}</Text>
                <Icon name="unfold-more" color={palette.onSurfaceVariant} size={18} />
              </TouchableOpacity>
            </View>
            {/* Direcciones de entrega */}
            <TouchableOpacity
              onPress={() => setAddressVisible(true)}
              className="flex-row items-center justify-between p-4 border-t border-surface-variant"
            >
              <View className="flex-row items-center gap-4">
                <RowIcon icon="location-on" />
                <Text className="text-base text-on-surface">{t('settings.deliveryAddresses')}</Text>
              </View>
              <Icon name="chevron-right" color={palette.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security & Legal */}
        <View className="gap-4">
          <Text className="text-lg font-bold text-primary px-1">{t('settings.securityLegal')}</Text>
          <View className="bg-surface-container-lowest rounded-xl overflow-hidden" style={cardShadow}>
            {legalLinks.map((link, i) => (
              <TouchableOpacity
                key={link.key}
                activeOpacity={0.85}
                onPress={link.route ? () => router.push(link.route as never) : undefined}
                accessibilityRole="button"
                accessibilityLabel={t(link.key)}
                className={`flex-row items-center justify-between p-4 ${i > 0 ? 'border-t border-surface-variant' : ''}`}
              >
                <View className="flex-row items-center gap-4">
                  <RowIcon icon={link.icon} />
                  <Text className="text-base text-on-surface">{t(link.key)}</Text>
                </View>
                <Icon name="chevron-right" color={palette.onSurfaceVariant} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Help & Support */}
        <View
          className="gap-4"
          onLayout={(e) => {
            // Si se llegó desde "Ayuda" del perfil, baja a esta sección.
            if (section === 'help') {
              const y = e.nativeEvent.layout.y;
              scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
            }
          }}
        >
          <Text className="text-lg font-bold text-primary px-1">{t('settings.helpSupport')}</Text>
          <View className="gap-4">
            {/* Contáctanos → WhatsApp */}
            <TouchableOpacity
              onPress={openWhatsApp}
              activeOpacity={0.9}
              className="flex-row items-center justify-center gap-2 p-6 bg-surface-container-lowest rounded-xl"
              style={cardShadow}
            >
              <Icon name="chat" color={palette.primary} size={28} />
              <Text className="text-sm font-bold text-on-surface">{t('settings.contact')}</Text>
            </TouchableOpacity>

            {/* Preguntas frecuentes (acordeón) */}
            <View className="bg-surface-container-lowest rounded-xl overflow-hidden" style={cardShadow}>
              <View className="flex-row items-center gap-2 p-4">
                <Icon name="help-center" color={palette.primary} size={24} />
                <Text className="text-sm font-bold text-on-surface">{t('settings.faq')}</Text>
              </View>
              {FAQS.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <View key={item.q} className="border-t border-surface-variant">
                    <TouchableOpacity
                      onPress={() => setOpenFaq(isOpen ? null : i)}
                      activeOpacity={0.7}
                      className="flex-row items-center justify-between p-4 gap-2"
                    >
                      <Text className="text-sm font-semibold text-on-surface flex-1">{t(item.q)}</Text>
                      <Icon name={isOpen ? 'expand-less' : 'expand-more'} color={palette.onSurfaceVariant} />
                    </TouchableOpacity>
                    {isOpen && (
                      <View className="px-4 pb-4 -mt-1">
                        <Text className="text-sm text-on-surface-variant leading-5">{t(item.a)}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Cerrar sesión */}
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center justify-center gap-2 p-6 bg-surface-container-lowest rounded-xl"
              style={cardShadow}
            >
              <Icon name="logout" color={palette.error} size={28} />
              <Text className="text-sm font-bold text-error">{t('profile.logout')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Decorative illustration */}
        <View className="h-48 rounded-2xl overflow-hidden items-center justify-center" style={cardShadow}>
          <Image source={{ uri: DECO_IMAGE }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
          <View className="absolute inset-0 bg-black/50" />
          <View className="items-center px-4">
            <Text className="text-2xl font-bold text-white mb-1">{t('settings.tasteDifference')}</Text>
            <Text className="text-base text-white/90 text-center">{t('settings.tagline')}</Text>
          </View>
        </View>
      </ScrollView>

      <EditProfileSheet visible={editVisible} onClose={() => setEditVisible(false)} />
      <DeliveryAddressSheet visible={addressVisible} onClose={() => setAddressVisible(false)} />
    </SafeAreaView>
  );
}
