/**
 * Core logistics domain types.
 * A "Node" is a Pickup Station (shop, pharmacy, etc.) in the network.
 * A "Delivery" (called "Order" in the real API) moves a Parcel from an
 * origin Node to a destination ADDRESS — the real API resolves/geocodes
 * a free-text address server-side rather than requiring a destination
 * Node, so `destinationAddress` is a string, not a node reference.
 */

/** UI offers 4 tiers; the real API only has SMALL/MEDIUM/LARGE — "xl" maps to LARGE when sent to the server (see delivery.service.ts). */
export type ParcelSize = "small" | "medium" | "large" | "xl";

export type DeliveryMethod = "drop_and_pick" | "express";

export type DeliveryStatus =
  | "draft"
  | "pending_payment"
  | "package_dropped"
  | "in_transit"
  | "arrived_at_node"
  | "ready_for_collection"
  | "completed"
  | "cancelled";

export type PaymentMethod =
  | "alat_pay"
  | "bank_transfer"
  | "opay"
  | "card"
  | "ussd";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface LocoomoNode {
  id: string;
  name: string;
  address: string;
  area: string; // e.g. "Lagos Island"
  location: GeoPoint;
  distanceKm?: number; // populated relative to a reference point
  openingHours: string; // e.g. "8am - 8pm"
  isOpenNow: boolean;
  capacity: {
    total: number;
    occupied: number;
  };
}

/**
 * Real `GET /nodes`/`GET /nodes/nearby` Node shape, per docs/API.md —
 * distinct from `LocoomoNode` above, which models a still-unconfirmed
 * shape (`isOpenNow`, `capacity.occupied`/`.total`); don't conflate the
 * two. There's no live occupancy/open-now signal from the real
 * backend — `capacity` is the self-reported max, and there's no
 * connectivity/hours-open concept at all (same correction already
 * applied to Admin's `AdminNodeRecord`).
 */
export interface PickupNode {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  location: GeoPoint;
  capacity: number;
  operatingHours: string | null;
  /** Only present from `GET /nodes/nearby` (`distanceMeters` / 1000), not `GET /nodes/:id`. */
  distanceKm?: number;
}

export interface ParcelDetails {
  description: string;
  size: ParcelSize;
  estimatedWeightKg?: number;
}

export interface ReceiverDetails {
  fullName: string;
  email: string;
  phone: string;
}

/** @deprecated Modeled on the undocumented orders/calculate-fare response — real fee data now comes from `PaymentIntent.feeBreakdown` (core/types/payment.types.ts), in kobo, not this naira breakdown. Kept only for the commented-out mock delivery service / `Delivery` below. */
export interface DeliveryQuote {
  baseFare: number;
  expressSurcharge: number;
  insurance: number;
  total: number;
  currency: "NGN";
}

export interface TrackingEvent {
  id: string;
  status: DeliveryStatus;
  label: string; // e.g. "Arrived at Node"
  description: string;
  location?: string;
  timestamp: string;
}

/** @deprecated Real order data now comes from `Order` (core/types/payment.types.ts) via `GET /orders`/`GET /orders/:id` — a materially different shape (no `quote` breakdown, no `route`/`collectionQrCode`/`trackingHistory`, `destinationAddress` replaced by a real destination Node). Kept only because the commented-out mock delivery service / `MOCK_DELIVERIES` still assume this shape. */
export interface Delivery {
  id: string;
  trackingCode: string; // e.g. "LCM-2026-0012"
  status: DeliveryStatus;
  method: DeliveryMethod;
  receiver: ReceiverDetails;
  parcel: ParcelDetails;
  originNode?: LocoomoNode;
  /** Free-text destination address (geocoded server-side) — real API has no destination Node concept. */
  destinationAddress: string;
  route: {
    originLabel: string;
    destinationLabel: string;
  };
  quote: DeliveryQuote;
  paymentMethod?: PaymentMethod;
  /**
   * The QR payload shown to the sender for drop-off / to the recipient
   * for collection. Real API scans require both a trackingCode AND a
   * cryptographic qrNonce — see qrNonce below. The rendered QR should
   * encode both (convention: JSON.stringify({ trackingCode, qrNonce })
   * — confirm against the backend team's actual QR payload format).
   */
  collectionQrCode?: string;
  qrNonce?: string;
  trackingHistory: TrackingEvent[];
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Superseded by the delivery-draft.store.ts fields feeding `CreatePaymentIntentPayload` directly (destination is now a Node id, not a free-text address). Payload built up across the multi-step "New Delivery" flow. */
export interface CreateDeliveryDraft {
  receiver: ReceiverDetails;
  parcel: ParcelDetails;
  /** Free-text address — see Delivery.destinationAddress above. */
  destinationAddress: string;
  originNodeId: string;
  method: DeliveryMethod;
}

/** Maps our 4-tier UI parcel size to the real API's 3-tier enum. */
export function toApiParcelSize(size: ParcelSize): "SMALL" | "MEDIUM" | "LARGE" {
  if (size === "small") return "SMALL";
  if (size === "medium") return "MEDIUM";
  return "LARGE"; // "large" and "xl" both map to LARGE
}

// ── Legacy fare/order request shapes ─────────────────────────────
// `CalculateFarePayload`/`BookOrderPayload` targeted undocumented
// routes (`orders/calculate-fare`, `orders/book`) that don't appear
// anywhere in docs/API.md. The real, documented order-placement
// contract is `POST /payments/intents` (see core/types/payment.types.ts
// and delivery.service.ts) — Node-to-Node, not Node-to-address, and a
// single call rather than calculate-then-book. Kept here, unused by
// real app code as of 2026-08-12, only because the commented-out mock
// delivery service and `Delivery`/`DeliveryQuote` below still assume
// this shape — don't build new real-mode code against these two.

export interface CalculateFarePayload {
  originNodeId: string;
  destinationAddress: string;
  parcelSize: "SMALL" | "MEDIUM" | "LARGE";
}

export interface BookOrderPayload {
  originNodeId: string;
  destinationAddress: string;
  receiverName: string;
  receiverPhone: string;
  parcelSize: "SMALL" | "MEDIUM" | "LARGE";
  deliveryFee: number;
  paymentReference?: string;
}

/** The four handoff moments in an order's lifecycle, per the real API's ProcessScanDto. */
export type ScanHandoffType =
  | "ORIGIN_CHECK_IN" // Node operator scans an incoming consumer drop-off
  | "RIDER_PICKUP" // rider scans at the origin node
  | "DESTINATION_DROPOFF" // rider scans at the destination node
  | "RECEIVER_COLLECTION"; // Node operator scans the recipient's OTP

export interface ScanHandoffPayload {
  trackingCode: string;
  type: ScanHandoffType;
  latitude: number;
  longitude: number;
  qrNonce: string;
  /** Required only for RECEIVER_COLLECTION. */
  collectionOtp?: string;
}

export interface ScanCollectionPayload {
  orderId: string;
  otpCode: string;
  latitude: number;
  longitude: number;
  qrNonce: string;
}

/** Convention for encoding a QR payload — confirm against the backend's actual format once testable. */
export function encodeQrPayload(trackingCode: string, qrNonce: string): string {
  return JSON.stringify({ trackingCode, qrNonce });
}

export function decodeQrPayload(raw: string): { trackingCode: string; qrNonce: string } | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.trackingCode === "string" && typeof parsed.qrNonce === "string") {
      return { trackingCode: parsed.trackingCode, qrNonce: parsed.qrNonce };
    }
    return null;
  } catch {
    return null;
  }
}
