/**
 * Handoffs module — the real, documented custody-chain contract
 * (`/handoffs/*`, added to docs/API.md 2026-08-14, extended 2026-08-17
 * with `GET /handoffs/my-orders` and `GET /handoffs/my-node/orders`).
 *
 * Two structural things worth internalizing before touching the
 * screens:
 *
 * 1. **Nobody scans a rider.** Custody transfer is a 6-digit code the
 *    rider requests and reads/shows to the Node operator, who types it
 *    into `POST /handoffs/orders/:id/confirm-handoff`. There is no
 *    `qrNonce` anywhere in this contract — `decodeQrPayload()` in
 *    delivery.types.ts is not part of it. **The code carries no order
 *    identity** — it isn't logged or emailed, and `confirm-handoff`
 *    still needs the order's uuid in its path. As of 2026-08-17 that
 *    uuid comes from a real, server-backed list rather than a
 *    device-local cache: `GET /handoffs/my-node/orders` for the Node
 *    operator (`NodeOrderSummary`, below) and `GET /handoffs/my-orders`
 *    for the rider (`MyOrderSummary`, below). Never build a screen that
 *    asks the rider for a tracking code.
 * 2. **No GPS is required or accepted** on any handoff write. The only
 *    endpoint that takes coordinates is `GET /handoffs/available-orders`,
 *    and only to sort that one response — nothing is stored.
 *
 * Order status transitions driven by this module:
 *   awaiting_drop_off
 *     → (origin operator: drop-off)      parcel_received_at_origin
 *     → (rider: accept)                  rider_assigned
 *     → (origin operator: rider_pickup)  in_transit
 *     → (dest. operator: rider_arrival)  arrived_at_destination
 *     → (dest. operator: intake)         ready_for_collection
 *     → (dest. operator: collect)        completed
 *
 * The two codes in this module run in opposite directions, which is the
 * easiest thing to get backwards:
 *   - **Rider codes** (`request-code`) are shown only to the rider and
 *     read aloud to the operator. Never emailed. 5-minute TTL.
 *   - **Collection codes** (minted by `intake`) are emailed only to the
 *     receiver and read aloud to the operator. The operator never sees
 *     one in any API response, not even from `resend`. 1-hour TTL.
 */

import type { OrderParcelSize, OrderStatus } from "./payment.types";

/**
 * The two handoff moments this module covers. `rider_pickup` is the
 * origin Node handing the parcel to the rider; `rider_arrival` is the
 * rider handing it to the destination Node. Nothing else is accepted
 * by `request-code`/`confirm-handoff` — deliberately narrower than
 * delivery.types.ts's legacy 4-member `ScanHandoffType`, which covered
 * consumer drop-off and receiver collection too (those are separate
 * endpoints here, and receiver collection isn't in this module at all).
 */
export type HandoffType = "rider_pickup" | "rider_arrival";

/**
 * The order statuses this module reads or produces. `OrderStatus` stays
 * a bare `string` (see payment.types.ts) so unrecognized server values
 * still render; this union is for narrowing/comparison at call sites
 * that genuinely know the lifecycle, not for typing API responses.
 */
export const HANDOFF_STATUS = {
  awaitingDropOff: "awaiting_drop_off",
  parcelReceivedAtOrigin: "parcel_received_at_origin",
  riderAssigned: "rider_assigned",
  inTransit: "in_transit",
  arrivedAtDestination: "arrived_at_destination",
  readyForCollection: "ready_for_collection",
  completed: "completed",
} as const;

export type HandoffStatus = (typeof HANDOFF_STATUS)[keyof typeof HANDOFF_STATUS];

/**
 * One item from `GET /handoffs/available-orders`. Deliberately NOT the
 * `Order` shape from payment.types.ts: no receiver name/email/phone
 * (deciding whether to take a job doesn't need receiver PII), no
 * `amountKobo`/`paymentIntentId`/`status`, and it adds `distanceMeters`
 * — the server-computed distance from the coordinates the rider sent.
 */
export interface AvailableOrder {
  id: string;
  trackingCode: string;
  originNodeId: string;
  originNodeName: string;
  originNodeAddress: string;
  destinationNodeId: string;
  destinationNodeName: string;
  destinationNodeAddress: string;
  parcelDescription: string;
  parcelSize: OrderParcelSize;
  createdAt: string;
  /** Origin Node → the rider's supplied coordinates, in metres. Used for this response's sort only; nothing about the rider's location is stored. */
  distanceMeters: number;
}

export interface ListAvailableOrdersParams {
  latitude: number;
  longitude: number;
  page?: number;
  limit?: number;
}

/**
 * Shared response shape of `accept`, `drop-off`, and `confirm-handoff`
 * — a minimal receipt confirming the new status, not a full order. The
 * screens keep the richer record they already had (`AvailableOrder` /
 * `HandoffOrderPreview` / `NodeOrderSummary`) and merge this status onto
 * it.
 */
export interface HandoffOrderSummary {
  id: string;
  trackingCode: string;
  status: OrderStatus;
  originNodeId: string;
  destinationNodeId: string;
}

/**
 * `GET /handoffs/orders/by-tracking-code/:code` — the operator's
 * pre-drop-off preview. Scoped to orders whose `originNodeId` is the
 * caller's own Node; anything else is `404 NOT_FOUND` rather than 403,
 * so a 404 here means "not yours or not real," never "wrong role."
 * No receiver PII — that only matters at the destination Node, at
 * collection.
 */
export interface HandoffOrderPreview {
  id: string;
  trackingCode: string;
  status: OrderStatus;
  originNodeId: string;
  destinationNodeId: string;
  destinationNodeName: string;
  parcelDescription: string;
  parcelSize: OrderParcelSize;
  createdAt: string;
}

/** Which side of an order a Node played, per `GET /handoffs/my-node/orders`'s `myRole` field. */
export type NodeOrderRole = "origin" | "destination";

/**
 * One item from `GET /handoffs/my-node/orders` — real, confirmed per
 * docs/API.md (2026-08-17). Every order that has ever touched the
 * caller's Node, either as origin or destination, current and past,
 * newest first. `myRole` tells you which side this particular order was
 * played on (a Node is an origin for some orders and a destination for
 * others).
 *
 * This is what resolves the order **uuid** `confirm-handoff` needs,
 * for both `rider_pickup` (filter `myRole === "origin"`) and
 * `rider_arrival` (filter `myRole === "destination"`) — closing the gap
 * `store/node-outgoing.store.ts` and `store/node-parcels.store.ts` used
 * to paper over with device-local caches. Delete-on-sight if you find
 * either of those two files again; they're superseded by
 * `modules/node/hooks/use-my-node-orders.ts`.
 */
export interface NodeOrderSummary {
  id: string;
  trackingCode: string;
  status: OrderStatus;
  originNodeId: string;
  originNodeName: string;
  destinationNodeId: string;
  destinationNodeName: string;
  parcelDescription: string;
  parcelSize: OrderParcelSize;
  createdAt: string;
  myRole: NodeOrderRole;
}

export interface RequestHandoffCodePayload {
  type: HandoffType;
}

/**
 * `POST /handoffs/orders/:id/request-code` response. Expires 5 minutes
 * after issue, so it's requested at the counter, not in advance —
 * requesting again supersedes any prior unused code for the same
 * `(order, type)`. Never persist or transmit `code` anywhere: it isn't
 * logged or emailed server-side, and the whole point is that it only
 * exists between the rider's screen and the operator's ears.
 */
export interface HandoffCode {
  code: string;
  expiresAt: string;
}

export interface ConfirmHandoffPayload {
  type: HandoffType;
  code: string;
}

/**
 * One item from `GET /handoffs/my-orders` — real, confirmed per
 * docs/API.md (2026-08-17). Every order this rider has ever been
 * assigned, current and past, newest first. Closes the gap
 * `store/rider-jobs.store.ts` used to paper over with a device-local
 * cache — see `modules/rider/hooks/use-my-orders.ts`, which supersedes
 * it. No receiver details, same reasoning as `AvailableOrder`.
 */
export interface MyOrderSummary {
  id: string;
  trackingCode: string;
  status: OrderStatus;
  originNodeId: string;
  originNodeName: string;
  originNodeAddress: string;
  destinationNodeId: string;
  destinationNodeName: string;
  destinationNodeAddress: string;
  parcelDescription: string;
  parcelSize: OrderParcelSize;
  createdAt: string;
}

/**
 * `POST /handoffs/orders/:id/collection-code/resend` response.
 *
 * Note what is *not* here: the code. It only ever reaches the receiver's
 * email — never the operator's session, never any API response. The
 * operator learns it by the receiver reading it to them at the counter.
 * All this response can tell the UI is when the new one dies.
 */
export interface CollectionCodeResendResult {
  expiresAt: string;
}

export interface CollectParcelPayload {
  code: string;
  /**
   * The operator's attestation that they asked for and matched the
   * receiver's name. Recorded on the order's permanent event log but,
   * per docs/API.md, it does **not** block completion when `false` —
   * proxy pickup (someone collecting on the named receiver's behalf) is
   * common and legitimate in this business. Treat it as an audit trail
   * of what the operator actually did, never as a gate: defaulting it
   * to `true` or hiding it behind a required checkbox would corrupt the
   * one thing it's for.
   */
  identityConfirmed: boolean;
}

/** Collection codes live an hour, per docs/API.md — twelve times the rider codes' 5 minutes, since the receiver has to read an email and travel. */
export const COLLECTION_CODE_TTL_SECONDS = 60 * 60;

/** Backend cap on concurrent active deliveries per rider — a 4th accept returns `409 RIDER_CAPACITY_UNAVAILABLE`. */
export const RIDER_MAX_CONCURRENT_DELIVERIES = 3;

/** Handoff codes expire 5 minutes after issue, per docs/API.md. */
export const HANDOFF_CODE_TTL_SECONDS = 5 * 60;

/** Digits in a handoff code — drives the OTP input length on both sides. */
export const HANDOFF_CODE_LENGTH = 6;
