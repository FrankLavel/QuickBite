import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { reviewsService } from '@/services/reviews.service';
import { useTranslation } from '@/hooks/useTranslation';
import { NewProductReview, ProductReview } from '@/types/review.types';

interface Props {
  visible: boolean;
  onClose: () => void;
  restaurantId: string;
  productId: string;
  /** Pedido entregado que respalda la reseña (compra verificada). */
  orderId: string;
  /** Reseña existente del usuario (para editar), o null para crear. */
  existing: ProductReview | null;
  onSubmitted: () => void;
}

/** Formulario para crear/editar la reseña propia de un producto. */
export function ProductReviewSheet({
  visible,
  onClose,
  restaurantId,
  productId,
  orderId,
  existing,
  onSubmitted,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Precarga con la reseña existente al abrir.
  useEffect(() => {
    if (visible) {
      setRating(existing?.rating ?? 0);
      setComment(existing?.comment ?? '');
      setError('');
    }
  }, [visible, existing]);

  const save = async () => {
    if (saving || !user || rating < 1) return;
    setSaving(true);
    setError('');
    try {
      const payload: NewProductReview = {
        userId: user.uid,
        userName: user.name,
        orderId,
        rating,
        comment: comment.trim(),
      };
      // Firestore rechaza campos undefined: solo incluir la foto si existe.
      if (user.photoURL) payload.userPhotoURL = user.photoURL;

      await reviewsService.submit(restaurantId, productId, payload);
      onSubmitted();
      onClose();
    } catch {
      setError(t('reviews.submitError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-on-surface">
            {existing ? t('reviews.editTitle') : t('reviews.writeTitle')}
          </Text>
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')}>
            <Icon name="close" color={palette.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Selector de estrellas */}
        <View className="flex-row justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity
              key={value}
              onPress={() => setRating(value)}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={t('a11y.rateStars', { n: value })}
              accessibilityState={{ selected: value <= rating }}
            >
              <Icon name={value <= rating ? 'star' : 'star-border'} color={palette.star} size={40} />
            </TouchableOpacity>
          ))}
        </View>

        <View className="gap-1">
          <Text className="text-sm font-semibold text-on-surface-variant px-1">
            {t('reviews.commentLabel')}
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={t('reviews.commentPlaceholder')}
            placeholderTextColor={palette.outline}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-surface-container-low rounded-xl p-4 text-base text-on-surface min-h-[100px]"
          />
        </View>

        {!!error && <Text className="text-sm text-error px-1">{error}</Text>}

        <View className="flex-row gap-3 pt-1">
          <TouchableOpacity
            onPress={onClose}
            className="flex-1 h-12 rounded-full border border-outline-variant items-center justify-center"
          >
            <Text className="text-on-surface font-bold">{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={save}
            disabled={saving || rating < 1}
            className="flex-1 h-12 rounded-full bg-primary items-center justify-center"
            style={saving || rating < 1 ? { opacity: 0.5 } : undefined}
          >
            {saving ? (
              <ActivityIndicator color={palette.onPrimary} />
            ) : (
              <Text className="text-on-primary font-bold">{t('common.save')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}
