"use client";

import Link from "next/link";
import { Card } from "@/components/ui";
import { BriefcaseIcon, ChevronRightIcon, PackageIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { useAvailableOrders } from "@/modules/rider/hooks/use-available-orders";
import { formatDistanceMeters, parcelSizeLabel } from "@/modules/rider/lib/handoff-format";

/** How many rows Home shows — a taste, not the whole board. */
const PREVIEW_LIMIT = 3;

/**
 * A read-only preview of the job board on Home, backed by the same
 * `GET /handoffs/available-orders` query `AvailableJobsScreen` uses
 * (capped at 3, page 1 only — no pagination here). Every row and the
 * "View all" link go to `/rider/available-jobs`, which stays the only
 * place a job can actually be inspected in full or accepted — this
 * component never renders an Accept action.
 *
 * Silently renders nothing on a real fetch error (e.g. an unverified
 * rider's 403) rather than duplicating `AvailableJobsScreen`'s error/
 * verification UI — Home is a summary, not a second copy of that screen.
 */
export function AvailableJobsPreview() {
  const { items, total, isLoading, error, isSortTrustworthy } = useAvailableOrders(PREVIEW_LIMIT);

  if (error) return null;

  if (!isLoading && items.length === 0) {
    return (
      <Card padding="md" className="flex flex-col items-center text-center gap-1 py-6">
        <BriefcaseIcon size={20} className="text-text-muted" />
        <p className="text-[13px] font-semibold text-text-primary">No jobs available right now</p>
        <p className="text-[12px] text-text-muted">New ones appear as consumers drop off parcels.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[15px] font-bold text-text-primary">Jobs near you</h2>
        <Link
          href={ROUTES.riderAvailableJobs}
          className="flex items-center gap-0.5 text-[12px] font-semibold text-brand-blue"
        >
          View all
          <ChevronRightIcon size={14} />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-17.5 rounded-2xl bg-bg-subtle animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.slice(0, PREVIEW_LIMIT).map((order) => (
            <Link key={order.id} href={ROUTES.riderAvailableJobs}>
              <Card interactive padding="md" className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-[10px] bg-bg-subtle text-brand-blue flex items-center justify-center shrink-0">
                    <PackageIcon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-text-primary truncate">
                      {order.originNodeName} → {order.destinationNodeName}
                    </p>
                    <p className="text-[12px] text-text-muted truncate">
                      {parcelSizeLabel(order.parcelSize)}
                      {isSortTrustworthy && ` · ${formatDistanceMeters(order.distanceMeters)} away`}
                    </p>
                  </div>
                </div>
                <ChevronRightIcon size={16} className="text-text-muted shrink-0" />
              </Card>
            </Link>
          ))}
        </div>
      )}

      {total > PREVIEW_LIMIT && (
        <p className="text-[12px] text-text-muted text-center">
          +{total - PREVIEW_LIMIT} more waiting — view all to accept
        </p>
      )}
    </div>
  );
}
