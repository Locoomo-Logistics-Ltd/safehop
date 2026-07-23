"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { ROUTES } from "@/core/config/constants";
import { formatDate } from "@/lib/format";
import { useDeliveries } from "@/modules/user/hooks/use-deliveries";

const MAX_VISIBLE = 4;

/** "Past Deliveries" — compact rows (not full cards) matching the Figma dashboard. */
export function PastDeliveriesSection() {
  const { past, isLoading } = useDeliveries();

  if (isLoading || past.length === 0) return null;

  return (
    <section className="px-4 md:px-6 mt-7 mb-6">
      <h2 className="font-display font-bold text-[16px] text-text-primary mb-3">
        Past Deliveries
      </h2>

      <div className="flex flex-col">
        {past.slice(0, MAX_VISIBLE).map((delivery) => (
          <Link
            key={delivery.id}
            href={ROUTES.track(delivery.id)}
            className="flex items-center justify-between gap-3 py-3 border-b border-border-default last:border-b-0"
          >
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-text-primary font-mono tracking-tight">
                {delivery.trackingCode}
              </p>
              <p className="text-[12px] text-text-muted mt-0.5">
                {delivery.status === "completed" ? "Completed" : "Cancelled"} ·{" "}
                {formatDate(delivery.updatedAt)}
              </p>
            </div>
            <StatusBadge status={delivery.status} />
          </Link>
        ))}
      </div>
    </section>
  );
}
