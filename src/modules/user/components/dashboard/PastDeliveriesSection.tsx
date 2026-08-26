"use client";

import Link from "next/link";
import { Card } from "@/components/ui";
import { PackageIcon, ChevronRightIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { formatRelativeDateTime } from "@/lib/format";
import { useDeliveries } from "@/modules/user/hooks/use-deliveries";
import { OrderStatusBadge } from "@/modules/user/components/tracking/OrderStatusBadge";

const MAX_VISIBLE = 4;

/**
 * "Past Deliveries" — capped at `MAX_VISIBLE` compact cards (kept
 * deliberately smaller than `DeliveryCard`'s full route-progress
 * layout, since a completed order's progress bar is always just "done"
 * and not worth the space) so this section never grows unbounded on
 * the dashboard, with a "View All" link — same affordance
 * `ActiveDeliveriesSection` already has — once there's more to see
 * than fits. Previously had no such link at all: past deliveries
 * beyond the first `MAX_VISIBLE` were simply unreachable from here.
 */
export function PastDeliveriesSection() {
  const { past, isLoading } = useDeliveries();

  if (isLoading || past.length === 0) return null;

  return (
    <section className="px-4 md:px-6 mt-7 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-[16px] text-text-primary">Past Deliveries</h2>
        {past.length > MAX_VISIBLE && (
          <Link
            href={ROUTES.trackList}
            className="flex items-center gap-0.5 text-[13px] font-medium text-brand-blue"
          >
            View All
            <ChevronRightIcon size={15} />
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {past.slice(0, MAX_VISIBLE).map((delivery, i) => (
          <Link
            key={delivery.id}
            href={ROUTES.track(delivery.id)}
            className="block animate-locoomo-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <Card interactive padding="sm" className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-[10px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0">
                <PackageIcon size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-text-primary font-mono tracking-tight truncate">
                  {delivery.trackingCode}
                </p>
                <p className="text-[12px] text-text-muted truncate">
                  {delivery.destinationNodeName} · {formatRelativeDateTime(delivery.createdAt)}
                </p>
              </div>
              <OrderStatusBadge status={delivery.status} className="shrink-0" />
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
