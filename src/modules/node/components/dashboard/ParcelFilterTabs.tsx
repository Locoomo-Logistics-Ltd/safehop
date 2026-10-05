"use client";

import { cn } from "@/lib/utils";
import type { DashboardFilterTab } from "@/modules/node/hooks/use-node-dashboard";

interface TabOption {
  value: DashboardFilterTab;
  label: string;
}

const TABS: TabOption[] = [
  // "Expected" (2026-09-03) — origin-side orders paid for but not yet
  // received at the counter. Added with dispatch: a station's own
  // dispatched parcel starts at `awaiting_drop_off` just like a
  // Consumer's, and without this tab there was no way to reach it and
  // confirm the drop-off that releases it to riders.
  { value: "expected", label: "Expected" },
  { value: "awaiting_pickup", label: "Awaiting Pickup" },
  { value: "awaiting_arrival", label: "Awaiting Arrival" },
  { value: "ready_for_collection", label: "Ready for Collection" },
];

interface ParcelFilterTabsProps {
  active: DashboardFilterTab;
  onChange: (tab: DashboardFilterTab) => void;
}

/** Pill-style filter tabs above the Node Dashboard parcel list, matching Figma. */
export function ParcelFilterTabs({ active, onChange }: ParcelFilterTabsProps) {
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
                ? "bg-brand-navy text-white"
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
