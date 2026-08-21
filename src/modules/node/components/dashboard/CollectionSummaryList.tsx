"use client";

import Link from "next/link";
import { Card, EmptyState } from "@/components/ui";
import { ArchiveIcon, PackageIcon, ChevronRightIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import type { NodeOrderSummary } from "@/core/types";
import { HandoffStatusPill } from "@/modules/node/components/handoff/HandoffStatusPill";

interface CollectionSummaryListProps {
  needsIntakeOrders: NodeOrderSummary[];
  readyOrders: NodeOrderSummary[];
}

/**
 * Home's Ready for Collection tab — the two sub-states the old
 * Inventory Collection tab (`CollectionList`, deleted) grouped
 * separately, kept as separate sections here for the same reason: two
 * different things are owed (a check-in vs. a receiver reading out a
 * code). Home is a summary, so unlike the old `CollectionList` neither
 * section has an inline action — every row navigates to
 * `CollectParcelScreen` (`ROUTES.nodeCollect`), which now branches on
 * the same two sub-states to show the right one: the check-in/"Send"
 * action for "needs check-in", or the existing code + identity
 * attestation flow for "ready".
 */
export function CollectionSummaryList({ needsIntakeOrders, readyOrders }: CollectionSummaryListProps) {
  if (needsIntakeOrders.length === 0 && readyOrders.length === 0) {
    return (
      <EmptyState
        icon={<ArchiveIcon size={24} />}
        title="Nothing waiting"
        description="Parcels a rider hands you will show up here until the receiver collects them."
      />
    );
  }

  return (
    <div className="flex flex-col gap-7">
      {needsIntakeOrders.length > 0 && (
        <section>
          <h2 className="font-semibold text-[14px] text-text-primary mb-1">Needs check-in</h2>
          <p className="text-[12px] text-text-muted mb-3">
            The receiver hasn&apos;t been told these have arrived yet.
          </p>
          <div className="flex flex-col gap-3">
            {needsIntakeOrders.map((order) => (
              <CollectionRow key={order.id} order={order} accentClassName="border-l-status-warning" />
            ))}
          </div>
        </section>
      )}

      {readyOrders.length > 0 && (
        <section>
          <h2 className="font-semibold text-[14px] text-text-primary mb-1">Ready for collection</h2>
          <p className="text-[12px] text-text-muted mb-3">
            The receiver has been emailed a code.
          </p>
          <div className="flex flex-col gap-3">
            {readyOrders.map((order) => (
              <CollectionRow key={order.id} order={order} accentClassName="border-l-status-success" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CollectionRow({ order, accentClassName }: { order: NodeOrderSummary; accentClassName: string }) {
  return (
    <Link href={ROUTES.nodeCollect(order.id)}>
      <Card
        padding="md"
        className={`border-l-[3px] ${accentClassName} flex items-center justify-between gap-3`}
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
            <PackageIcon size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-text-primary font-mono truncate">
              {order.trackingCode}
            </p>
            <p className="text-[12px] text-text-muted mt-0.5 truncate">{order.parcelDescription}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <HandoffStatusPill status={order.status} />
          <ChevronRightIcon size={16} className="text-text-muted" />
        </div>
      </Card>
    </Link>
  );
}
