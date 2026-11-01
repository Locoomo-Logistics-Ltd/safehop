"use client";

import { cn } from "@/lib/utils";
import type { DashboardFilterTab } from "@/modules/node/hooks/use-node-dashboard";

interface TabOption {
  value: DashboardFilterTab;
  label: string;
}

/** Server-side work queues, in the order a parcel moves through a station (docs/LOGISTICS_API.md §5.2). */
export const QUEUE_TABS: TabOption[] = [
  { value: "to_receive", label: "To receive" },
  { value: "to_dispatch", label: "To dispatch" },
  { value: "incoming", label: "Incoming" },
  { value: "to_collect", label: "To collect" },
];

interface ParcelFilterTabsProps {
  active: DashboardFilterTab;
  onChange: (tab: DashboardFilterTab) => void;
}

/** Pill-style filter tabs above the Node Dashboard parcel list, matching Figma. */
export function ParcelFilterTabs({ active, onChange }: ParcelFilterTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0" role="tablist">
      {QUEUE_TABS.map((tab) => {
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
