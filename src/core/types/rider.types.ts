/**
 * Rider domain types. A Rider goes Online/Offline, claims orders off
 * the job board, and carries them through pickup → transit → delivered
 * via the 6-digit handoff codes in `core/types/handoff.types.ts`.
 */

export type RiderAvailability = "online" | "offline";

/**
 * Reduced client-side from `GET /earnings/mine`'s revenue-split entries
 * (`riderService.listMyEarnings()`) — the real API has no server-side
 * "today" filter, aggregate, or rating field.
 */
export interface RiderEarningsSummary {
  todayEarnings: number;
  todayDeliveries: number;
  totalEarnings: number;
  totalDeliveries: number;
}

export type EarningsFilterRange = "this_week" | "this_month" | "all_time";

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
  /** Self-reported, 1-50 chars, no format/document verification. `null` for riders who onboarded before this field existed (added to docs/API.md 2026-08-17). */
  licenseNumber: string | null;
  status: RiderVerificationStatus;
  documents: RiderVerificationDocument[];
}

export interface SubmitRiderVerificationPayload {
  currentEmployer: string;
  /** Self-reported, 1-50 chars — per docs/API.md, not checked against any document even though `documentType` is. */
  licenseNumber: string;
  documentType: RiderVerificationDocumentType;
  cloudinaryPublicId: string;
}
