"use client";

import { useMemo } from "react";
import { HANDOFF_STATUS } from "@/core/types";
import type { NodeOrderSummary } from "@/core/types";
import { useMyNodes } from "./use-my-nodes";
import { expandOrderRoles, myNodeId, myNodeName, useRawMyNodeOrders } from "./use-raw-node-orders";

export { myNodeId, myNodeName };

/**
 * Every order that's ever touched **any** Node the caller is a member of
 * — `GET /handoffs/my-node/orders`, real and confirmed per docs/API.md
 * (2026-08-17; widened from one Node to all of them, and opened to
 * NodeStaff, 2026-09-02). This is the server-backed replacement for
 * `store/node-outgoing.store.ts` and `store/node-parcels.store.ts` (both
 * deleted): the operator no longer needs a device-local cache to resolve
 * the order uuid `confirm-handoff`/`intake`/`collect` need, because the
 * server can now list every order their Nodes have a stake in, on either
 * side.
 *
 * The response mixes every Node together with no explicit "which of my
 * Nodes is this" field — but `myRole` plus the origin/destination ids
 * pin it down exactly (`myRole: "origin"` ⇒ it's `originNodeId`), which
 * is what `myNodeId()`/`myNodeName()` below do and what the dashboard
 * filters on, for staff exactly as for owners.
 *
 * **For a `node_staff` session this endpoint is load-bearing in a
 * second way** (2026-09-08): `GET /node-operators/me/nodes` is
 * confirmed `403` for that role on the live backend, so this is the
 * *only* place a staff session's Node id(s) appear anywhere in the
 * API. `use-my-nodes.ts` discovers a staff member's station(s) from
 * `myNodeId()`/`myNodeName()` here, then enriches each with
 * `nodeService.getNodeById()` (`GET /nodes/:id`, open to any role) to
 * get real capacity/status/visibility. A brand-new staff invite with
 * zero orders ever has no id to discover this way — there is currently
 * no endpoint that closes that gap, see `use-my-nodes.ts`'s
 * `hasNoStationsYet`.
 *
 * Consumed by `NodeHomeScreen`'s four tabs (Expected/Awaiting Pickup/
 * Awaiting Arrival/Ready for Collection — the last three moved here
 * 2026-08-17 when the standalone Inventory screen was retired, and
 * Expected added 2026-09-03 with dispatch), `HandoffDetailScreen` (one
 * order's pickup/arrival details + code entry), `CollectParcelScreen`
 * (the receiver-collection + check-in form), and `ActivityScreen`'s
 * Order History tab (the old Inventory History tab, relocated). All
 * filters below are re-derived from one query rather than separate
 * fetches, since it's the same list sliced by `myRole` + `status`.
 */
export function useMyNodeOrders() {
  const raw = useRawMyNodeOrders();
  const { nodes } = useMyNodes();

  // The server returns one row per order with a single `myRole`, so an
  // order between two of the caller's own Nodes (e.g. parent → staff
  // station) would only ever surface on one of them. Expand it here.
  const orders = useMemo(
    () => expandOrderRoles(raw.orders, new Set(nodes.map((m) => m.node.id))),
    [raw.orders, nodes]
  );

  return {
    orders,
    isLoading: raw.isLoading,
    error: raw.error,
    refetch: raw.refetch,
  };
}

/**
 * One order by id, from the same cached list — no separate fetch.
 * Powers `HandoffDetailScreen`: the Awaiting Pickup/Awaiting Arrival
 * details page is keyed on `orderId` alone, and every field it shows
 * (tracking code, status, parcel, route, `myRole`) is already present
 * on `NodeOrderSummary`. `undefined` once loaded means this Node has no
 * order with that id — a stale link, not a fetch failure.
 */
export function useNodeOrder(orderId: string) {
  const { orders, isLoading } = useMyNodeOrders();

  // An order between two of the caller's Nodes has two entries; prefer the
  // side that can actually be acted on right now.
  const matches = orders.filter((o) => o.id === orderId);
  const order = matches.find((o) => isAwaitingPickup(o) || isAwaitingArrival(o)) ?? matches[0];

  return { order, isLoading };
}

/**
 * Origin side, paid for but not yet physically received at the counter
 * — the "expected" pick-list (2026-09-03).
 *
 * Two things land here: a Consumer's order they haven't brought in
 * yet, and — the reason this filter now exists — a parcel the station
 * dispatched itself via `POST /node-operators/nodes/:nodeId/dispatch`,
 * which starts at `awaiting_drop_off` exactly like a Consumer's does.
 * Without this the operator had no way to find their own just-paid
 * dispatch and confirm the drop-off that releases it to riders.
 *
 * Deliberately **not** counted as "occupied" in the capacity bar: the
 * parcel isn't on the shelf until `POST .../drop-off` says it is.
 */
export function isExpectedAtOrigin(order: Pick<NodeOrderSummary, "myRole" | "status">): boolean {
  return order.myRole === "origin" && order.status === HANDOFF_STATUS.awaitingDropOff;
}

/** Origin side, not yet handed to a rider — the pickup pick-list. */
export function isAwaitingPickup(order: Pick<NodeOrderSummary, "myRole" | "status">): boolean {
  return (
    order.myRole === "origin" &&
    (order.status === HANDOFF_STATUS.parcelReceivedAtOrigin ||
      order.status === HANDOFF_STATUS.riderAssigned)
  );
}

/** Destination side, rider en route but not yet confirmed arrived — the arrival pick-list. */
export function isAwaitingArrival(order: Pick<NodeOrderSummary, "myRole" | "status">): boolean {
  return order.myRole === "destination" && order.status === HANDOFF_STATUS.inTransit;
}

/** Destination side, arrived but the receiver hasn't been emailed a collection code yet. */
export function needsIntake(order: Pick<NodeOrderSummary, "myRole" | "status">): boolean {
  return order.myRole === "destination" && order.status === HANDOFF_STATUS.arrivedAtDestination;
}

/** Destination side, checked in and waiting on the receiver. */
export function isReadyForCollection(order: Pick<NodeOrderSummary, "myRole" | "status">): boolean {
  return order.myRole === "destination" && order.status === HANDOFF_STATUS.readyForCollection;
}
