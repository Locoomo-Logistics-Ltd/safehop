import type {
  HandlingFlag,
  KnownOrderStatus,
  LabelInstructions,
  OrderDelivery,
  Parcel,
  VehicleClass,
} from "./logistics.types";

/**
 * Real payments + orders domain — POST/GET /payments/intents and
 * GET /orders(/:id), added to docs/API.md 2026-08-12. This is the
 * documented replacement for the older, undocumented
 * orders/calculate-fare + orders/book flow in delivery.types.ts /
 * delivery.service.ts (kept there only because the commented-out mock
 * delivery service still references it — see delivery.types.ts's own
 * note). Order placement is Node-to-Node here (both `originNodeId` and
 * `destinationNodeId` are real Nodes) — there is no free-text
 * destination address in the real contract, unlike the old model.
 */

/** Real API's parcel size enum for payments/intents + orders — distinct from delivery.types.ts's legacy `ParcelSize` ("xl" vs "extra_large"). */
export type OrderParcelSize = "small" | "medium" | "large" | "extra_large";

/** Maps the UI's 4-tier `ParcelSize` ("xl") to the real API's `OrderParcelSize` ("extra_large") — the only member that differs. */
export function toOrderParcelSize(size: "small" | "medium" | "large" | "xl"): OrderParcelSize {
  return size === "xl" ? "extra_large" : size;
}

export interface CreatePaymentIntentPayload {
  originNodeId: string;
  destinationNodeId: string;
  receiverFullName: string;
  receiverEmail: string;
  receiverPhone: string;
  parcelDescription: string;
  parcelSize: OrderParcelSize;
  /** 0.1 – 1000, max 1 decimal. Optional. */
  weightKg?: number;
  /** All three dimensions or none. Integer 1 – 500. */
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  handling?: HandlingFlag[];
}

export interface PaymentIntentFeeBreakdown {
  pricingRuleId: string;
  vehicleClass?: VehicleClass;
  baseFeeKobo: number;
  perKmRateKobo: number;
  distanceKm: number;
  /** `route` = measured road distance; `estimate` = straight line × factor. */
  distanceSource?: "route" | "estimate";
  straightLineKm?: number;
  deliveryFeeKobo?: number;
  destinationFeeKobo?: number;
  totalKobo: number;
}

export type PaymentIntentStatus = "pending" | "paid" | "failed" | "expired";

/** POST /payments/intents response. GET /payments/intents/:id returns the same shape minus `authorizationUrl` (Paystack's checkout link is single-use). */
export interface PaymentIntent {
  id: string;
  originNodeId: string;
  destinationNodeId: string;
  receiverFullName: string;
  receiverEmail: string;
  receiverPhone: string;
  parcelDescription: string;
  parcelSize: OrderParcelSize;
  parcel?: Parcel;
  feeBreakdown: PaymentIntentFeeBreakdown;
  amountKobo: number;
  status: PaymentIntentStatus;
  expiresAt: string;
  authorizationUrl?: string;
}

/**
 * The documented lifecycle (docs/LOGISTICS_API.md §2) plus an open
 * `string` arm, so a status the backend adds later still type-checks
 * and renders through the neutral fallback instead of breaking a screen.
 */
export type OrderStatus = KnownOrderStatus | (string & {});

/** GET /orders and GET /orders/:id response shape — real, confirmed per docs/API.md. */
export interface Order {
  id: string;
  trackingCode: string;
  paymentIntentId: string;
  originNodeId: string;
  originNodeName: string;
  originNodeAddress: string;
  destinationNodeId: string;
  destinationNodeName: string;
  destinationNodeAddress: string;
  receiverFullName: string;
  receiverEmail: string;
  receiverPhone: string;
  parcelDescription: string;
  parcelSize: OrderParcelSize;
  parcel?: Parcel;
  amountKobo: number;
  status: OrderStatus;
  createdAt: string;
  /** Public tracking page link, including its access token — share as is. */
  trackingUrl?: string;
  /** What the sender hand-writes on the parcel (no printers, no QR). */
  labelInstructions?: LabelInstructions;
  /** `null` until the parcel is dropped off. */
  delivery?: OrderDelivery | null;
}
