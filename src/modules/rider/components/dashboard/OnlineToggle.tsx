"use client";

import { cn } from "@/lib/utils";
import { useRiderAvailability } from "@/modules/rider/hooks/use-rider-availability";

/** Online/Offline segmented toggle matching the Figma rider home "ONLINE / OFFLINE" pill. */
export function OnlineToggle() {
  const { availability, toggle, isToggling, isLoading } = useRiderAvailability();

  if (isLoading) {
    return <div className="h-12 rounded-full bg-bg-subtle animate-pulse w-[200px]" />;
  }

  const isOnline = availability === "online";

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center rounded-full border-2 border-border-default bg-bg-card p-1 w-[200px]"
        role="group"
      >
        <button
          onClick={() => !isOnline && toggle()}
          disabled={isToggling}
          className={cn(
            "flex-1 h-10 rounded-full text-[13px] font-bold tracking-wide transition-all duration-200",
            isOnline
              ? "bg-status-success text-white shadow-sm"
              : "text-text-muted"
          )}
        >
          ● ONLINE
        </button>
        <button
          onClick={() => isOnline && toggle()}
          disabled={isToggling}
          className={cn(
            "flex-1 h-10 rounded-full text-[13px] font-bold tracking-wide transition-all duration-200",
            !isOnline
              ? "bg-bg-subtle text-text-primary"
              : "text-text-muted"
          )}
        >
          OFFLINE
        </button>
      </div>
      <p className="text-[12px] text-text-muted text-center">
        {isOnline ? "You are Online — accepting deliveries" : "You are Offline — not accepting jobs"}
      </p>
    </div>
  );
}
