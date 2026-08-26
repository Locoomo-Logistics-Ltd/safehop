"use client";

import { useMemo, useState } from "react";
import { useNodeProfile } from "./use-node-profile";
import {
  isAwaitingPickup,
  isAwaitingArrival,
  needsIntake,
  isReadyForCollection,
  useMyNodeOrders,
} from "./use-my-node-orders";

export type DashboardFilterTab = "awaiting_pickup" | "awaiting_arrival" | "ready_for_collection";

/** Matches the 60% threshold the old mock Node dashboard used for its "High Full" warning. */
const HIGH_FULL_THRESHOLD = 0.6;

/**
 * Drives the Node Dashboard (`NodeHomeScreen`) — Node identity +
 * capacity from `GET /node-operators/me`, on-site parcel snapshot
 * derived from `GET /handoffs/my-node/orders`.
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
 * `node-operators/me` only has the self-reported max (`capacity`), and
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
    isLoading: isNodeLoading,
    notOnboarded,
    error: nodeError,
  } = useNodeProfile();
  const { orders, isLoading: isOrdersLoading } = useMyNodeOrders();
  const [activeTab, setActiveTab] = useState<DashboardFilterTab>("awaiting_pickup");

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
    isNodeActive: node?.status === "active",
    notOnboarded,
    nodeError,
    isLoading: isNodeLoading || isOrdersLoading,
    total,
    occupied,
    isHighFull,
    activeTab,
    setActiveTab,
    awaitingPickup,
    awaitingArrival,
    needsIntakeOrders,
    readyForCollection,
  };
}
