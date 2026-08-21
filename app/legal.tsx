import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useTranslation } from '@/hooks/useTranslation';

type Doc = 'terms' | 'privacy';
type Section = { h: string; p: string };

/**
 * Pantalla de Términos / Política de privacidad. Un solo archivo param-driven
 * (`?doc=terms|privacy`) que usan tanto el login como Ajustes → Privacidad.
 * Contenido bilingüe simple (proyecto escolar; no hay páginas legales hospedadas).
 */
const CONTENT: Record<'es' | 'en', Record<Doc, { title: string; body: Section[] }>> = {
  es: {
    terms: {
      title: 'Términos del servicio',
      body: [
        { h: '1. Sobre QuickBite', p: 'QuickBite es una plataforma que conecta a clientes con fondas y restaurantes locales para pedir comida a domicilio. Es un proyecto escolar en ambiente de pruebas.' },
        { h: '2. Tu cuenta', p: 'Eres responsable de mantener segura tu cuenta y de la información que registras. Debes proporcionar datos reales para tus pedidos y entregas.' },
        { h: '3. Pedidos y pagos', p: 'Los precios, promociones y disponibilidad los define cada restaurante. Los pagos con tarjeta se procesan en modo sandbox (prueba) vía Openpay; no se realizan cobros reales.' },
        { h: '4. Entregas', p: 'Solo puedes ordenar si tu dirección está dentro de la zona de reparto del restaurante. Los tiempos de entrega son estimados.' },
        { h: '5. Uso adecuado', p: 'No debes usar la app para fines fraudulentos ni alterar su funcionamiento. Podemos suspender cuentas que incumplan estas reglas.' },
      ],
    },
    privacy: {
      title: 'Política de privacidad',
      body: [
        { h: '1. Datos que recopilamos', p: 'Nombre, correo, teléfono, direcciones de entrega y tu historial de pedidos, para poder operar el servicio.' },
        { h: '2. Ubicación', p: 'Usamos tu ubicación solo para sugerir tu dirección de entrega y validar la zona de cobertura. No la compartimos con terceros con fines publicitarios.' },
        { h: '3. Terceros', p: 'Nos apoyamos en Firebase (Google) para autenticación y datos, Openpay para pagos, y Google Maps para ubicación. Cada uno maneja tus datos según sus propias políticas.' },
        { h: '4. Pagos', p: 'Los datos de tu tarjeta se tokenizan directamente con Openpay; QuickBite nunca guarda el número completo de tu tarjeta.' },
        { h: '5. Tus derechos', p: 'Puedes editar o eliminar tu cuenta y tus direcciones desde la app en cualquier momento.' },
      ],
    },
  },
  en: {
    terms: {
      title: 'Terms of Service',
      body: [
        { h: '1. About QuickBite', p: 'QuickBite connects customers with local eateries to order food for delivery. It is a school project running in a test environment.' },
        { h: '2. Your account', p: 'You are responsible for keeping your account secure and for the information you provide for orders and deliveries.' },
        { h: '3. Orders and payments', p: 'Prices, promos and availability are set by each restaurant. Card payments run in sandbox (test) mode via Openpay; no real charges are made.' },
        { h: '4. Deliveries', p: 'You can only order if your address is within the restaurant delivery zone. Delivery times are estimates.' },
        { h: '5. Proper use', p: 'Do not use the app for fraudulent purposes or to disrupt its operation. Accounts that break these rules may be suspended.' },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      body: [
        { h: '1. Data we collect', p: 'Name, email, phone, delivery addresses and your order history, in order to run the service.' },
        { h: '2. Location', p: 'We use your location only to suggest your delivery address and validate the coverage zone. We do not share it with third parties for advertising.' },
        { h: '3. Third parties', p: 'We rely on Firebase (Google) for auth and data, Openpay for payments, and Google Maps for location. Each handles your data under its own policies.' },
        { h: '4. Payments', p: 'Your card details are tokenized directly with Openpay; QuickBite never stores your full card number.' },
        { h: '5. Your rights', p: 'You can edit or delete your account and addresses from the app at any time.' },
      ],
    },
  },
};

export default function LegalScreen() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const which: Doc = doc === 'terms' ? 'terms' : 'privacy';
  const data = CONTENT[lang === 'en' ? 'en' : 'es'][which];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 py-2 bg-background">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="p-2 rounded-full"
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Icon name="arrow-back" color={palette.primary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-on-surface">{data.title}</Text>
      </View>

      <ScrollView contentContainerClassName="px-4 py-4 gap-5" showsVerticalScrollIndicator={false}>
        {data.body.map((s) => (
          <View key={s.h} className="gap-1">
            <Text className="text-base font-bold text-on-surface">{s.h}</Text>
            <Text className="text-sm text-on-surface-variant leading-6">{s.p}</Text>
          </View>
        ))}
        <Text className="text-xs text-on-surface-variant/70 mt-2">
          {lang === 'en'
            ? 'School project — QuickBite. Sandbox environment, not for production use.'
            : 'Proyecto escolar — QuickBite. Ambiente de pruebas, no para uso en producción.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
