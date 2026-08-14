/**
 * types/card.types.ts
 * Tarjeta guardada — solo referencias (NUNCA el número completo ni el CVV).
 * Documento users/{uid}/cards/{cardId}. La bóveda real es Openpay.
 */
export interface SavedCard {
  /** = openpayCardId (id del documento). */
  id: string;
  openpayCardId: string;
  brand: string | null;
  cardLast4: string | null;
  expMonth?: string | null;
  expYear?: string | null;
  holderName?: string | null;
  isDefault?: boolean;
}
