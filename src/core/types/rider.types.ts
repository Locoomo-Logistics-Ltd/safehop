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

// ── Rider verification / KYC onboarding ─────────────────────────
// Matches: GET /riders/verification/upload-signature → (direct
// Cloudinary upload) → POST /riders/onboarding → GET /riders/me.
// Distinct from account registration (POST /auth/rider/register) —
// this is the post-login step that gets a Rider from `pending` to
// `active` so they can appear on the job board.

/** Only value the real API accepts today, per docs/API.md. */
export type RiderVerificationDocumentType = "rating_screenshot";

export type RiderVerificationStatus = "pending" | "active";

export interface RiderUploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export interface RiderVerificationDocument {
  documentType: RiderVerificationDocumentType;
  uploadedAt: string;
  /** Signed, time-limited Cloudinary URL — freshly generated per response, never persist it. */
  viewUrl: string;
}

export interface RiderVerificationProfile {
  profileId: string;
  currentEmployer: string;
  status: RiderVerificationStatus;
  documents: RiderVerificationDocument[];
}

export interface SubmitRiderVerificationPayload {
  currentEmployer: string;
  documentType: RiderVerificationDocumentType;
  cloudinaryPublicId: string;
}
