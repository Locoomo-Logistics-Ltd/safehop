"use client";

import Link from "next/link";
import { Card } from "@/components/ui";
import { PackageIcon, ChevronRightIcon } from "@/components/icons";
import { formatRelativeDateTime } from "@/lib/format";
import { ROUTES } from "@/core/config/constants";
import type { NodeOrderSummary } from "@/core/types";
import { HandoffStatusPill } from "@/modules/node/components/handoff/HandoffStatusPill";

interface NodeOrderRowProps {
  order: NodeOrderSummary;
}

/**
 * One order row on Home's Awaiting Pickup / Awaiting Arrival tabs —
 * tracking code, status, and which side of the trip it's on (outgoing
 * to a destination, or incoming from an origin). Home is a summary: the
 * row itself carries no action, it only navigates to
 * `HandoffDetailScreen` (`ROUTES.nodeHandoffDetail`), which has the
 * full order info and the rider-code entry. Ready for Collection has
 * its own row shape (`CollectionSummaryList`) since it needs its two
 * sub-states (needs check-in vs. ready) and links to the existing
 * collect screen instead.
 */
export function NodeOrderRow({ order }: NodeOrderRowProps) {
  const isOutgoing = order.myRole === "origin";

  return (
    // <Link href={ROUTES.nodeHandoffDetail(order.id)}>
    //   <Card interactive padding="md" className="flex items-center gap-3">
    //     <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
    //       <PackageIcon size={16} />
    //     </span>

    //     <div className="flex-1 min-w-0">
    //       <div className="flex items-center justify-between gap-2 mb-1">
    //         <p className="text-[13px] font-bold text-text-primary font-mono tracking-tight">
    //           {order.trackingCode}
    //         </p>
    //         {/* <span className="text-[11px] text-text-muted shrink-0">
    //           {formatRelativeDateTime(order.createdAt)}
    //         </span> */}
    //       </div>
    //       <p className="text-[12px] text-text-secondary truncate">
    //         {order.parcelDescription}
    //         {isOutgoing ? ` → ${order.destinationNodeName}` : ` ← ${order.originNodeName}`}
    //       </p>
    //     </div>

    //     <div>
          
    //       <HandoffStatusPill status={order.status} />
    //     </div>
    //     <ChevronRightIcon size={16} className="text-text-muted shrink-0" />
    //   </Card>
    // </Link>

  <Link href={ROUTES.nodeHandoffDetail(order.id)}>
  <Card
    interactive
    padding="md"
    className="flex items-center gap-3"
  >
    {/* Package icon */}
    <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
      <PackageIcon size={16} />
    </span>

    {/* Main content */}
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-bold text-text-primary font-mono tracking-tight truncate">
        {order.trackingCode}
      </p>

      <p className="mt-1 text-[12px] text-text-secondary truncate">
        {order.parcelDescription}
      </p>

      <p className="mt-1 text-[11px] text-text-muted truncate">
        {isOutgoing
          ? `To ${order.destinationNodeName}`
          : `From ${order.originNodeName}`}
      </p>
    </div>

    {/* Meta */}
    <div className="flex flex-col items-end gap-1.5 shrink-0">
      <span className="text-[10px] text-text-muted whitespace-nowrap">
        {formatRelativeDateTime(order.createdAt)}
      </span>

      <HandoffStatusPill status={order.status} />
    </div>

    {/* Arrow */}
    <ChevronRightIcon
      size={16}
      className="text-text-muted shrink-0"
    />
  </Card>
</Link>
  );
}
