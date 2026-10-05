"use client";

import { useMemo, useState } from "react";
import { useNodeProfile } from "./use-node-profile";
import {
  isAwaitingPickup,
  isAwaitingArrival,
  isExpectedAtOrigin,
  myNodeId,
  needsIntake,
  isReadyForCollection,
  useMyNodeOrders,
} from "./use-my-node-orders";

export type DashboardFilterTab =
  | "expected"
  | "awaiting_pickup"
  | "awaiting_arrival"
  | "ready_for_collection";

/** Matches the 60% threshold the old mock Node dashboard used for its "High Full" warning. */
const HIGH_FULL_THRESHOLD = 0.6;

/**
 * Drives the Node Dashboard (`NodeHomeScreen`) — Node identity +
 * capacity from `GET /node-operators/me/nodes` (scoped to the active
 * Node, see `use-my-nodes.ts`), on-site parcel snapshot derived from
 * `GET /handoffs/my-node/orders`.
 *
 * **Multi-Node (2026-09-02):** that orders endpoint now returns every
 * Node the caller is a member of, mixed together, so everything below
 * is filtered to the active Node first — an operator standing at one
 * counter must never see another branch's parcels in their pick-lists,
 * and a capacity bar summing two Nodes' contents against one Node's
 * capacity would be actively wrong. `myNodeId()` resolves each order's
 * Node from its own `myRole`.
 *
 * As of 2026-08-17 this also backs the three tabs that used to live on
 * the standalone Inventory screen: **Awaiting Pickup** (origin side,
 * Inventory's old "Pickup" tab), **Awaiting Arrival** (destination
 * side, rider en route — Inventory's old "Incoming" tab), and **Ready
 * for Collection** (destination side, arrived — Inventory's old
 * "Collection" tab, both its "needs check-in" and "ready" sub-groups).
 * Inventory's "History" tab moved to `ActivityScreen` instead, since
 * it's a record of everything, not a Home-page summary section.
 *
 * Neither real endpoint returns an "occupied" figure —
 * `node-operators/me/nodes` only has the self-reported max
 * (`capacity`) per Node, and
 * `my-node/orders` has no concept of a shelf/slot count. "Occupied" is
 * derived here instead, as every order currently physically sitting at
 * THIS Node, on either side of the custody chain:
 *   - origin side, not yet handed to a rider (`isAwaitingPickup`)
 *   - destination side, arrived but not checked in (`needsIntake`)
 *   - destination side, checked in, waiting on the receiver
 *     (`isReadyForCollection`)
 * A rider en route (`isAwaitingArrival`, i.e. `in_transit`) is
 * deliberately excluded from "occupied" — the parcel isn't physically
 * on the premises yet, even though it now has its own dashboard tab so
 * the operator can see it coming.
 */
export function useNodeDashboard() {
  const {
    node,
    payoutAccountConfigured,
    isOwnerOfActiveNode,
    isPubliclyVisible,
    isStaff,
    isLoading: isNodeLoading,
    notOnboarded,
    hasNoStationsYet,
    error: nodeError,
  } = useNodeProfile();
  const { orders: allOrders, isLoading: isOrdersLoading } = useMyNodeOrders();
  const [activeTab, setActiveTab] = useState<DashboardFilterTab>("awaiting_pickup");

  // Scope to the counter this member is actually standing at. Owners
  // and staff alike resolve a real active station now (see
  // `use-my-nodes.ts`), so this filter applies to both — a staff member
  // invited to two stations sees one counter at a time, exactly like an
  // owner running two.
  const orders = useMemo(() => {
    if (!node) return allOrders;
    return allOrders.filter((order) => myNodeId(order) === node.id);
  }, [allOrders, node]);

  const expected = useMemo(() => orders.filter(isExpectedAtOrigin), [orders]);
  const awaitingPickup = useMemo(() => orders.filter(isAwaitingPickup), [orders]);
  const awaitingArrival = useMemo(() => orders.filter(isAwaitingArrival), [orders]);
  const needsIntakeOrders = useMemo(() => orders.filter(needsIntake), [orders]);
  const readyForCollection = useMemo(() => orders.filter(isReadyForCollection), [orders]);

  const onSite = useMemo(
    () => [...awaitingPickup, ...needsIntakeOrders, ...readyForCollection],
    [awaitingPickup, needsIntakeOrders, readyForCollection]
  );

  const total = node?.capacity ?? 0;
  const occupied = onSite.length;
  const isHighFull = total > 0 && occupied / total >= HIGH_FULL_THRESHOLD;

  return {
    node,
    payoutAccountConfigured,
    isOwnerOfActiveNode,
    isPubliclyVisible,
    isStaff,
    isNodeActive: node?.status === "active",
    notOnboarded,
    hasNoStationsYet,
    nodeError,
    isLoading: isNodeLoading || isOrdersLoading,
    total,
    occupied,
    isHighFull,
    activeTab,
    setActiveTab,
    expected,
    awaitingPickup,
    awaitingArrival,
    needsIntakeOrders,
    readyForCollection,
  };
}
