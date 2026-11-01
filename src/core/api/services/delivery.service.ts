
import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
import type { PaginatedList } from "@/core/api/types";
import type {
  CreatePaymentIntentPayload,
  DeliveryOptions,
  DeliveryQuoteRequest,
  DeliveryQuoteResult,
  Order,
  OrderTimelineEntry,
  PaymentIntent,
} from "@/core/types";

/** `GET /orders?status=…` tabs, per docs/LOGISTICS_API.md §4.2. */
export const ORDER_TAB_STATUSES = {
  active: [
    "awaiting_drop_off",
    "parcel_received_at_origin",
    "rider_assigned",
    "in_transit",
    "arrived_at_destination",
    "ready_for_collection",
  ],
  delivered: ["completed"],
  returns: [
    "return_initiated",
    "return_in_transit",
    "returned_to_origin",
    "ready_for_sender_collection",
    "return_completed",
  ],
} as const;

export type OrderTab = keyof typeof ORDER_TAB_STATUSES;

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

  /** GET /orders?status=…&page&limit — one page of the Consumer's orders, newest first. `statuses` is comma-joined; omit for every order. */
  async listPage(params: {
    statuses?: readonly string[];
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedList<Order>> {
    const query = new URLSearchParams();
    if (params.statuses?.length) query.set("status", params.statuses.join(","));
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 20));
    return httpClient.get<PaginatedList<Order>>(`${ENDPOINTS.orders.list}?${query.toString()}`);
  },

  /** GET /orders/:id/timeline — oldest first; render `label` as is. */
  async getTimeline(id: string): Promise<OrderTimelineEntry[]> {
    return httpClient.get<OrderTimelineEntry[]>(ENDPOINTS.orders.timeline(id));
  },

  /** GET /delivery-options — builds the parcel form (limits, handling flags, vehicle hints). Cache per session. */
  async getDeliveryOptions(): Promise<DeliveryOptions> {
    return httpClient.get<DeliveryOptions>(ENDPOINTS.logistics.deliveryOptions);
  },

  /** POST /delivery-quotes — price preview. Reserves nothing; 30/min, so debounce callers. */
  async quote(payload: DeliveryQuoteRequest): Promise<DeliveryQuoteResult> {
    return httpClient.post<DeliveryQuoteResult>(ENDPOINTS.logistics.deliveryQuotes, payload);
  },

  /**
   * After the Paystack redirect: the intent doesn't carry the order id,
   * so find the order whose `paymentIntentId` matches. It is the newest
   * order in practice, hence the short page.
   */
  async findOrderByPaymentIntent(intentId: string): Promise<Order | null> {
    const page = await realDeliveryService.listPage({ limit: 5 });
    return page.items.find((o) => o.paymentIntentId === intentId) ?? null;
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
