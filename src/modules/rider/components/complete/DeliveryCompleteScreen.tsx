"use client";

import { useParams, useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { ROUTES } from "@/core/config/constants";
import { useJobHistory } from "@/modules/rider/hooks/use-job-history";
import { formatRelativeDateTime } from "@/lib/format";

/**
 * "Delivery Complete!" screen — green-glow checkmark, route summary,
 * completion timestamp, "Back to Dashboard" CTA. Matches Figma frame 6.
 */
export function DeliveryCompleteScreen() {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();

  // The completed job is now in history — pull it from there.
  const { jobs, isLoading } = useJobHistory();
  const completedJob = jobs.find((j) => j.id === params.jobId);

  return (
    <div className="min-h-screen bg-bg-canvas flex flex-col items-center justify-center px-6 text-center">
      {/* Glowing success checkmark */}
      <div className="relative mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: "var(--status-success-bg)",
            boxShadow: "0 0 0 12px rgba(22,163,74,0.12), 0 0 0 24px rgba(22,163,74,0.06)",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--status-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
      </div>

      <h1 className="font-display text-[22px] font-bold text-text-primary mb-2">
        Delivery Complete!
      </h1>

      <div className="flex items-center gap-1.5 mb-6">
        <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
        <p className="text-[13px] text-status-success font-medium">
          You are now available for new jobs.
        </p>
      </div>

      {!isLoading && completedJob && (
        <Card padding="md" className="w-full max-w-90 text-left mb-6">
          {/* Route dots */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex flex-col items-center pt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-status-success shrink-0" />
              <span className="w-px flex-1 bg-border-default my-1 h-5" />
              <span className="w-2.5 h-2.5 rounded-full bg-brand-blue shrink-0" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wide">Origin Node</p>
                <p className="text-[13px] font-semibold text-text-primary">{completedJob.pickup.label}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wide">Dest. Node</p>
                <p className="text-[13px] font-semibold text-text-primary">{completedJob.dropoff.label}</p>
              </div>
            </div>
          </div>
          <div className="h-px bg-border-default mb-3" />
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-text-muted">Completed at</span>
            <span className="font-medium text-text-primary">
              {completedJob.deliveredAt
                ? formatRelativeDateTime(completedJob.deliveredAt)
                : "Just now"}
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-2 text-center">
            The receiver has been notified via SMS.
          </p>
        </Card>
      )}

      <Button
        fullWidth
        size="lg"
        onClick={() => router.push(ROUTES.riderHome)}
        className="max-w-90"
      >
        Back to Dashboard
      </Button>
    </div>
  );
}
