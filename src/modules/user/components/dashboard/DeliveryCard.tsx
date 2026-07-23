"use client";

import Link from "next/link";
import { Card, StatusBadge, RouteRail } from "@/components/ui";
import { PackageIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { getDeliveryProgress } from "@/modules/user/hooks/use-deliveries";
import type { Delivery } from "@/core/types";

interface DeliveryCardProps {
  delivery: Delivery;
}

/** One delivery row — used in both "Active Deliveries" and "Past Deliveries" lists. */
export function DeliveryCard({ delivery }: DeliveryCardProps) {
  const progress = getDeliveryProgress(delivery.status);

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
                {delivery.route.destinationLabel}
              </p>
            </div>
          </div>
          <StatusBadge status={delivery.status} />
        </div>

        <RouteRail
          originLabel={delivery.route.originLabel}
          destinationLabel={delivery.route.destinationLabel}
          progress={progress}
        />

        <div className="flex items-center justify-between text-[11px] text-text-muted">
          <span>{delivery.route.originLabel}</span>
          <span>{delivery.route.destinationLabel}</span>
        </div>
      </Card>
    </Link>
  );
}
