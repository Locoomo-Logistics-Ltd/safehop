"use client";

import { Button, Card } from "@/components/ui";
import { PackageIcon, ClockIcon, NavigationIcon } from "@/components/icons";
import {
  formatDistanceMeters,
  formatWaitingSince,
  parcelSizeLabel,
} from "@/modules/rider/lib/handoff-format";
import type { AvailableOrder } from "@/core/types";

interface AvailableJobCardProps {
  order: AvailableOrder;
  onAccept: (order: AvailableOrder) => void;
  isAccepting: boolean;
  /** Another accept is in flight — this row's button waits its turn rather than racing it. */
  isAnyAccepting: boolean;
  /** Rider is already holding the maximum concurrent deliveries. */
  isAtCapacity: boolean;
  /** False when distance was sorted against a fallback position — the number is then meaningless. */
  showDistance: boolean;
}

/**
 * One unclaimed order on the board. No payout figure anywhere: the
 * handoffs contract deliberately omits `amountKobo` (that's the
 * consumer's fare, not the rider's fee), and there's no rider-earnings
 * endpoint to substitute — inventing a number here would be worse than
 * the gap. Route, size and distance are what the endpoint gives a rider
 * to decide on.
 */
export function AvailableJobCard({
  order,
  onAccept,
  isAccepting,
  isAnyAccepting,
  isAtCapacity,
  showDistance,
}: AvailableJobCardProps) {
  return (
    <Card padding="md" className="flex flex-col gap-3">
      {/* Header: tracking code + distance */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-0.5">
            Tracking code
          </p>
          <p className="text-[15px] font-bold text-text-primary font-mono truncate">
            {order.trackingCode}
          </p>
        </div>

        {showDistance && (
          <div className="shrink-0 text-right">
            <p className="font-display font-bold text-[16px] text-brand-blue">
              {formatDistanceMeters(order.distanceMeters)}
            </p>
            <p className="text-[10px] text-text-muted">to pickup</p>
          </div>
        )}
      </div>

      {/* Route */}
      <div className="flex flex-col gap-0">
        <div className="flex items-start gap-3 pb-3">
          <div className="flex flex-col items-center pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-status-success border-2 border-status-success shrink-0" />
            <span className="w-px flex-1 bg-border-default my-1 min-h-[24px]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-0.5">
              Collect from
            </p>
            <p className="text-[13px] font-semibold text-text-primary truncate">
              {order.originNodeName}
            </p>
            <p className="text-[12px] text-text-muted truncate">{order.originNodeAddress}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-blue shrink-0" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-0.5">
              Deliver to
            </p>
            <p className="text-[13px] font-semibold text-text-primary truncate">
              {order.destinationNodeName}
            </p>
            <p className="text-[12px] text-text-muted truncate">
              {order.destinationNodeAddress}
            </p>
          </div>
        </div>
      </div>

      <div className="h-px bg-border-default" />

      {/* Parcel + age */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-[9px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0">
            <PackageIcon size={14} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-text-primary truncate">
              {order.parcelDescription}
            </p>
            <p className="text-[11px] text-text-muted">{parcelSizeLabel(order.parcelSize)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-text-muted">
          <ClockIcon size={12} />
          <span className="text-[11px]">{formatWaitingSince(order.createdAt)}</span>
        </div>
      </div>

      <Button
        fullWidth
        size="md"
        isLoading={isAccepting}
        disabled={isAtCapacity || (isAnyAccepting && !isAccepting)}
        onClick={() => onAccept(order)}
        leftIcon={!isAccepting ? <NavigationIcon size={15} /> : undefined}
        className="!bg-status-success hover:!bg-green-600"
      >
        {isAtCapacity ? "You're at 3 deliveries" : "Accept job"}
      </Button>
    </Card>
  );
}
