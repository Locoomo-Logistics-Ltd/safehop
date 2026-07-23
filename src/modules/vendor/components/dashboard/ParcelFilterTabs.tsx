"use client";

import { cn } from "@/lib/utils";
import type { ParcelFilterTab } from "@/modules/vendor/hooks/use-node-parcels";

interface TabOption {
  value: ParcelFilterTab;
  label: string;
}

const TABS: TabOption[] = [
  { value: "awaiting_pickup", label: "Awaiting Pickup" },
  { value: "ready_for_collection", label: "Ready for Collection" },
  { value: "all", label: "All" },
];

interface ParcelFilterTabsProps {
  active: ParcelFilterTab;
  onChange: (tab: ParcelFilterTab) => void;
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
