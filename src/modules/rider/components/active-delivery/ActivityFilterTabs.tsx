"use client";

import { cn } from "@/lib/utils";

export type ActivityFilter = "all" | "in_transit" | "awaiting_collection" | "completed";

/** Order riders can tap through, left to right — also what a swipe gesture steps along. */
export const ACTIVITY_FILTER_ORDER: ActivityFilter[] = [
  "all",
  "in_transit",
  "awaiting_collection",
  "completed",
];

const TAB_LABELS: Record<ActivityFilter, string> = {
  all: "All",
  in_transit: "In Transit",
  awaiting_collection: "Awaiting Collection",
  completed: "Completed",
};

interface ActivityFilterTabsProps {
  active: ActivityFilter;
  onChange: (filter: ActivityFilter) => void;
  counts: Record<ActivityFilter, number>;
}

/** Filter pills for the rider's Activity screen — same pattern as `EarningsFilterTabs`. */
export function ActivityFilterTabs({ active, onChange, counts }: ActivityFilterTabsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0"
      role="tablist"
    >
      {ACTIVITY_FILTER_ORDER.map((filter) => {
        const isActive = active === filter;
        return (
          <button
            key={filter}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(filter)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors duration-150",
              isActive
                ? "bg-brand-blue text-white"
                : "bg-bg-card border border-border-default text-text-secondary"
            )}
          >
            {TAB_LABELS[filter]}
            <span className={isActive ? "text-white/70" : "text-text-muted"}>
              {counts[filter]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
