"use client";

import { TopBar } from "@/components/layout";
import { EmptyState } from "@/components/ui";
import { WalletIcon } from "@/components/icons";
import { useJobHistory } from "@/modules/rider/hooks/use-job-history";
import { EarningsFilterTabs } from "./EarningsFilterTabs";
import { DeliveryHistoryRow } from "./DeliveryHistoryRow";

/** "My Deliveries" — Earnings tab, matching Figma frame 7. */
export function MyDeliveriesScreen() {
  const { jobs, range, setRange, isLoading } = useJobHistory();

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="My Deliveries" />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-8 max-w-[560px] mx-auto">
        <h1 className="hidden md:block font-display text-[22px] font-bold text-text-primary mb-6">
          My Deliveries
        </h1>

        <div className="mb-4">
          <EarningsFilterTabs active={range} onChange={setRange} />
        </div>

        {isLoading ? (
          <p className="text-[13px] text-text-muted text-center py-10">Loading deliveries…</p>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={<WalletIcon size={24} />}
            title="No deliveries in this range"
            description="Completed and declined jobs will show up here."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {jobs.map((job) => (
              <DeliveryHistoryRow key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
