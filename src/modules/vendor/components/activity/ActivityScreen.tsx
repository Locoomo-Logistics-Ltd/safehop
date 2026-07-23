"use client";

import { TopBar } from "@/components/layout";
import { EmptyState } from "@/components/ui";
import { ActivityIcon } from "@/components/icons";
import { useActivityLog } from "@/modules/vendor/hooks/use-activity-log";
import { RiderHandoffToast } from "./RiderHandoffToast";
import { ActivityLogItem } from "./ActivityLogItem";

/** Activity tab — toast + chronological timeline, matching Figma "5. Activity & Rider...". */
export function ActivityScreen() {
  const { entries, isLoading } = useActivityLog();

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Activity" />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-8 max-w-[560px] mx-auto">
        <h1 className="hidden md:block font-display text-[22px] font-bold text-text-primary mb-6">
          Activity
        </h1>

        <RiderHandoffToast trackingCode="LC-482TX" riderName="Tunde A." minutesAgo={2} />

        <h2 className="font-semibold text-[14px] text-text-primary mb-3">Activity Log</h2>

        {isLoading ? (
          <p className="text-[13px] text-text-muted text-center py-10">Loading activity…</p>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<ActivityIcon size={24} />}
            title="No activity yet"
            description="Scans, handoffs, and exceptions at your node will show up here."
          />
        ) : (
          <div>
            {entries.map((entry, i) => (
              <ActivityLogItem key={entry.id} entry={entry} isLast={i === entries.length - 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
