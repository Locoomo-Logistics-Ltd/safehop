"use client";

import Link from "next/link";
import { Card, RouteRail } from "@/components/ui";
import { PackageIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { getOrderProgress, OrderStatusBadge } from "@/modules/user/components/tracking/OrderStatusBadge";
import type { Order } from "@/core/types";

interface DeliveryCardProps {
  delivery: Order;
}

/** One order row — used in both "Active Deliveries" and "Past Deliveries" lists. */
export function DeliveryCard({ delivery }: DeliveryCardProps) {
  const progress = getOrderProgress(delivery.status);

  return (
    <Link href={ROUTES.track(delivery.id)}>
      <Card interactive padding="md" className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
              <PackageIcon size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-text-primary font-mono tracking-tight truncate">
                {delivery.trackingCode}
              </p>
              <p className="text-[12px] text-text-muted truncate">
                {delivery.destinationNodeName}
              </p>
            </div>
          </div>
          <OrderStatusBadge status={delivery.status} />
        </div>

        <RouteRail
          originLabel={delivery.originNodeName}
          destinationLabel={delivery.destinationNodeName}
          progress={progress}
        />

        <div className="flex items-center justify-between text-[11px] text-text-muted">
          <span>{delivery.originNodeName}</span>
          <span>{delivery.destinationNodeName}</span>
        </div>
      </Card>
    </Link>
  );
}
