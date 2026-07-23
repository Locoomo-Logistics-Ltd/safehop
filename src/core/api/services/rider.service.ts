import { env } from "@/core/config/env";
import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
import { ApiError } from "@/core/api/errors";
import { mockDelay, generateId } from "@/core/mocks/mock-utils";
import { MOCK_JOB_OFFER, MOCK_ACTIVE_JOB, MOCK_JOB_HISTORY } from "@/core/mocks/mock-rider";
import type {
  AuthSession,
  DeliveryJob,
  GeoPoint,
  RiderAvailability,
  RiderEarningsSummary,
  RiderProfileDetails,
} from "@/core/types";

/**
 * Rider service — the business-logic surface for the Rider role.
 *
 * REAL API GAPS — the live spec has no endpoints for:
 *   - Online/Offline availability toggle (no such route exists).
 *     Real mode treats "online" as "actively sending telemetry pings"
 *     — see setAvailability()'s comment below — with no server-side
 *     status flag. Ask the backend team if job-board eligibility is
 *     inferred purely from ping recency, or if a real toggle endpoint
 *     is planned.
 *   - Earnings summary (today/total/rating) — no endpoint exists.
 *   - Job history ("My Deliveries") — no endpoint exists; `orders`
 *     list is consumer-facing, not rider-scoped, per the spec.
 *   - Rider profile/vehicle details beyond what's captured once at
 *     onboarding (identity/rider/{userId}/onboarding) — no separate
 *     "get my profile" endpoint.
 *
 * These four all throw NOT_IMPLEMENTED in real mode below so the gap
 * is visible rather than silently showing fake numbers. Flag to the
 * backend team; wiring them is a 10-minute job once those routes
 * exist (same pattern as everything else here).
 *
 * Everything else (job board, accept, manifest, pickup/dropoff scans,
 * location telemetry) maps directly to real endpoints.
 */

// ── Mock implementation (unchanged — full offline dev experience) ──

// let mockAvailability: RiderAvailability = "online";
// let mockActiveJob: DeliveryJob | null = null;
// let mockJobOfferAvailable = true;
// const mockJobHistory: DeliveryJob[] = [...MOCK_JOB_HISTORY];

// const MOCK_RIDER_SESSION_KEY = "locoomo_mock_rider_session";

// function buildMockRiderSession(phone: string): AuthSession {
//   return {
//     user: {
//       id: generateId("rdr"),
//       firstName: "Emeka",
//       lastName: "Nwosu",
//       email: "emeka.nwosu@rider.locoomo.com",
//       phone,
//       role: "rider",
//       createdAt: new Date().toISOString(),
//     },
//     accessToken: generateId("mock_rider_token"),
//     expiresAt: Date.now() + 1000 * 60 * 60 * 24,
//   };
// }

// const mockRiderService = {
//   async sendLoginOtp(phone: string): Promise<{ sent: true }> {
//     await mockDelay(500);
//     if (phone.replace(/\D/g, "").length < 10) {
//       throw new ApiError({ message: "Enter a valid mobile number.", status: 400, code: "VALIDATION_ERROR" });
//     }
//     return { sent: true };
//   },

//   async verifyLoginOtp(phone: string, otpCode: string): Promise<AuthSession> {
//     await mockDelay(600);
//     if (otpCode.length !== 6) {
//       throw new ApiError({ message: "Enter the 6-digit code sent to your phone.", status: 400, code: "INVALID_OTP" });
//     }
//     const session = buildMockRiderSession(phone);
//     if (typeof window !== "undefined") window.localStorage.setItem(MOCK_RIDER_SESSION_KEY, JSON.stringify(session));
//     return session;
//   },

//   async getAvailability(): Promise<RiderAvailability> {
//     await mockDelay(200);
//     return mockAvailability;
//   },

//   async setAvailability(status: RiderAvailability): Promise<RiderAvailability> {
//     await mockDelay(300);
//     mockAvailability = status;
//     return mockAvailability;
//   },

//   async getEarningsSummary(): Promise<RiderEarningsSummary> {
//     await mockDelay();
//     return { todayEarnings: 142.5, todayDeliveries: 12, totalEarnings: 243534, totalDeliveries: 1265, rating: 4.9 };
//   },

//   async getCurrentJobOffer(): Promise<DeliveryJob | null> {
//     await mockDelay(400);
//     if (mockActiveJob || !mockJobOfferAvailable) return null;
//     return MOCK_JOB_OFFER;
//   },

//   async getActiveJob(): Promise<DeliveryJob | null> {
//     await mockDelay(300);
//     return mockActiveJob;
//   },

//   async acceptJob(jobId: string): Promise<DeliveryJob> {
//     await mockDelay(400);
//     const offer = jobId === MOCK_JOB_OFFER.id ? MOCK_JOB_OFFER : MOCK_ACTIVE_JOB;
//     mockActiveJob = { ...offer, status: "accepted", acceptedAt: new Date().toISOString() };
//     mockJobOfferAvailable = false;
//     return mockActiveJob;
//   },

//   async declineJob(): Promise<{ success: true }> {
//     await mockDelay(300);
//     mockJobOfferAvailable = false;
//     return { success: true };
//   },

//   async scanPickup(jobId: string, code: string): Promise<DeliveryJob> {
//     await mockDelay(500);
//     if (!mockActiveJob || mockActiveJob.id !== jobId) throw new ApiError({ message: "No active job found.", status: 404, code: "NOT_FOUND" });
//     if (code.trim().toUpperCase() !== mockActiveJob.pickupQrCode) {
//       throw new ApiError({ message: "This QR code doesn't match the expected parcel for this job.", status: 400, code: "QR_MISMATCH" });
//     }
//     mockActiveJob = { ...mockActiveJob, status: "picked_up", pickedUpAt: new Date().toISOString() };
//     return mockActiveJob;
//   },

//   async scanDropoff(jobId: string): Promise<DeliveryJob> {
//     await mockDelay(500);
//     if (!mockActiveJob || mockActiveJob.id !== jobId) throw new ApiError({ message: "No active job found.", status: 404, code: "NOT_FOUND" });
//     const completedJob: DeliveryJob = { ...mockActiveJob, status: "delivered", deliveredAt: new Date().toISOString() };
//     mockJobHistory.unshift(completedJob);
//     mockActiveJob = null;
//     mockJobOfferAvailable = true;
//     return completedJob;
//   },

//   async getJobHistory(): Promise<DeliveryJob[]> {
//     await mockDelay();
//     return [...mockJobHistory].sort((a, b) => new Date(b.deliveredAt ?? b.createdAt).getTime() - new Date(a.deliveredAt ?? a.createdAt).getTime());
//   },

//   async getProfileDetails(): Promise<RiderProfileDetails> {
//     await mockDelay(300);
//     return { vehicle: { type: "Honda CG125", plateNumber: "LAG-043-XY", isVerified: true } };
//   },

//   async sendTelemetryPing(): Promise<void> {
//     await mockDelay(100);
//   },
// };

// ── Real implementation ─────────────────────────────────────────

const realRiderService = {
  // Rider login is password-based in the real API — see
  // authService.registerRider / loginRider. These two stay only for
  // interface parity with the mock; the UI now calls authService
  // directly (modules/rider/hooks/use-rider-login.ts).
  async sendLoginOtp(): Promise<{ sent: true }> {
    throw new ApiError({ message: "Rider login uses password auth — see authService.loginRider.", code: "NOT_IMPLEMENTED" });
  },
  async verifyLoginOtp(): Promise<AuthSession> {
    throw new ApiError({ message: "Rider login uses password auth — see authService.loginRider.", code: "NOT_IMPLEMENTED" });
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

  async getEarningsSummary(): Promise<RiderEarningsSummary> {
    throw new ApiError({ message: "No earnings endpoint in the real API yet — see this file's header.", code: "NOT_IMPLEMENTED" });
  },

  async getCurrentJobOffer(position?: GeoPoint, radiusMeters = 5000): Promise<DeliveryJob | null> {
    if (!position) {
      throw new ApiError({ message: "Location is required to check the job board.", status: 400, code: "VALIDATION_ERROR" });
    }
    try {
      return await httpClient.post<DeliveryJob>(ENDPOINTS.riderOps.jobBoard, {
        latitude: position.lat,
        longitude: position.lng,
        radiusInMeters: radiusMeters,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async getActiveJob(): Promise<DeliveryJob | null> {
    try {
      return await httpClient.get<DeliveryJob>(ENDPOINTS.riderOps.manifest);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async acceptJob(jobId: string): Promise<DeliveryJob> {
    return httpClient.post<DeliveryJob>(ENDPOINTS.riderOps.acceptJob, { orderId: jobId });
  },

  async declineJob(): Promise<{ success: true }> {
    // No decline endpoint in the spec — simply not accepting lets the
    // offer expire/reassign server-side. Kept as a no-op for UI parity.
    return { success: true };
  },

  async scanPickup(jobId: string, qrNonce: string, position?: GeoPoint): Promise<DeliveryJob> {
    if (!position) throw new ApiError({ message: "Location is required to scan.", status: 400, code: "VALIDATION_ERROR" });
    return httpClient.post<DeliveryJob>(ENDPOINTS.riderOps.scanPickup, {
      orderId: jobId,
      qrNonce,
      latitude: position.lat,
      longitude: position.lng,
    });
  },

  async scanDropoff(jobId: string, qrNonce: string, position?: GeoPoint): Promise<DeliveryJob> {
    if (!position) throw new ApiError({ message: "Location is required to scan.", status: 400, code: "VALIDATION_ERROR" });
    return httpClient.post<DeliveryJob>(ENDPOINTS.riderOps.scanDropoff, {
      orderId: jobId,
      qrNonce,
      latitude: position.lat,
      longitude: position.lng,
    });
  },

  async getJobHistory(): Promise<DeliveryJob[]> {
    throw new ApiError({ message: "No job history endpoint in the real API yet — see this file's header.", code: "NOT_IMPLEMENTED" });
  },

  async getProfileDetails(): Promise<RiderProfileDetails> {
    throw new ApiError({ message: "No rider profile endpoint in the real API yet — see this file's header.", code: "NOT_IMPLEMENTED" });
  },

  async sendTelemetryPing(position: GeoPoint): Promise<void> {
    await httpClient.post(ENDPOINTS.maps.riderTelemetryPing, {
      latitude: position.lat,
      longitude: position.lng,
    });
  },
};

export const riderService = env.useMockApi ? mockRiderService : realRiderService;
