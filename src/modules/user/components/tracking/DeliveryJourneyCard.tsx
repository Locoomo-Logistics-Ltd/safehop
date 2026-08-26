import { Card } from "@/components/ui";
import { PackageIcon, MapPinIcon, TruckIcon, NavigationIcon, CheckCircleIcon } from "@/components/icons";
import { HANDOFF_STATUS } from "@/core/types/handoff.types";
import { getOrderProgress } from "./OrderStatusBadge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/core/types";

const STAGES = [
  { label: "Order Placed", icon: PackageIcon },
  { label: "At Pickup Station", icon: MapPinIcon },
  { label: "On The Way", icon: TruckIcon },
  { label: "Arrived", icon: NavigationIcon },
  { label: "Delivered", icon: CheckCircleIcon },
] as const;

/** Shared width for every icon/label column so the two rows below line up pixel-for-pixel. */
const COLUMN_WIDTH = "w-[54px]";

/**
 * Maps the real `Order.status` (bare `string` per docs/API.md — the
 * full lifecycle enum isn't confirmed on the Orders endpoint itself,
 * only inferable from the Handoffs module's `HANDOFF_STATUS`
 * constant) onto one of the 5 stages above. Any status this doesn't
 * recognize falls back to `getOrderProgress`'s coarser 0/0.5/1
 * heuristic rather than defaulting to "just placed," which would look
 * like regression for a real but unmapped mid-lifecycle value.
 */
function getStageIndex(status: OrderStatus): number {
  switch (status) {
    case HANDOFF_STATUS.awaitingDropOff:
      return 0;
    case HANDOFF_STATUS.parcelReceivedAtOrigin:
    case HANDOFF_STATUS.riderAssigned:
      return 1;
    case HANDOFF_STATUS.inTransit:
      return 2;
    case HANDOFF_STATUS.arrivedAtDestination:
    case HANDOFF_STATUS.readyForCollection:
      return 3;
    case HANDOFF_STATUS.completed:
      return 4;
    default: {
      const progress = getOrderProgress(status);
      if (progress >= 1) return 4;
      if (progress <= 0) return 0;
      return 2;
    }
  }
}

interface DeliveryJourneyCardProps {
  originLabel: string;
  destinationLabel: string;
  status: OrderStatus;
}

/**
 * The Track Package screen's route card — an animated 5-stage journey
 * stepper instead of `RouteRail`'s dashed-line texture (that motif
 * stays as-is on Admin's Order Details and everywhere else it's used;
 * this is a dedicated, richer replacement scoped to this one screen,
 * not a change to the shared component). The connector segments fill
 * in on mount via a pure CSS `scaleX` keyframe (`animate-locoomo-fill`,
 * `globals.css`) rather than a JS-driven width transition, and the
 * current stage's icon gets a soft pulsing ring (`animate-locoomo-pulse`,
 * already used by the login screens' decorative scenes) to read as
 * "live," not static.
 */
export function DeliveryJourneyCard({ originLabel, destinationLabel, status }: DeliveryJourneyCardProps) {
  const stageIndex = getStageIndex(status);
  const lastIndex = STAGES.length - 1;

  return (
    <Card padding="md" className="mb-4 overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Delivery Journey
        </p>
        <p className="text-[12px] font-semibold text-brand-blue">{STAGES[stageIndex].label}</p>
      </div>

      {/* Icons + connectors — one row, so every connector sits exactly between its two icon centers. */}
      <div className="flex items-center">
        {STAGES.map((stage, i) => {
          const isDone = i < stageIndex;
          const isCurrent = i === stageIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.label} className="contents">
              <div className={cn(COLUMN_WIDTH, "shrink-0 flex justify-center")}>
                <div className="relative">
                  {isCurrent && (
                    <span
                      className="absolute inset-0 rounded-full bg-brand-blue/40 animate-locoomo-pulse"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={cn(
                      "relative w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors duration-500",
                      isDone
                        ? "bg-status-success border-status-success text-white"
                        : isCurrent
                          ? "bg-brand-blue border-brand-blue text-white"
                          : "bg-bg-card border-border-default text-text-muted"
                    )}
                  >
                    {isDone ? <CheckCircleIcon size={16} /> : <Icon size={15} />}
                  </span>
                </div>
              </div>

              {i < lastIndex && (
                <div className="relative flex-1 h-[3px] rounded-full bg-border-default mx-0.5 overflow-hidden">
                  {i < stageIndex && (
                    <span
                      className="absolute inset-0 rounded-full bg-status-success animate-locoomo-fill"
                      aria-hidden="true"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Labels — identical column/spacer structure as the row above, so it lines up underneath. */}
      <div className="flex items-start mt-2">
        {STAGES.map((stage, i) => {
          const isReached = i <= stageIndex;
          return (
            <div key={stage.label} className="contents">
              <span
                className={cn(
                  COLUMN_WIDTH,
                  "shrink-0 text-[10px] font-medium text-center leading-tight px-0.5",
                  isReached ? "text-text-primary" : "text-text-muted"
                )}
              >
                {stage.label}
              </span>
              {i < lastIndex && <span className="flex-1 mx-0.5" aria-hidden="true" />}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[12px] text-text-secondary mt-5 pt-4 border-t border-border-default font-medium">
        <span className="flex items-center gap-1.5 min-w-0">
          <MapPinIcon size={12} className="text-text-muted shrink-0" />
          <span className="truncate">{originLabel}</span>
        </span>
        <span className="flex items-center gap-1.5 min-w-0 justify-end">
          <span className="truncate">{destinationLabel}</span>
          <NavigationIcon size={12} className="text-text-muted shrink-0" />
        </span>
      </div>
    </Card>
  );
}
