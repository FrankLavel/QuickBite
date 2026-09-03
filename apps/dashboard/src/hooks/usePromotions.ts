import { useContext } from 'react';
import { PromotionContext } from '../context/PromotionContext';

export function usePromotions() {
  const ctx = useContext(PromotionContext);
  if (!ctx) {
    throw new Error('usePromotions debe usarse dentro de PromotionProvider');
  }
  return ctx;
}
