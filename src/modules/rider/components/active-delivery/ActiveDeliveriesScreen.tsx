"use client";

import { useMemo, useRef, useState, type TouchEvent } from "react";
import Link from "next/link";
import { Button, Card, EmptyState, HandoffStatusPill } from "@/components/ui";
import { RootTopBar } from "@/components/layout";
import {
  TruckIcon,
  PackageIcon,
  NavigationIcon,
  ChevronRightIcon,
} from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import {
  isActiveDelivery,
  isAwaitingCollection,
  isCompletedDelivery,
  nextHandoffType,
  useMyOrders,
} from "@/modules/rider/hooks/use-my-orders";
import {
  HANDOFF_LEG_COPY,
  buildNavigationUrl,
  isAppleDevice,
  parcelSizeLabel,
} from "@/modules/rider/lib/handoff-format";
import type { MyOrderSummary } from "@/core/types";
import {
  ActivityFilterTabs,
  ACTIVITY_FILTER_ORDER,
  type ActivityFilter,
} from "./ActivityFilterTabs";

/** How far (in px) a horizontal touch drag has to travel before it counts as a tab swipe rather than an accidental wobble. */
const SWIPE_THRESHOLD_PX = 50;

/**
 * Rider's Activity screen — every order they've ever taken, not just
 * what's presently on their plate. Reuses `GET /handoffs/my-orders`
 * (`useMyOrders`) — the same real, confirmed route the old "Carrying
 * now" version of this screen already used — just no longer filters it
 * down to only `rider_assigned`/`in_transit` before rendering.
 *
 * Four tabs, tap or swipe between them (`ActivityFilterTabs` +
 * `ACTIVITY_FILTER_ORDER`): **All** (everything), **In Transit** (the
 * original screen's whole content — still owes this rider a handoff
 * code), **Awaiting Collection** (handed off to the destination Node,
 * out of the rider's hands, waiting on the receiver), **Completed**
 * (settled). Default tab stays "In Transit" — the one view that needs
 * an action, same as this screen's behavior before this change; the
 * other three are purely informational additions.
 */
export function ActiveDeliveriesScreen() {
  const { orders, isLoading } = useMyOrders();
  const [filter, setFilter] = useState<ActivityFilter>("in_transit");
  const touchStartX = useRef<number | null>(null);

  const inTransit = useMemo(() => orders.filter(isActiveDelivery), [orders]);
  const awaitingCollection = useMemo(() => orders.filter(isAwaitingCollection), [orders]);
  const completed = useMemo(() => orders.filter(isCompletedDelivery), [orders]);

  const counts: Record<ActivityFilter, number> = {
    all: orders.length,
    in_transit: inTransit.length,
    awaiting_collection: awaitingCollection.length,
    completed: completed.length,
  };

  const visibleOrders = useMemo(() => {
    switch (filter) {
      case "in_transit":
        return inTransit;
      case "awaiting_collection":
        return awaitingCollection;
      case "completed":
        return completed;
      case "all":
      default:
        return orders;
    }
  }, [filter, orders, inTransit, awaitingCollection, completed]);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;

    const currentIndex = ACTIVITY_FILTER_ORDER.indexOf(filter);
    if (deltaX < 0 && currentIndex < ACTIVITY_FILTER_ORDER.length - 1) {
      setFilter(ACTIVITY_FILTER_ORDER[currentIndex + 1]); // swiped left → next tab
    } else if (deltaX > 0 && currentIndex > 0) {
      setFilter(ACTIVITY_FILTER_ORDER[currentIndex - 1]); // swiped right → previous tab
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-canvas">
      <RootTopBar profileHref={ROUTES.riderProfile} />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[480px] mx-auto flex flex-col gap-4">
        <div>
          <h1 className="font-display text-[18px] font-bold text-text-primary">Activity</h1>
          <p className="text-[12px] text-text-muted">
            Every order you&apos;ve taken — in transit, awaiting collection, or completed.
          </p>
        </div>

        <ActivityFilterTabs active={filter} onChange={setFilter} counts={counts} />

        <div
          className="flex flex-col gap-3"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {visibleOrders.length === 0 ? (
            <EmptyState
              icon={<TruckIcon size={24} />}
              title={EMPTY_COPY[filter].title}
              description={EMPTY_COPY[filter].description}
              action={
                filter === "in_transit" || filter === "all" ? (
                  <Link href={ROUTES.riderAvailableJobs}>
                    <Button size="md">Browse available jobs</Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            visibleOrders.map((order) => <OrderActivityRow key={order.id} order={order} />)
          )}
        </div>
      </div>
    </div>
  );
}

const EMPTY_COPY: Record<ActivityFilter, { title: string; description: string }> = {
  all: {
    title: "No orders yet",
    description: "Every order you take will show up here, however far along it is.",
  },
  in_transit: {
    title: "No active deliveries",
    description:
      "Take a job from the board and it'll show up here with the code you need at each node.",
  },
  awaiting_collection: {
    title: "Nothing awaiting collection",
    description:
      "Parcels you've handed off to a destination Node, still waiting on the receiver, will show up here.",
  },
  completed: {
    title: "No completed deliveries yet",
    description: "Deliveries you've carried all the way through to collection will show up here.",
  },
};

/**
 * One order, any status. Still-actionable legs (`rider_assigned`/
 * `in_transit`) get the "Get handoff code" + navigate controls the old
 * `ActiveDeliveryRow` had; everything else (awaiting collection,
 * completed) is read-only — there's nothing left for this rider to do,
 * just a record of it.
 */
function OrderActivityRow({ order }: { order: MyOrderSummary }) {
  const needsAction = isActiveDelivery(order);
  const handoffType = needsAction ? nextHandoffType(order) : null;
  const leg = handoffType ? HANDOFF_LEG_COPY[handoffType] : null;

  const nextNodeName =
    handoffType === "rider_pickup" ? order.originNodeName : order.destinationNodeName;
  const nextNodeAddress =
    handoffType === "rider_pickup" ? order.originNodeAddress : order.destinationNodeAddress;

  const handleNavigate = () => {
    window.open(buildNavigationUrl(nextNodeAddress, isAppleDevice()), "_blank");
  };

  return (
    <Card padding="md" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-0.5">
            Tracking code
          </p>
          <p className="text-[15px] font-bold text-text-primary font-mono truncate">
            {order.trackingCode}
          </p>
        </div>
        <HandoffStatusPill status={order.status} className="shrink-0" />
      </div>

      <div className="flex items-start gap-2.5">
        <span className="w-8 h-8 rounded-[9px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0 mt-0.5">
          <PackageIcon size={14} />
        </span>
        <div className="min-w-0 flex-1">
          {needsAction && leg ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-0.5">
                {leg.nodeLabel}
              </p>
              <p className="text-[13px] font-semibold text-text-primary truncate">
                {nextNodeName}
              </p>
              <p className="text-[12px] text-text-muted truncate">{nextNodeAddress}</p>
            </>
          ) : (
            <p className="text-[13px] font-semibold text-text-primary truncate">
              {order.originNodeName} → {order.destinationNodeName}
            </p>
          )}
          <p className="text-[11px] text-text-muted mt-1">
            {order.parcelDescription} · {parcelSizeLabel(order.parcelSize)}
          </p>
        </div>
      </div>

      {needsAction && (
        <div className="flex items-center gap-2">
          <Link href={ROUTES.riderHandoff(order.id)} className="flex-1">
            <Button fullWidth size="md" rightIcon={<ChevronRightIcon size={15} />}>
              Get handoff code
            </Button>
          </Link>

          <Button
            variant="outline"
            size="md"
            onClick={handleNavigate}
            aria-label={`Navigate to ${nextNodeName}`}
          >
            <NavigationIcon size={16} />
          </Button>
        </div>
      )}
    </Card>
  );
}
