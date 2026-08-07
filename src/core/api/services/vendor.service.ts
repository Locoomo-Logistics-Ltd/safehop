
import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
import { ApiError } from "@/core/api/errors";
import { generateId } from "@/core/mocks/mock-utils";
import { MOCK_NODES } from "@/core/mocks/mock-nodes";
// import {
//   MOCK_NODE_PARCELS,
//   MOCK_OCCUPIED_SHELVES,
//   MOCK_SHELF_LOCATIONS,
// } from "@/core/mocks/mock-vendor";
// import { MOCK_ACTIVITY_LOG } from "@/core/mocks/mock-activity";
import { useAuthStore } from "@/store/auth.store";
import type {
  ActivityLogEntry,
  FlagParcelPayload,
  GeoPoint,
  NodeOperatorOnboardingPayload,
  NodeOperatorProfile,
  NodeParcel,
  ScanHandoffPayload,
  ScanCollectionPayload,
  ShelfLocation,
  VendorNodeProfile,
} from "@/core/types";

/**
 * Vendor service — the business-logic surface for the Shop Owner role.
 *
 * REAL API GAPS — three UI features here have NO backend endpoint yet:
 *   - Shelf location assignment (assignShelf) — no endpoint exists.
 *     `real*` implementation is a client-only no-op; the shelf choice
 *     is not persisted server-side until the backend adds one.
 *   - Flagging a parcel issue (flagParcel) — no endpoint exists.
 *     Throws a clear "not supported yet" error in real mode rather
 *     than silently pretending to succeed.
 *   - A dedicated Activity Log — no endpoint exists. `listActivity()`
 *     maps to GET /notifications/user/{userId} as the closest real
 *     equivalent (adjust the mapping in `mapNotificationToActivity()`
 *     below once you've seen a real notification payload).
 *
 * Everything else (inventory, check-in scan, release-to-recipient
 * scan) maps directly to real endpoints.
 *
 * `onboardNode` / `getMyNodeOperatorProfile` wire the self-service
 * Node setup routes (`POST /node-operators/onboarding`,
 * `GET /node-operators/me`) — real, confirmed per docs/API.md, and
 * previously unintegrated (see docs/API_INTEGRATION_STATUS.md).
 */

// ── Real API response mapping helpers ───────────────────────────

/** Adjust once you've confirmed the real /nodes/operator/inventory response shape. */
function mapInventoryResponse(raw: unknown): { node: VendorNodeProfile; parcels: NodeParcel[] } {
  const data = raw as { node?: Partial<VendorNodeProfile>; parcels?: NodeParcel[] };
  const fallbackNode = MOCK_NODES[1];

  const node: VendorNodeProfile = {
    id: data.node?.id ?? fallbackNode.id,
    name: data.node?.name ?? fallbackNode.name,
    address: data.node?.address ?? fallbackNode.address,
    area: data.node?.area ?? fallbackNode.area,
    location: data.node?.location ?? fallbackNode.location,
    openingHours: data.node?.openingHours ?? fallbackNode.openingHours,
    isOpenNow: data.node?.isOpenNow ?? true,
    capacity: data.node?.capacity ?? { total: 50, occupied: data.parcels?.length ?? 0 },
    isHighFull: data.node?.isHighFull ?? false,
  };

  return { node, parcels: data.parcels ?? [] };
}

/** Adjust once you've confirmed the real notification payload shape. */
function mapNotificationToActivity(raw: unknown): ActivityLogEntry {
  const n = raw as { id?: string; title?: string; message?: string; body?: string; createdAt?: string; isException?: boolean; type?: string };
  return {
    id: n.id ?? generateId("notif"),
    type: "parcel_checked_in",
    title: n.title ?? "Notification",
    description: n.message ?? n.body ?? "",
    timestamp: n.createdAt ?? new Date().toISOString(),
    isException: n.isException ?? false,
  };
}

function currentUserId(): string {
  const userId = useAuthStore.getState().session?.user.id;
  if (!userId) {
    throw new ApiError({ message: "Not signed in.", status: 401, code: "UNAUTHENTICATED" });
  }
  return userId;
}

// ── In-memory mock store ────────────────────────────────────────

// const mockParcelStore: NodeParcel[] = [...MOCK_NODE_PARCELS];
// let mockActivityStore: ActivityLogEntry[] = [...MOCK_ACTIVITY_LOG];
// const mockOccupiedShelves = new Set(MOCK_OCCUPIED_SHELVES);

// function buildShelfList(): ShelfLocation[] {
//   const all: ShelfLocation[] = [];
//   for (const id of MOCK_SHELF_LOCATIONS.rackA) all.push({ id, rackLabel: "Rack A", isOccupied: mockOccupiedShelves.has(id) });
//   for (const id of MOCK_SHELF_LOCATIONS.rackB) all.push({ id, rackLabel: "Rack B", isOccupied: mockOccupiedShelves.has(id) });
//   return all;
// }

// const mockVendorService = {
//   async getNodeProfile(): Promise<VendorNodeProfile> {
//     await mockDelay();
//     const baseNode = MOCK_NODES[1];
//     const occupied = mockParcelStore.length;
//     return { ...baseNode, capacity: { total: 50, occupied }, isHighFull: occupied / 50 >= 0.6 };
//   },

//   async listParcels(): Promise<NodeParcel[]> {
//     await mockDelay();
//     return [...mockParcelStore].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
//   },

//   async lookupParcelByCode(code: string): Promise<NodeParcel> {
//     await mockDelay(500);
//     const parcel = mockParcelStore.find((p) => p.trackingCode.toLowerCase() === code.trim().toLowerCase());
//     if (!parcel) throw new ApiError({ message: `No parcel found for code "${code}".`, status: 404, code: "NOT_FOUND" });
//     return parcel;
//   },

//   async checkIn(trackingCodeOrParcelId: string, position?: GeoPoint, qrNonce?: string): Promise<NodeParcel> {
//     void position;
//     void qrNonce;
//     await mockDelay(400);
//     const index = mockParcelStore.findIndex(
//       (p) => p.id === trackingCodeOrParcelId || p.trackingCode.toLowerCase() === trackingCodeOrParcelId.trim().toLowerCase()
//     );
//     if (index === -1) throw new ApiError({ message: `No parcel found for "${trackingCodeOrParcelId}".`, status: 404, code: "NOT_FOUND" });

//     const updated: NodeParcel = { ...mockParcelStore[index], status: "checked_in", checkedInAt: new Date().toISOString() };
//     mockParcelStore[index] = updated;
//     mockActivityStore = [
//       { id: generateId("act"), type: "parcel_checked_in", title: "Parcel Checked In", description: `${updated.trackingCode} scanned and checked in.`, timestamp: new Date().toISOString(), isException: false },
//       ...mockActivityStore,
//     ];
//     return updated;
//   },

//   async listShelves(): Promise<ShelfLocation[]> {
//     await mockDelay(200);
//     return buildShelfList();
//   },

//   async assignShelf(parcelId: string, shelfId: string): Promise<NodeParcel> {
//     await mockDelay(400);
//     const index = mockParcelStore.findIndex((p) => p.id === parcelId);
//     if (index === -1) throw new ApiError({ message: "Parcel not found.", status: 404, code: "NOT_FOUND" });
//     if (mockOccupiedShelves.has(shelfId)) throw new ApiError({ message: "That shelf is already occupied.", status: 409, code: "SHELF_OCCUPIED" });

//     mockOccupiedShelves.add(shelfId);
//     const updated: NodeParcel = { ...mockParcelStore[index], status: "ready_for_collection", shelfLocationId: shelfId };
//     mockParcelStore[index] = updated;
//     return updated;
//   },

//   async sendReleaseOtp(parcelId: string): Promise<{ sent: true }> {
//     await mockDelay(500);
//     const parcel = mockParcelStore.find((p) => p.id === parcelId);
//     if (!parcel) throw new ApiError({ message: "Parcel not found.", status: 404, code: "NOT_FOUND" });
//     return { sent: true };
//   },

//   async releaseParcel(parcelId: string, otpCode: string, position?: GeoPoint, qrNonce?: string): Promise<NodeParcel> {
//     void position;
//     void qrNonce;
//     await mockDelay(600);
//     const index = mockParcelStore.findIndex((p) => p.id === parcelId);
//     if (index === -1) throw new ApiError({ message: "Parcel not found.", status: 404, code: "NOT_FOUND" });
//     if (!otpCode.startsWith("492") || otpCode.length !== 6) {
//       throw new ApiError({ message: "Incorrect code. 2 attempts remaining.", status: 400, code: "INVALID_OTP" });
//     }
//     const updated: NodeParcel = { ...mockParcelStore[index], status: "released" };
//     mockParcelStore[index] = updated;
//     mockActivityStore = [
//       { id: generateId("act"), type: "parcel_released", title: "Parcel Released", description: `${updated.trackingCode} released to ${updated.receiver.name}.`, timestamp: new Date().toISOString(), isException: false },
//       ...mockActivityStore,
//     ];
//     return updated;
//   },

//   async flagParcel(payload: FlagParcelPayload): Promise<{ success: true }> {
//     await mockDelay(500);
//     const parcel = mockParcelStore.find((p) => p.id === payload.parcelId);
//     if (!parcel) throw new ApiError({ message: "Parcel not found.", status: 404, code: "NOT_FOUND" });
//     mockActivityStore = [
//       { id: generateId("act"), type: "scan_exception", title: "Issue Flagged", description: `${parcel.trackingCode} flagged: ${payload.reason.replace("_", " ")}.`, timestamp: new Date().toISOString(), isException: true },
//       ...mockActivityStore,
//     ];
//     return { success: true };
//   },

//   async listActivity(): Promise<ActivityLogEntry[]> {
//     await mockDelay();
//     return [...mockActivityStore].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
//   },

//   async setPin(pin: string): Promise<{ success: true }> {
//     await mockDelay(400);
//     if (pin.length !== 4) throw new ApiError({ message: "PIN must be 4 digits.", status: 400, code: "VALIDATION_ERROR" });
//     return { success: true };
//   },
// };

// ── Real implementation ─────────────────────────────────────────

const realVendorService = {
  async getNodeProfile(): Promise<VendorNodeProfile> {
    const raw = await httpClient.get(ENDPOINTS.nodes.operatorInventory);
    return mapInventoryResponse(raw).node;
  },

  async listParcels(): Promise<NodeParcel[]> {
    const raw = await httpClient.get(ENDPOINTS.nodes.operatorInventory);
    return mapInventoryResponse(raw).parcels;
  },

  async lookupParcelByCode(code: string): Promise<NodeParcel> {
    void code;
    // No standalone lookup endpoint — the real flow scans straight
    // into checkIn() below (scan-handoff does lookup + check-in
    // atomically). Kept only for interface parity; don't call this
    // directly in real mode.
    throw new ApiError({
      message: "Use checkIn() with the decoded QR payload directly — no separate lookup step in the real API.",
      code: "NOT_IMPLEMENTED",
    });
  },

  async checkIn(trackingCodeOrParcelId: string, position?: GeoPoint, qrNonce?: string): Promise<NodeParcel> {
    if (!position || !qrNonce) {
      throw new ApiError({
        message: "Location and QR nonce are required to check in a parcel.",
        status: 400,
        code: "VALIDATION_ERROR",
      });
    }
    const payload: ScanHandoffPayload = {
      trackingCode: trackingCodeOrParcelId,
      type: "ORIGIN_CHECK_IN",
      latitude: position.lat,
      longitude: position.lng,
      qrNonce,
    };
    return httpClient.post<NodeParcel>(ENDPOINTS.orders.scanHandoff, payload);
  },

  async listShelves(): Promise<ShelfLocation[]> {
    // No backend endpoint for shelf locations yet — see file header.
    return [];
  },

  async assignShelf(parcelId: string, shelfId: string): Promise<NodeParcel> {
    void parcelId;
    void shelfId;
    // No backend endpoint for shelf assignment yet — see file header.
    // Returning the parcel unchanged so the UI can still show a
    // (locally-only) confirmation without crashing.
    throw new ApiError({
      message: "Shelf assignment isn't supported by the backend yet — this parcel is checked in, but the shelf location won't be saved.",
      code: "NOT_IMPLEMENTED",
    });
  },

  async sendReleaseOtp(parcelId: string): Promise<{ sent: true }> {
    void parcelId;
    // No on-demand "send OTP" endpoint — the collection OTP is issued
    // to the recipient automatically (presumably via the Notifications
    // engine) once the parcel is ready for collection. This is a no-op
    // so the UI's existing "sending…" step just resolves immediately.
    return { sent: true };
  },

  async releaseParcel(parcelId: string, otpCode: string, position?: GeoPoint, qrNonce?: string): Promise<NodeParcel> {
    if (!position || !qrNonce) {
      throw new ApiError({
        message: "Location and QR nonce are required to release a parcel.",
        status: 400,
        code: "VALIDATION_ERROR",
      });
    }
    const payload: ScanCollectionPayload = {
      orderId: parcelId,
      otpCode,
      latitude: position.lat,
      longitude: position.lng,
      qrNonce,
    };
    return httpClient.post<NodeParcel>(ENDPOINTS.orders.scanCollection, payload);
  },

  async flagParcel(payload: FlagParcelPayload): Promise<{ success: true }> {
    void payload;
    throw new ApiError({
      message: "Flagging a parcel issue isn't supported by the backend yet.",
      code: "NOT_IMPLEMENTED",
    });
  },

  async listActivity(): Promise<ActivityLogEntry[]> {
    const userId = currentUserId();
    const raw = await httpClient.get<unknown[]>(ENDPOINTS.notifications.listForUser(userId));
    return raw.map(mapNotificationToActivity);
  },

  async setPin(): Promise<{ success: true }> {
    // No PIN concept in the real API — NodeOperator auth is the same
    // POST /auth/register (role: "node_operator") + POST /auth/login
    // every role shares, handled entirely by
    // authService.registerConsumer / loginConsumer instead.
    throw new ApiError({ message: "Use authService.registerConsumer / loginConsumer instead.", code: "NOT_IMPLEMENTED" });
  },

  /** Real, confirmed route — self-service Node setup, the second step of NodeOperator registration. */
  async onboardNode(payload: NodeOperatorOnboardingPayload): Promise<NodeOperatorProfile> {
    return httpClient.post<NodeOperatorProfile>(ENDPOINTS.nodeOperators.onboarding, payload);
  },

  /** Real, confirmed route — the vendor's own profile + Node, including its approval status. */
  async getMyNodeOperatorProfile(): Promise<NodeOperatorProfile> {
    return httpClient.get<NodeOperatorProfile>(ENDPOINTS.nodeOperators.me);
  },
};

export const vendorService = realVendorService;
