"use client";

import Link from "next/link";
import { Card } from "@/components/ui";
import { PackageIcon, ChevronRightIcon } from "@/components/icons";
import { formatRelativeDateTime } from "@/lib/format";
import { ROUTES } from "@/core/config/constants";
import type { NodeParcel } from "@/core/types";
import { NodeParcelStatusBadge } from "./NodeParcelStatusBadge";

interface NodeParcelRowProps {
  parcel: NodeParcel;
}

/**
 * One parcel row on the Node Dashboard — tracking code, status,
 * sender → receiver, matching the Figma list (LC-482TX, LC-9932Y...).
 *
 * Ready-for-collection rows point at the counter list rather than
 * straight at a collect screen. This dashboard is fed by the
 * undocumented `/nodes/operator/inventory`, whose `id` is not known to
 * be the order uuid that `POST /handoffs/orders/:id/collect` needs —
 * deep-linking on it would produce a 404 that looks like a wrong code.
 * The counter list is keyed on ids captured from real handoff
 * responses, so it's the safe landing point until that endpoint is
 * documented.
 */
export function NodeParcelRow({ parcel }: NodeParcelRowProps) {
  const isReady = parcel.status === "ready_for_collection";
  const href = isReady ? ROUTES.vendorAwaitingCollection : ROUTES.vendorFlag(parcel.id);

  return (
    <Link href={href}>
      <Card interactive padding="md" className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
          <PackageIcon size={16} />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[13px] font-bold text-text-primary font-mono tracking-tight">
              {parcel.trackingCode}
            </p>
            <span className="text-[11px] text-text-muted shrink-0">
              {formatRelativeDateTime(parcel.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-text-secondary truncate">
            <span className="truncate">{parcel.sender.name}</span>
            <span className="text-text-muted shrink-0">→</span>
            <span className="truncate font-medium">{parcel.receiver.name}</span>
          </div>
        </div>

        <NodeParcelStatusBadge status={parcel.status} />
        <ChevronRightIcon size={16} className="text-text-muted shrink-0" />
      </Card>
    </Link>
  );
}
