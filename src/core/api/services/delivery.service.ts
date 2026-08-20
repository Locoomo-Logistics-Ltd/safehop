
import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
import type { PaginatedList } from "@/core/api/types";
import type {
  CreatePaymentIntentPayload,
  Order,
  PaymentIntent,
} from "@/core/types";

/**
 * Delivery service — the central business-logic surface for the User
 * role. Covers the full lifecycle: New Delivery → Select Origin +
 * Destination Node → Method → Checkout → Paystack redirect →
 * `/orders/payment-callback` → Track.
 *
 * Rebuilt 2026-08-12 against the real, documented contract:
 * `POST /payments/intents` (fee calc + capacity reservation + Paystack
 * checkout URL, in one call — no separate "calculate fare" step),
 * `GET /payments/intents/:id` (poll after the Paystack redirect), and
 * `GET /orders`(/:id) (the real Order shape once payment succeeds).
 * This replaces the previous `orders/calculate-fare` + `orders/book` +
 * no-op `pay()` flow, which targeted undocumented routes and never
 * actually collected payment — see docs/API_INTEGRATION_STATUS.md's
 * "Payments" section for the before/after.
 */

const realDeliveryService = {
  /** GET /orders — the requesting Consumer's own orders. Real, confirmed route per docs/API.md. */
  async list(): Promise<Order[]> {
    const raw = await httpClient.get<PaginatedList<Order>>(`${ENDPOINTS.orders.list}?limit=100`);
    return raw.items;
  },

  /** GET /orders/:id — real, confirmed route per docs/API.md. */
  async getById(id: string): Promise<Order> {
    return httpClient.get<Order>(ENDPOINTS.orders.detail(id));
  },

  /**
   * POST /payments/intents — real, confirmed route per docs/API.md.
   * Calculates the fee, reserves origin Node capacity for ~15 minutes,
   * and returns a Paystack `authorizationUrl` to redirect the browser
   * to. There is no separate "confirm payment" call — the frontend
   * redirects to Paystack, then polls `getPaymentIntent` after the
   * `/orders/payment-callback` redirect.
   */
  async createPaymentIntent(payload: CreatePaymentIntentPayload): Promise<PaymentIntent> {
    return httpClient.post<PaymentIntent>(ENDPOINTS.payments.intents, payload);
  },

  /** GET /payments/intents/:id — poll this after the Paystack redirect until `status` leaves `"pending"`. */
  async getPaymentIntent(id: string): Promise<PaymentIntent> {
    return httpClient.get<PaymentIntent>(ENDPOINTS.payments.intentDetail(id));
  },
};

export const deliveryService = realDeliveryService;
