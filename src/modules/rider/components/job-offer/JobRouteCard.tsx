import { Card } from "@/components/ui";
import type { DeliveryJob } from "@/core/types";

interface JobRouteCardProps {
  job: DeliveryJob;
}

/** Pickup → Dropoff route display inside the job offer/active job card, matching Figma. */
export function JobRouteCard({ job }: JobRouteCardProps) {
  return (
    <Card padding="md" className="flex flex-col gap-0">
      {/* Pickup */}
      <div className="flex items-start gap-3 pb-3 relative">
        <div className="flex flex-col items-center pt-1">
          <span className="w-2.5 h-2.5 rounded-full bg-status-success border-2 border-status-success shrink-0" />
          <span className="w-px flex-1 bg-border-default my-1 min-h-[24px]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-0.5">
            Pickup
          </p>
          <p className="text-[13px] font-semibold text-text-primary truncate">{job.pickup.label}</p>
          <p className="text-[12px] text-text-muted truncate">{job.pickup.address}</p>
        </div>
      </div>

      {/* Dropoff */}
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center pt-1">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-blue shrink-0" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-0.5">
            Dropoff
          </p>
          <p className="text-[13px] font-semibold text-text-primary truncate">{job.dropoff.label}</p>
          <p className="text-[12px] text-text-muted truncate">{job.dropoff.address}</p>
        </div>
      </div>
    </Card>
  );
}
