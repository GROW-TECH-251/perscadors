export interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image?: string;
}

export interface CheckoutPayload {
  turnstileToken: string;
  order_number: string;
  idempotency_key: string;
  client_name: string;
  client_phone: string;
  client_area: string;
  items: CheckoutItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
}

const ORDER_NUMBER = /^HP-\d{8}-\d{4}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSafeText(value: unknown, min: number, max: number): value is string {
  return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
}

export function isValidCheckoutPayload(value: unknown): value is CheckoutPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<CheckoutPayload>;
  if (!isSafeText(payload.turnstileToken, 20, 2048)) return false;
  if (!isSafeText(payload.order_number, 1, 32) || !ORDER_NUMBER.test(payload.order_number)) return false;
  if (!isSafeText(payload.idempotency_key, 1, 64) || !UUID.test(payload.idempotency_key)) return false;
  if (!isSafeText(payload.client_name, 2, 120) || !isSafeText(payload.client_area, 2, 160)) return false;
  if (typeof payload.client_phone !== 'string' || payload.client_phone.length > 24) return false;
  if (!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 20) return false;
  if (!payload.items.every((item: unknown) => {
    if (!item || typeof item !== 'object') return false;
    const i = item as Partial<CheckoutItem>;
    return (
      isSafeText(i.name, 1, 160) &&
      isSafeText(i.size, 1, 40) &&
      isSafeText(i.color, 1, 60) &&
      Number.isFinite(i.price) &&
      (i.price as number) >= 0 &&
      Number.isInteger(i.quantity) &&
      (i.quantity as number) >= 1 &&
      (i.quantity as number) <= 20
    );
  })) return false;
  const subtotal = payload.subtotal;
  const deliveryFee = payload.delivery_fee;
  const total = payload.total;
  if (typeof subtotal !== 'number' || typeof deliveryFee !== 'number' || typeof total !== 'number') return false;
  if (![subtotal, deliveryFee, total].every((amount) => Number.isFinite(amount) && amount >= 0)) return false;
  return total === subtotal + deliveryFee;
}
