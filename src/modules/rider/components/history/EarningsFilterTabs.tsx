"use client";

import { cn } from "@/lib/utils";
import type { EarningsFilterRange } from "@/core/types";

const TABS: { value: EarningsFilterRange; label: string }[] = [
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "all_time", label: "All Time" },
];

interface EarningsFilterTabsProps {
  active: EarningsFilterRange;
  onChange: (range: EarningsFilterRange) => void;
}

/** Time-range filter pills for "My Deliveries", matching Figma. */
export function EarningsFilterTabs({ active, onChange }: EarningsFilterTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0" role="tablist">
      {TABS.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              "shrink-0 px-4 h-9 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors duration-150",
              isActive
                ? "bg-brand-blue text-white"
                : "bg-bg-card border border-border-default text-text-secondary"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
