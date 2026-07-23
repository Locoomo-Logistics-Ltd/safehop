import { cn } from "@/lib/utils";
import { formatRelativeDateTime } from "@/lib/format";
import type { TrackingEvent } from "@/core/types";

interface TrackingTimelineProps {
  events: TrackingEvent[];
}

/**
 * Vertical timeline of tracking events — the dotted-line-with-dots
 * motif rotated 90°, reusing the same visual language as RouteRail.
 * Most recent event first, matching the Figma "Tracking History" list.
 */
export function TrackingTimeline({ events }: TrackingTimelineProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="flex flex-col">
      {sortedEvents.map((event, i) => {
        const isLatest = i === 0;
        const isLast = i === sortedEvents.length - 1;

        return (
          <div key={event.id} className="flex gap-3">
            {/* Dot + connecting line */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "w-3 h-3 rounded-full border-2 shrink-0 mt-1",
                  isLatest ? "bg-status-success border-status-success" : "bg-bg-card border-border-strong"
                )}
              />
              {!isLast && <span className="w-[2px] flex-1 bg-border-default my-1" />}
            </div>

            {/* Content */}
            <div className={cn("flex-1 pb-5", isLast && "pb-0")}>
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "text-[14px] font-semibold",
                    isLatest ? "text-text-primary" : "text-text-secondary"
                  )}
                >
                  {event.label}
                </p>
                <p className="text-[11px] text-text-muted whitespace-nowrap shrink-0">
                  {formatRelativeDateTime(event.timestamp)}
                </p>
              </div>
              <p className="text-[13px] text-text-secondary leading-[1.5] mt-0.5">
                {event.description}
              </p>
              {event.location && (
                <p className="text-[12px] text-text-muted mt-1">📍 {event.location}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
