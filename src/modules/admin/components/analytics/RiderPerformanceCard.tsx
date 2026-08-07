import { Card, EmptyState } from "@/components/ui";
import { TruckIcon, StarIcon } from "@/components/icons";
import type { RiderPerformanceSummary } from "@/core/types";

interface RiderPerformanceCardProps {
  riders: RiderPerformanceSummary[];
  isLoading: boolean;
}

export function RiderPerformanceCard({ riders, isLoading }: RiderPerformanceCardProps) {
  return (
    <Card padding="md">
      <p className="text-[14px] font-bold text-text-primary mb-0.5">Rider Performance</p>
      <p className="text-[12px] text-text-muted mb-4">Delivery volume and rating leaders</p>

      {isLoading ? (
        <p className="text-[13px] text-text-muted text-center py-6">Loading…</p>
      ) : riders.length === 0 ? (
        <EmptyState
          icon={<TruckIcon size={20} />}
          title="No rider analytics yet"
          description="Rider performance data will appear here once riders start completing deliveries."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {riders.map((rider) => (
            <div key={rider.riderId} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-full bg-admin-accent-bg text-admin-accent flex items-center justify-center text-[11px] font-semibold shrink-0">
                  {rider.riderName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <span className="text-[13px] font-medium text-text-primary truncate">{rider.riderName}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[12px] text-text-muted">{rider.deliveries} deliveries</span>
                <span className="flex items-center gap-1 text-[12px] font-semibold px-2 py-0.5 rounded-full bg-status-success-bg text-status-success">
                  <StarIcon size={10} filled />
                  {rider.ratingLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
