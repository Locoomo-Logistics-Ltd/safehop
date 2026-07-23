"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, EmptyState } from "@/components/ui";
import { TruckIcon, ClockIcon, BriefcaseIcon } from "@/components/icons";
import { formatCurrency } from "@/lib/format";
import { ROUTES } from "@/core/config/constants";
import { useJobOffer } from "@/modules/rider/hooks/use-job-offer";
import { RiderMapPlaceholder } from "@/modules/rider/components/active-job/RiderMapPlaceholder";
import { JobRouteCard } from "./JobRouteCard";
import { JobOfferCountdown } from "./JobOfferCountdown";

/**
 * Job Offer screen — the "New Delivery Job" modal-style screen that
 * appears when a new job is available. Matches Figma frame 2 exactly:
 * map at top, countdown timer, distance/ETA stats, pickup→dropoff
 * route, accept/decline buttons.
 */
export function JobOfferScreen() {
  const router = useRouter();
  const { offer, isLoading, acceptJob, isAccepting, declineJob, isDeclining } = useJobOffer();

  const handleExpire = useCallback(() => {
    declineJob();
  }, [declineJob]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-bg-canvas flex flex-col items-center justify-center px-6">
        <EmptyState
          icon={<BriefcaseIcon size={24} />}
          title="No jobs available"
          description="Stay online and we'll notify you as soon as a new delivery job comes in."
          action={
            <Button variant="ghost" size="sm" onClick={() => router.push(ROUTES.riderHome)}>
              ← Back to Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-canvas">
      <div className="px-4 md:px-6 pt-4 pb-8 max-w-[480px] mx-auto">
        {/* Map */}
        <RiderMapPlaceholder height="h-[200px]" className="mb-5" />

        {/* Offer header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-[18px] font-bold text-text-primary">
                New Delivery Job
              </h1>
              {offer.isHighPriority && (
                <span className="text-[10px] font-semibold text-status-warning bg-status-warning-bg px-2 py-0.5 rounded-full uppercase tracking-wide">
                  High Priority
                </span>
              )}
            </div>
            <p className="text-[13px] font-bold text-status-success">
              {formatCurrency(offer.payout)} payout
            </p>
          </div>
          <JobOfferCountdown seconds={299} onExpire={handleExpire} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card padding="md" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-[9px] bg-bg-subtle text-text-secondary flex items-center justify-center shrink-0">
              <TruckIcon size={16} />
            </span>
            <div>
              <p className="font-display font-bold text-[16px] text-text-primary">
                {offer.distanceKm}km
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">Total Dist.</p>
            </div>
          </Card>
          <Card padding="md" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-[9px] bg-status-success-bg text-status-success flex items-center justify-center shrink-0">
              <ClockIcon size={16} />
            </span>
            <div>
              <p className="font-display font-bold text-[16px] text-text-primary">
                {offer.etaMinutes}mins
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">Est. Time</p>
            </div>
          </Card>
        </div>

        {/* Route */}
        <div className="mb-6">
          <JobRouteCard job={offer} />
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Button
            fullWidth size="lg"
            isLoading={isAccepting}
            onClick={() => acceptJob(offer.id)}
            className="!bg-status-success hover:!bg-green-600"
          >
            ✓ Accept Job
          </Button>
          <Button
            fullWidth size="lg"
            variant="outline"
            isLoading={isDeclining}
            onClick={() => declineJob()}
            className="border-status-danger text-status-danger hover:bg-status-danger-bg"
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
