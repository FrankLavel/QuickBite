import { QuickBiteColors } from '@/constants/quickbite';

export type OnboardingBadge = {
  icon: 'heart-outline' | 'speedometer' | 'star' | 'location-outline' | 'map-outline' | 'notifications-outline';
  iconColor: string;
  position: 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right';
};

export type OnboardingSlide = {
  id: string;
  title: string;
  titleHighlight: string;
  description: string;
  image: string;
  badges: OnboardingBadge[];
};

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'delivery',
    title: 'Fastest delivery in your',
    titleHighlight: 'neighborhood.',
    description:
      'Get your favorite meals from the best local restaurants delivered to your doorstep in less than 30 minutes.',
    image:
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
    badges: [
      { icon: 'heart-outline', iconColor: '#92400E', position: 'bottom-left' },
      { icon: 'speedometer', iconColor: QuickBiteColors.primary, position: 'top-right' },
    ],
  },
  {
    id: 'discover',
    title: 'Discover the best',
    titleHighlight: 'local restaurants.',
    description:
      'Explore hundreds of curated menus from top-rated spots near you, all in one place.',
    image:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    badges: [
      { icon: 'star', iconColor: '#D97706', position: 'bottom-left' },
      { icon: 'location-outline', iconColor: QuickBiteColors.primary, position: 'top-right' },
    ],
  },
  {
    id: 'track',
    title: 'Track your order in',
    titleHighlight: 'real time.',
    description:
      'Follow every step from kitchen to your door with live order updates and delivery notifications.',
    image:
      'https://www.loginextsolutions.com/blog/wp-content/uploads/2025/04/255812-p4lk8b-119-1.jpg',
    badges: [
      { icon: 'map-outline', iconColor: QuickBiteColors.primary, position: 'bottom-left' },
      { icon: 'notifications-outline', iconColor: '#2563EB', position: 'top-right' },
    ],
  },
];

export const ONBOARDING_STORAGE_KEY = '@quickbite/onboarding_completed';
