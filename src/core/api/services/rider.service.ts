
import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
import { ApiError } from "@/core/api/errors";

import type { PaginatedList } from "@/core/api/types";

import type {
  AuthSession,
  AvailableOrder,
  HandoffCode,
  HandoffOrderSummary,
  HandoffType,
  ListAvailableOrdersParams,
  MyOrderSummary,
  MyRevenueSplitEntry,
  RequestHandoffCodePayload,
  RiderAvailability,
  RiderEarningsSummary,
  RiderUploadSignature,
  RiderVerificationDocumentType,
  RiderVerificationProfile,
  SubmitRiderVerificationPayload,
} from "@/core/types";

/**
 * Rider service — the business-logic surface for the Rider role.
 *
 * REAL API GAPS — the live spec has no endpoint for:
 *   - Online/Offline availability toggle (no such route exists, and no
 *     telemetry-ping route either — see setAvailability()'s comment
 *     below). Ask the backend team whether job-board eligibility is
 *     inferred some other way, or if a real toggle endpoint is planned.
 *
 * Throws NOT_IMPLEMENTED below so the gap is visible rather than
 * silently showing fake data. Flag to the backend team; wiring it is
 * a small job once that route exists.
 *
 * **2026-08-21**: `getProfileDetails()` (a fabricated `VehicleDetails`
 * shape — type/plate/isVerified, none of which the real API has ever
 * had a route for) is deleted, not left `NOT_IMPLEMENTED` — its one
 * caller (`RiderProfileScreen`'s "Vehicle Details" card) was rebuilt to
 * show the one real, license-shaped field that *does* exist:
 * `licenseNumber` off `GET /riders/me` (`useRiderVerification`,
 * already fetched on that screen for the Verification card below it).
 * `use-rider-profile.ts` is deleted along with it.
 *
 * `getEarningsSummary` / `listMyEarnings` (`GET /earnings/mine`) are
 * real, confirmed per docs/API.md — the rider's own revenue-split
 * entries, one per completed order they delivered. There's no
 * server-side "today" filter or aggregate, so `getEarningsSummary`
 * fetches the full list and reduces it client-side; there's no rating
 * field anywhere in the real API either, so `RiderEarningsSummary` no
 * longer carries one.
 *
 * The job board, accepting, both handoff codes, and the rider's own
 * order list (`getMyOrders`) run through the `handoffs` methods at the
 * bottom of this file. `getMyOrders` (`GET /handoffs/my-orders`, added
 * 2026-08-17) closes the "my active deliveries" gap that used to be
 * bridged by `store/rider-jobs.store.ts` — that store is deleted; see
 * `modules/rider/hooks/use-my-orders.ts`. The undocumented `riderOps.*`
 * versions (getCurrentJobOffer/getActiveJob/acceptJob/declineJob/
 * scanPickup/scanDropoff) were removed 2026-08-15 along with their
 * screens.
 */

const realRiderService = {
  // Rider auth is the same password-based POST /auth/register and
  // POST /auth/login every role shares — see authService.registerConsumer
  // (role: "rider") / authService.loginConsumer, called directly from
  // modules/user/hooks/use-auth.ts. These two stay only for interface
  // parity with the mock; there's no OTP concept in the real API.
  async sendLoginOtp(): Promise<{ sent: true }> {
    throw new ApiError({ message: "Rider login uses password auth — see authService.loginConsumer.", code: "NOT_IMPLEMENTED" });
  },
  async verifyLoginOtp(): Promise<AuthSession> {
    throw new ApiError({ message: "Rider login uses password auth — see authService.loginConsumer.", code: "NOT_IMPLEMENTED" });
  },

  async getAvailability(): Promise<RiderAvailability> {
    throw new ApiError({ message: "No availability endpoint in the real API yet — see this file's header.", code: "NOT_IMPLEMENTED" });
  },

  async setAvailability(status: RiderAvailability): Promise<RiderAvailability> {
    // No dedicated toggle endpoint. Best real-world approximation:
    // start/stop sending telemetry pings, since job-board eligibility
    // likely depends on ping recency server-side. Confirm with the
    // backend team whether this is sufficient or a real toggle is
    // needed.
    return status;
  },

  /**
   * Real, confirmed route (`GET /earnings/mine`) — every revenue-split
   * entry for an order this rider delivered. Requested at the max page
   * size, same convention as `getMyOrders` below, since no screen built
   * on this has pagination controls yet.
   */
  async listMyEarnings(): Promise<MyRevenueSplitEntry[]> {
    const raw = await httpClient.get<PaginatedList<MyRevenueSplitEntry>>(
      `${ENDPOINTS.earnings.mine}?limit=100`
    );
    return raw.items;
  },

  /** Reduces `listMyEarnings()` into today/total stats for the Home + Profile stat cards. */
  async getEarningsSummary(): Promise<RiderEarningsSummary> {
    const entries = await realRiderService.listMyEarnings();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let todayEarnings = 0;
    let todayDeliveries = 0;
    let totalEarnings = 0;

    for (const entry of entries) {
      const naira = entry.amountKobo / 100;
      totalEarnings += naira;
      if (new Date(entry.createdAt) >= startOfToday) {
        todayEarnings += naira;
        todayDeliveries += 1;
      }
    }

    return { todayEarnings, todayDeliveries, totalEarnings, totalDeliveries: entries.length };
  },

  // ── Verification / KYC onboarding ───────────────────────────────
  // Real, confirmed routes per docs/API.md: get an upload signature,
  // upload the document straight to Cloudinary (not through this
  // API), then submit the resulting public_id here.

  async getVerificationUploadSignature(
    documentType: RiderVerificationDocumentType = "rating_screenshot"
  ): Promise<RiderUploadSignature> {
    return httpClient.get<RiderUploadSignature>(
      `${ENDPOINTS.riders.uploadSignature}?documentType=${documentType}`
    );
  },

  /**
   * Uploads the file directly to Cloudinary using the signed
   * authorization from getVerificationUploadSignature() — per
   * docs/API.md, the file bytes never pass through this API. Returns
   * the `public_id` to pass to submitVerification().
   */
  async uploadVerificationDocument(
    uploadSignature: RiderUploadSignature,
    file: File
  ): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", uploadSignature.apiKey);
    formData.append("timestamp", String(uploadSignature.timestamp));
    formData.append("signature", uploadSignature.signature);
    formData.append("folder", uploadSignature.folder);
    formData.append("type", "authenticated");

    let response: Response;
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${uploadSignature.cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
    } catch {
      throw new ApiError({
        message: "Couldn't reach the upload server. Check your connection and try again.",
        code: "NETWORK_ERROR",
        status: 0,
      });
    }

    const json = (await response.json().catch(() => null)) as { public_id?: string } | null;
    if (!response.ok || !json?.public_id) {
      throw new ApiError({
        message: "We couldn't upload your document. Please try again.",
        code: "UPLOAD_FAILED",
        status: response.status,
      });
    }
    return json.public_id;
  },

  async submitVerification(
    payload: SubmitRiderVerificationPayload
  ): Promise<RiderVerificationProfile> {
    return httpClient.post<RiderVerificationProfile>(ENDPOINTS.riders.onboarding, payload);
  },

  /** Throws `404 NOT_FOUND` (via ApiError) if the rider hasn't started verification yet — callers check `error.code`, same pattern as `nodeService.getMyNodeOperatorProfile`. */
  async getVerificationProfile(): Promise<RiderVerificationProfile> {
    return httpClient.get<RiderVerificationProfile>(ENDPOINTS.riders.me);
  },

  // ── Handoffs: the rider's side ──────────────────────────────────
  // Real, confirmed routes per docs/API.md (2026-08-14). These
  // supersede getCurrentJobOffer/acceptJob/scanPickup/scanDropoff
  // above, which target undocumented `riderOps.*` routes. All three
  // require an `active` RiderProfile — a valid Rider session isn't
  // enough, and the rejection is `403 RIDER_NOT_ACTIVE`, distinct from
  // the plain `403 FORBIDDEN` a non-Rider gets.

  /**
   * Unclaimed orders sitting at their origin Node, sorted nearest-first
   * to `latitude`/`longitude`. The coordinates are used for this one
   * request's sort and are not stored — this is not a telemetry ping
   * (see sendTelemetryPing above for that).
   */
  async listAvailableOrders(
    params: ListAvailableOrdersParams
  ): Promise<PaginatedList<AvailableOrder>> {
    const query = new URLSearchParams({
      latitude: String(params.latitude),
      longitude: String(params.longitude),
    });
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.limit !== undefined) query.set("limit", String(params.limit));

    return httpClient.get<PaginatedList<AvailableOrder>>(
      `${ENDPOINTS.handoffs.availableOrders}?${query.toString()}`
    );
  },

  /**
   * Claims an available order. Atomic and race-safe — if another rider
   * accepted first, this throws `409 ILLEGAL_ORDER_TRANSITION` rather
   * than both riders "winning". `409 RIDER_CAPACITY_UNAVAILABLE` means
   * the rider is already at the 3-concurrent-delivery cap.
   */
  async acceptAvailableOrder(orderId: string): Promise<HandoffOrderSummary> {
    return httpClient.post<HandoffOrderSummary>(ENDPOINTS.handoffs.accept(orderId));
  },

  /**
   * Every order this rider has ever been assigned, current and past,
   * newest first. Real, confirmed route per docs/API.md (2026-08-17).
   * Filter on `status` client-side to tell active from settled — see
   * `modules/rider/hooks/use-my-orders.ts`. Requested at the max page
   * size, same convention as `listAvailableOrders`'s callers elsewhere,
   * since no screen built on this has pagination controls yet.
   */
  async getMyOrders(): Promise<MyOrderSummary[]> {
    const raw = await httpClient.get<PaginatedList<MyOrderSummary>>(
      `${ENDPOINTS.handoffs.myOrders}?limit=100`
    );
    return raw.items;
  },

  /**
   * Issues a fresh 6-digit code for a handoff the rider is about to
   * perform. Expires in 5 minutes, so call this at the counter, not in
   * advance; calling again supersedes any prior unused code for the
   * same `(order, type)`. `404 NOT_FOUND` means this rider isn't the
   * one assigned to this order.
   *
   * The returned code is read aloud/shown to the Node operator and
   * nowhere else — don't log it, persist it, or put it in a URL.
   */
  async requestHandoffCode(orderId: string, type: HandoffType): Promise<HandoffCode> {
    const payload: RequestHandoffCodePayload = { type };
    return httpClient.post<HandoffCode>(ENDPOINTS.handoffs.requestCode(orderId), payload);
  },
};

export const riderService = realRiderService;
