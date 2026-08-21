"use client";

import { RootTopBar } from "@/components/layout";
import { EmptyState } from "@/components/ui";
import { WalletIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { useMyEarnings } from "@/modules/rider/hooks/use-my-earnings";
import { EarningsFilterTabs } from "./EarningsFilterTabs";
import { EarningsEntryRow } from "./EarningsEntryRow";

/** "Earnings" tab — the rider's own revenue-split entries, `GET /earnings/mine`. */
export function MyEarningsScreen() {
  const { entries, range, setRange, isLoading } = useMyEarnings();

  return (
    <div className="min-h-screen bg-bg-canvas">
      <RootTopBar profileHref={ROUTES.riderProfile} />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-8 max-w-140 mx-auto">
        <h1 className="font-display text-[18px] md:text-[22px] font-bold text-text-primary mb-4 md:mb-6">
          Earnings
        </h1>

        <div className="mb-4">
          <EarningsFilterTabs active={range} onChange={setRange} />
        </div>

        {isLoading ? (
          <p className="text-[13px] text-text-muted text-center py-10">Loading earnings…</p>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<WalletIcon size={24} />}
            title="No earnings in this range"
            description="Your share of completed deliveries will show up here."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {entries.map((entry) => (
              <EarningsEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
