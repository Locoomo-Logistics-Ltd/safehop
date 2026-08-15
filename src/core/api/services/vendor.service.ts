
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
  CollectParcelPayload,
  CollectionCodeResendResult,
  ConfirmHandoffPayload,
  FlagParcelPayload,
  HandoffOrderPreview,
  HandoffOrderSummary,
  NodeOperatorOnboardingPayload,
  NodeOperatorProfile,
  NodeParcel,
  VendorNodeProfile,
} from "@/core/types";

/**
 * Vendor service — the business-logic surface for the Shop Owner role.
 *
 * REAL API GAPS — two UI features here have NO backend endpoint yet:
 *   - Flagging a parcel issue (flagParcel) — no endpoint exists.
 *     Throws a clear "not supported yet" error rather than silently
 *     pretending to succeed.
 *   - A dedicated Activity Log — no endpoint exists. `listActivity()`
 *     maps to GET /notifications/user/{userId} as the closest real
 *     equivalent (adjust the mapping in `mapNotificationToActivity()`
 *     below once you've seen a real notification payload).
 *
 * (Shelf assignment was a third until 2026-08-15, when it and its
 * screen were removed — it never had a route in docs/API.md.)
 *
 * The whole parcel custody chain now runs through the `handoffs`
 * methods at the bottom of this file — consumer drop-off, rider
 * pickup/arrival, and receiver collection. `/nodes/operator/inventory`
 * (still undocumented) remains the Node Dashboard's parcel list only.
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

  // lookupParcelByCode / checkIn / listShelves / assignShelf /
  // sendReleaseOtp / releaseParcel were removed 2026-08-15.
  //
  // `checkIn` and `releaseParcel` called the undocumented
  // `orders.scanHandoff` / `orders.scanCollection` and are superseded by
  // the handoffs methods below — `lookupOrderByTrackingCode` +
  // `confirmDropOff` for consumer drop-off, `confirmIntake` + `collect`
  // for receiver collection. Neither documented route takes the qrNonce
  // or GPS these two assumed.
  //
  // The other four never reached a backend at all: `lookupParcelByCode`
  // and `assignShelf` threw NOT_IMPLEMENTED, `listShelves` returned [],
  // and `sendReleaseOtp` was a no-op that resolved immediately. Shelf
  // assignment has no endpoint in docs/API.md and its screen went with
  // them; if it comes back, it needs a real route first.

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

  // ── Handoffs: the Node operator's side ──────────────────────────
  // Real, confirmed routes per docs/API.md (2026-08-14). These
  // supersede checkIn() above, which targets the undocumented
  // `orders.scanHandoff`. Every one is ownership-scoped to the
  // operator's own Node and answers `404 NOT_FOUND` — not `403` — when
  // it isn't, so a 404 here never means "wrong role."

  /**
   * Previews a consumer's parcel from a scanned/typed tracking code,
   * before confirming receipt. Scoped to orders whose `originNodeId` is
   * this operator's Node.
   *
   * Unlike the old `checkIn()`, this does NOT change any state — it's a
   * read. Confirming receipt is the separate `confirmDropOff()` below,
   * which is what lets the operator eyeball the parcel against the
   * description first.
   */
  async lookupOrderByTrackingCode(trackingCode: string): Promise<HandoffOrderPreview> {
    return httpClient.get<HandoffOrderPreview>(
      ENDPOINTS.handoffs.byTrackingCode(trackingCode)
    );
  },

  /**
   * Confirms the consumer physically handed the parcel over —
   * `awaiting_drop_off → parcel_received_at_origin`, which is what puts
   * the order on the rider job board.
   *
   * Idempotent: a second call for the same order returns the same
   * success, so a double-tap or a retry after a flaky connection is
   * safe. `409 ILLEGAL_ORDER_TRANSITION` means the order was never at
   * `awaiting_drop_off` to begin with.
   */
  async confirmDropOff(orderId: string): Promise<HandoffOrderSummary> {
    return httpClient.post<HandoffOrderSummary>(ENDPOINTS.handoffs.dropOff(orderId));
  },

  /**
   * Confirms a rider handoff from the 6-digit code the rider states.
   * `rider_pickup` must come from the *origin* Node's operator and
   * moves the order to `in_transit`; `rider_arrival` must come from the
   * *destination* Node's operator and moves it to
   * `arrived_at_destination`. Calling from the wrong side is
   * `404 NOT_FOUND`.
   *
   * Idempotent on a retried confirm with an already-used code. Wrong
   * codes are `401 INVALID_HANDOFF_CODE` — identical for wrong,
   * expired, used, and locked-out, by design. Five wrong guesses lock
   * that code out permanently (the rider requests a new one; they
   * aren't blocked), and the route is separately rate-limited at
   * 10/min → `429 RATE_LIMITED`.
   */
  async confirmRiderHandoff(
    orderId: string,
    payload: ConfirmHandoffPayload
  ): Promise<HandoffOrderSummary> {
    return httpClient.post<HandoffOrderSummary>(
      ENDPOINTS.handoffs.confirmHandoff(orderId),
      payload
    );
  },

  // ── Handoffs: the destination Node's collection flow ────────────
  // Real, confirmed routes per docs/API.md (2026-08-15). All three are
  // scoped to the *destination* Node and supersede `releaseParcel()`
  // above, which targets the undocumented `orders.scanCollection` and
  // assumes a `qrNonce` + GPS that this contract has no concept of.

  /**
   * Destination-side equivalent of drop-off: confirms the parcel is
   * physically on the operator's counter, `arrived_at_destination →
   * ready_for_collection`. In the same step the server mints a 6-digit
   * collection code and **emails it to the receiver** — the operator
   * never sees it, which is why there's no code in this response.
   *
   * Idempotent, so a double-tap is safe. `409
   * ILLEGAL_ORDER_TRANSITION` means the rider handoff
   * (`confirm-handoff`, `rider_arrival`) hasn't happened yet.
   */
  async confirmIntake(orderId: string): Promise<HandoffOrderSummary> {
    return httpClient.post<HandoffOrderSummary>(ENDPOINTS.handoffs.intake(orderId));
  },

  /**
   * Re-mints and re-emails the receiver's collection code, superseding
   * any prior one — for when the receiver is at the counter saying they
   * never got the email, or their code aged out of its 1-hour TTL.
   *
   * Rate-limited at 5/min because each call sends real email, so don't
   * wire this to anything automatic. Returns only `expiresAt`; the code
   * itself never enters an API response. `409
   * ORDER_NOT_READY_FOR_COLLECTION` means intake hasn't run (nothing to
   * resend) or the order is already collected.
   */
  async resendCollectionCode(orderId: string): Promise<CollectionCodeResendResult> {
    return httpClient.post<CollectionCodeResendResult>(
      ENDPOINTS.handoffs.collectionCodeResend(orderId)
    );
  },

  /**
   * Final step: the receiver reads the emailed code to the operator,
   * `ready_for_collection → completed`.
   *
   * `identityConfirmed` is an attestation, not a gate — per
   * docs/API.md it's recorded on the order's event log but a `false`
   * still completes the collection, because proxy pickup is normal.
   * Pass through whatever the operator actually answered.
   *
   * Idempotent on a retried call with an already-used code. Wrong codes
   * are `401 INVALID_HANDOFF_CODE` — identical for wrong, expired,
   * used, and locked-out, same as the rider codes. Five wrong guesses
   * lock that code out permanently; `resendCollectionCode` recovers it.
   */
  async collectParcel(
    orderId: string,
    payload: CollectParcelPayload
  ): Promise<HandoffOrderSummary> {
    return httpClient.post<HandoffOrderSummary>(
      ENDPOINTS.handoffs.collect(orderId),
      payload
    );
  },
};

export const vendorService = realVendorService;
