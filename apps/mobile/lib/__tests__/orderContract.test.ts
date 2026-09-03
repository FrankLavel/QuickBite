/**
 * Tests del contrato de pedido compartido (@quickbite/shared) tal como lo consume
 * la app. Bloquea el flujo, las transiciones (que DEBEN reflejar firestore.rules)
 * y que exista un mensaje al cliente por cada estado.
 */
import {
  ORDER_STATUSES,
  nextOrderStatus,
  canRestaurantTransition,
  canDriverTransition,
  ORDER_STATUS_MESSAGE,
} from '@quickbite/shared';

describe('@quickbite/shared · contrato de pedido', () => {
  it('define los 8 estados', () => {
    expect(ORDER_STATUSES).toHaveLength(8);
    expect(ORDER_STATUSES).toContain('on_the_way');
  });

  it('nextOrderStatus avanza por el flujo y para en delivered', () => {
    expect(nextOrderStatus('pending')).toBe('accepted');
    expect(nextOrderStatus('ready')).toBe('on_the_way');
    expect(nextOrderStatus('delivered')).toBeNull();
  });

  describe('transiciones del restaurante (reflejan firestore.rules · F4)', () => {
    it('permite avances de un paso', () => {
      expect(canRestaurantTransition('pending', 'accepted')).toBe(true);
      expect(canRestaurantTransition('preparing', 'ready')).toBe(true);
      expect(canRestaurantTransition('on_the_way', 'delivered')).toBe(true);
    });
    it('permite rechazar antes del reparto', () => {
      expect(canRestaurantTransition('pending', 'rejected')).toBe(true);
      expect(canRestaurantTransition('preparing', 'rejected')).toBe(true);
    });
    it('bloquea saltos y retrocesos', () => {
      expect(canRestaurantTransition('pending', 'delivered')).toBe(false);
      expect(canRestaurantTransition('ready', 'pending')).toBe(false);
      expect(canRestaurantTransition('ready', 'rejected')).toBe(false);
    });
  });

  it('transiciones del repartidor', () => {
    expect(canDriverTransition('ready', 'on_the_way')).toBe(true);
    expect(canDriverTransition('on_the_way', 'delivered')).toBe(true);
    expect(canDriverTransition('pending', 'delivered')).toBe(false);
  });

  it('hay un mensaje al cliente por cada estado', () => {
    for (const s of ORDER_STATUSES) {
      expect(typeof ORDER_STATUS_MESSAGE[s]).toBe('string');
    }
  });
});
