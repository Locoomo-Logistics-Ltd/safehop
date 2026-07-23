/**
 * Rider domain types.
 * A Rider goes Online/Offline, receives delivery Job offers, accepts
 * or declines them, then progresses a job through pickup → transit →
 * delivered via QR scans, earning per completed job.
 */

import type { GeoPoint } from "./delivery.types";

export type RiderAvailability = "online" | "offline";

export type JobStatus =
  | "offered" // shown to rider, awaiting accept/decline
  | "accepted" // en route to pickup
  | "picked_up" // QR scanned at pickup, en route to dropoff
  | "delivered" // QR scanned at dropoff, job complete
  | "declined"
  | "expired";

/** Drives the 3-step Pickup → Transit → Delivered stepper. */
export type JobStage = "pickup" | "transit" | "delivered";

export interface JobLocation {
  label: string; // e.g. "Central Hub Node Alpha"
  address: string;
  location: GeoPoint;
}

export interface DeliveryJob {
  id: string;
  status: JobStatus;
  isHighPriority: boolean;
  isHighDemandArea: boolean;
  payout: number; // NGN
  distanceKm: number;
  etaMinutes: number;
  pickup: JobLocation;
  dropoff: JobLocation;
  parcelCount: number;
  parcelNote: string; // e.g. "1 Express 2Lb"
  pickupQrCode: string; // tracking code expected at pickup scan
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface RiderEarningsSummary {
  todayEarnings: number;
  todayDeliveries: number;
  totalEarnings: number;
  totalDeliveries: number;
  rating: number; // out of 5
}

export type EarningsFilterRange = "this_week" | "this_month" | "all_time";

export interface VehicleDetails {
  type: string; // e.g. "Honda CG125"
  plateNumber: string;
  isVerified: boolean;
}

export interface RiderProfileDetails {
  vehicle: VehicleDetails;
}

export interface SendOtpPayload {
  phone: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otpCode: string;
}
