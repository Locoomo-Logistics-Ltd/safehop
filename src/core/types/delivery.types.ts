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

/** Payload built up across the multi-step "New Delivery" flow */
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

// ── Real API fare + order request/scan shapes ───────────────────

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
  | "ORIGIN_CHECK_IN" // vendor scans an incoming consumer drop-off
  | "RIDER_PICKUP" // rider scans at the origin node
  | "DESTINATION_DROPOFF" // rider scans at the destination node
  | "RECEIVER_COLLECTION"; // vendor/node staff scans the recipient's OTP

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
