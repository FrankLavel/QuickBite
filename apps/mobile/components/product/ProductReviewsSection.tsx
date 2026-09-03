import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useProductReviews } from '@/hooks/useProductReviews';
import { useTranslation } from '@/hooks/useTranslation';
import { ProductReviewSheet } from '@/components/product/ProductReviewSheet';
import { ProductReview } from '@/types/review.types';

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((v) => (
        <Icon key={v} name={v <= rating ? 'star' : 'star-border'} color={palette.star} size={size} />
      ))}
    </View>
  );
}

export function ProductReviewsSection({
  restaurantId,
  productId,
  data,
}: {
  restaurantId: string;
  productId: string;
  data: ReturnType<typeof useProductReviews>;
}) {
  const { t, lang } = useTranslation();
  const { reviews, myReview, eligibleOrderId, canReview, loading, reload } = data;
  const [sheetOpen, setSheetOpen] = useState(false);

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const renderReview = (r: ProductReview) => {
    const dateLabel = r.createdAt
      ? format(r.createdAt.toDate(), 'd MMM, yyyy', { locale: lang === 'es' ? es : undefined })
      : '';
    return (
      <View key={r.id} className="py-4 border-b border-outline-variant/20">
        <View className="flex-row items-center gap-3 mb-2">
          <View className="w-9 h-9 rounded-full overflow-hidden bg-surface-container items-center justify-center">
            {r.userPhotoURL ? (
              <Image source={{ uri: r.userPhotoURL }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Icon name="person" color={palette.outline} size={20} />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-on-surface" numberOfLines={1}>
              {r.userName || t('reviews.anonymous')}
            </Text>
            <Text className="text-xs text-on-surface-variant">{dateLabel}</Text>
          </View>
          <Stars rating={r.rating} />
        </View>
        {!!r.comment && (
          <Text className="text-sm text-on-surface-variant leading-5">{r.comment}</Text>
        )}
      </View>
    );
  };

  return (
    <View className="mt-8">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-bold uppercase tracking-wider text-secondary">
            {t('reviews.title')}
          </Text>
          {reviews.length > 0 && (
            <View className="flex-row items-center gap-1">
              <Icon name="star" color={palette.star} size={15} />
              <Text className="text-sm font-bold text-on-surface">{avg.toFixed(1)}</Text>
              <Text className="text-xs text-on-surface-variant">({reviews.length})</Text>
            </View>
          )}
        </View>
        {canReview && (
          <TouchableOpacity
            onPress={() => setSheetOpen(true)}
            activeOpacity={0.8}
            className="flex-row items-center gap-1"
          >
            <Icon name={myReview ? 'edit' : 'rate-review'} color={palette.primary} size={16} />
            <Text className="text-primary text-sm font-bold">
              {myReview ? t('reviews.edit') : t('reviews.write')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={palette.primary} className="py-6" />
      ) : reviews.length === 0 ? (
        <Text className="text-sm text-on-surface-variant py-4">
          {canReview ? t('reviews.emptyCanReview') : t('reviews.empty')}
        </Text>
      ) : (
        <View>{reviews.map(renderReview)}</View>
      )}

      {canReview && eligibleOrderId && (
        <ProductReviewSheet
          visible={sheetOpen}
          onClose={() => setSheetOpen(false)}
          restaurantId={restaurantId}
          productId={productId}
          orderId={eligibleOrderId}
          existing={myReview}
          onSubmitted={reload}
        />
      )}
    </View>
  );
}
