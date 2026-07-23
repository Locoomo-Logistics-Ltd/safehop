/**
 * Vendor (Shop Owner) domain types.
 * A Vendor manages one Node (Pickup Station) — receiving parcels via
 * QR scan, assigning shelf locations, and releasing parcels to
 * recipients via OTP verification.
 */

import type { LocoomoNode } from "./delivery.types";

export type ParcelNodeStatus =
  | "awaiting_pickup" // dropped by sender, not yet scanned in at this node
  | "checked_in" // scanned in, awaiting shelf assignment
  | "ready_for_collection" // shelved, waiting for recipient or rider
  | "awaiting_rider" // flagged for rider handoff
  | "released" // collected by recipient or handed to rider
  | "delayed"
  | "flagged";

export interface ShelfLocation {
  id: string; // e.g. "A3"
  rackLabel: string; // e.g. "Rack A"
  isOccupied: boolean;
}

export interface NodeParcel {
  id: string;
  trackingCode: string; // e.g. "LC-482TX"
  status: ParcelNodeStatus;
  sender: { name: string };
  receiver: { name: string };
  size: "small" | "medium" | "large" | "xl";
  shelfLocationId?: string;
  checkedInAt?: string;
  /** Cryptographic nonce tied to this parcel's QR code, required by every real-API scan call (check-in, release). */
  qrNonce?: string;
  createdAt: string;
}

export interface VendorNodeProfile extends LocoomoNode {
  capacity: {
    total: number;
    occupied: number;
  };
  isHighFull: boolean; // capacity-derived warning flag
}

export type ActivityEventType =
  | "handoff_to_rider"
  | "batch_received"
  | "scan_exception"
  | "node_closed"
  | "parcel_checked_in"
  | "parcel_released";

export interface ActivityLogEntry {
  id: string;
  type: ActivityEventType;
  title: string;
  description: string;
  timestamp: string;
  isException: boolean; // renders the red/warning variant
  tag?: string; // e.g. "12 Removed from inventory"
}

export type FlagReason = "damaged" | "wrong_item" | "missing" | "other";

export interface FlagParcelPayload {
  parcelId: string;
  reason: FlagReason;
  note?: string;
}

export interface ReleaseParcelPayload {
  parcelId: string;
  otpCode: string;
}
