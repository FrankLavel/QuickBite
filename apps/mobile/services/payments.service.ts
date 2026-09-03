import { httpsCallable } from 'firebase/functions';
import { collection, doc } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';
import { NewOrderInput } from '@/types/order.types';

/** Token devuelto por el WebView de Openpay al tokenizar una tarjeta nueva. */
export interface OpenpayToken {
  tokenId: string;
  deviceSessionId: string;
}

/** Datos para cobrar: tarjeta nueva (token, opcional guardar) o guardada. */
export interface CardChargePayload {
  deviceSessionId: string;
  /** Tarjeta nueva tokenizada. */
  tokenId?: string;
  /** Guardar la tarjeta nueva para futuras compras. */
  saveCard?: boolean;
  /** Cobrar una tarjeta YA guardada (openpay card id). */
  savedCardId?: string;
}

interface CreateCardChargeResult {
  orderId: string;
  chargeId: string;
}

const createCardChargeFn = httpsCallable<
  {
    orderInput: NewOrderInput;
    orderId: string;
    deviceSessionId: string;
    tokenId?: string;
    saveCard?: boolean;
    savedCardId?: string;
  },
  CreateCardChargeResult
>(functions, 'createCardCharge');

const createCashOrderFn = httpsCallable<
  { orderInput: NewOrderInput; orderId: string },
  { orderId: string }
>(functions, 'createCashOrder');

const saveCardFn = httpsCallable<
  { tokenId: string; deviceSessionId: string },
  { cardId: string; brand: string | null; last4: string | null }
>(functions, 'saveCard');

const deleteCardFn = httpsCallable<{ cardId: string }, { ok: boolean }>(
  functions,
  'deleteCard'
);

/** Id de pedido estable por checkout (idempotencia anti-doble-cobro). */
export const newOrderId = (): string => doc(collection(db, 'orders')).id;

export const paymentsService = {
  /**
   * Cobra con tarjeta vía la Cloud Function. `payload` define si es una tarjeta
   * nueva (con o sin guardar) o una guardada. Devuelve el id del pedido creado.
   */
  createCardOrder: async (
    orderInput: NewOrderInput,
    orderId: string,
    payload: CardChargePayload
  ): Promise<string> => {
    const { data } = await createCardChargeFn({
      orderInput,
      orderId,
      deviceSessionId: payload.deviceSessionId,
      ...(payload.tokenId ? { tokenId: payload.tokenId } : {}),
      ...(payload.saveCard ? { saveCard: true } : {}),
      ...(payload.savedCardId ? { savedCardId: payload.savedCardId } : {}),
    });
    return data.orderId;
  },

  /**
   * Crea un pedido en efectivo vía la Cloud Function, que recalcula los montos y
   * consume el cupón en el servidor (idempotente por `orderId`). Devuelve el id
   * del pedido creado.
   */
  createCashOrder: async (
    orderInput: NewOrderInput,
    orderId: string
  ): Promise<string> => {
    const { data } = await createCashOrderFn({ orderInput, orderId });
    return data.orderId;
  },

  /** Guarda una tarjeta (sin cobrar) desde el perfil. */
  saveCard: async (token: OpenpayToken): Promise<void> => {
    await saveCardFn({
      tokenId: token.tokenId,
      deviceSessionId: token.deviceSessionId,
    });
  },

  /** Elimina una tarjeta guardada. */
  deleteCard: async (cardId: string): Promise<void> => {
    await deleteCardFn({ cardId });
  },
};
