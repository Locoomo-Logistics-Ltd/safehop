"use client";

import Link from "next/link";
import { Card } from "@/components/ui";
import { HandoffStatusPill } from "@/components/ui/HandoffStatusPill";
import { PackageIcon, ChevronRightIcon } from "@/components/icons";
import { formatRelativeDateTime } from "@/lib/format";
import { ROUTES } from "@/core/config/constants";
import { HANDLING_LABELS, type NodeOrderSummary } from "@/core/types";
import { NEXT_ACTION_COPY } from "@/modules/node/lib/next-action";

/**
 * One parcel in a work queue — tracking code, what to do with it next,
 * its shelf and any handling warnings. Home is a summary: the row only
 * navigates, to the counter (`/node/counter?code=…`), where the one
 * action for this parcel lives.
 */
export function NodeOrderRow({ order }: { order: NodeOrderSummary }) {
  const isOutgoing = order.myRole === "origin";
  const action = order.nextAction && order.nextAction !== "none" ? NEXT_ACTION_COPY[order.nextAction].title : null;

  return (
    <Link href={ROUTES.nodeCounterOrder(order.trackingCode)}>
      <Card interactive padding="md" className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
          <PackageIcon size={16} />
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-text-primary font-mono tracking-tight truncate">
            {order.trackingCode}
          </p>
          <p className="mt-1 text-[12px] text-text-secondary truncate">{order.parcelDescription}</p>
          <p className="mt-1 text-[11px] text-text-muted truncate">
            {isOutgoing ? `To ${order.destinationNodeName}` : `From ${order.originNodeName}`}
            {order.receiverMasked ? ` · ${order.receiverMasked}` : ""}
          </p>
          {action && <p className="mt-1.5 text-[11.5px] font-semibold text-brand-blue">{action}</p>}
          {!!order.parcel?.handling.length && (
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-status-warning">
              {order.parcel.handling.map((h) => HANDLING_LABELS[h]).join(" · ")}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {order.shelfNumber != null && (
            <span className="text-[11px] font-bold text-brand-blue bg-status-info-bg px-2 py-0.5 rounded-full">
              Shelf {order.shelfNumber}
            </span>
          )}
          <span className="text-[10px] text-text-muted whitespace-nowrap">
            {formatRelativeDateTime(order.createdAt)}
          </span>
          <HandoffStatusPill status={order.status} />
        </div>

        <ChevronRightIcon size={16} className="text-text-muted shrink-0" />
      </Card>
    </Link>
  );
}
