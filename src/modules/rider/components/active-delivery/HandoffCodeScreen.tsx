"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, Card, EmptyState } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { TopBar } from "@/components/layout";
import {
  MapPinIcon,
  PackageIcon,
  TruckIcon,
  NavigationIcon,
  ClockIcon,
} from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { HANDOFF_CODE_LENGTH } from "@/core/types";
import { useActiveDelivery } from "@/modules/rider/hooks/use-active-deliveries";
import { useHandoffCode } from "@/modules/rider/hooks/use-handoff-code";
import {
  HANDOFF_LEG_COPY,
  buildNavigationUrl,
  formatCountdown,
  isAppleDevice,
  parcelSizeLabel,
} from "@/modules/rider/lib/handoff-format";

/**
 * Where the rider gets the 6-digit code to read to a node operator.
 *
 * The whole screen is built around the code's 5-minute life. It is not
 * requested on mount — a code issued while the rider is still riding is
 * dead before it's useful, and each request supersedes the last, so
 * pre-fetching would also mean the code on screen could silently stop
 * being the valid one. The rider taps once they're at the counter, and
 * from then on the countdown is the most prominent thing after the
 * digits themselves.
 */
export function HandoffCodeScreen() {
  const params = useParams<{ orderId: string }>();
  
  const orderId = params.orderId;

  const { delivery, isLoading, handoffType } = useActiveDelivery(orderId);
  const {
    code,
    secondsRemaining,
    isExpired,
    isNoLongerAssigned,
    requestCode,
    isRequesting,
    requestError,
    hasRequested,
  } = useHandoffCode(orderId, handoffType ?? "rider_pickup");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  // Either it isn't in this rider's order list at a step that still
  // needs a code, or the server has just told us it isn't ours anymore
  // — the rider needs the same explanation either way.
  if (!delivery || isNoLongerAssigned) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Handoff" showBack hideOnDesktop={false} />
        <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[480px] mx-auto">
          <EmptyState
            icon={<TruckIcon size={24} />}
            title="Nothing to hand off here"
            description="This delivery isn't currently waiting on a code from you — it may already be complete, or it was never assigned to you."
            action={
              <Link href={ROUTES.riderActiveDeliveries}>
                <Button size="md">Back to active deliveries</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const leg = HANDOFF_LEG_COPY[handoffType ?? "rider_pickup"];
  const isPickup = handoffType === "rider_pickup";
  const nodeName = isPickup ? delivery.originNodeName : delivery.destinationNodeName;
  const nodeAddress = isPickup ? delivery.originNodeAddress : delivery.destinationNodeAddress;

  const friendlyError = requestError ? getFriendlyError(requestError) : null;
  const isRunningLow = !!code && secondsRemaining <= 60;

  const handleNavigate = () => {
    window.open(buildNavigationUrl(nodeAddress, isAppleDevice()), "_blank");
  };

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title={leg.title} showBack hideOnDesktop={false} />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[480px] mx-auto flex flex-col gap-4">
        {/* Which node, and what's in the parcel */}
        <Card padding="md" className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-0.5">
                Tracking code
              </p>
              <p className="text-[15px] font-bold text-text-primary font-mono truncate">
                {delivery.trackingCode}
              </p>
            </div>
            <span
              className={
                isPickup
                  ? "shrink-0 text-[10px] font-semibold text-status-warning bg-status-warning-bg px-2 py-0.5 rounded-full uppercase tracking-wide"
                  : "shrink-0 text-[10px] font-semibold text-brand-blue bg-status-info-bg px-2 py-0.5 rounded-full uppercase tracking-wide"
              }
            >
              {leg.badge}
            </span>
          </div>

          <div className="h-px bg-border-default" />

          <div className="flex items-start gap-2.5">
            <span className="w-9 h-9 rounded-[10px] bg-status-success-bg text-status-success flex items-center justify-center shrink-0 mt-0.5">
              <MapPinIcon size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-0.5">
                {leg.nodeLabel}
              </p>
              <p className="text-[13px] font-semibold text-text-primary">{nodeName}</p>
              <p className="text-[12px] text-text-muted">{nodeAddress}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-9 h-9 rounded-[10px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0 mt-0.5">
              <PackageIcon size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-text-primary">
                {delivery.parcelDescription}
              </p>
              <p className="text-[11px] text-text-muted">
                {parcelSizeLabel(delivery.parcelSize)}
              </p>
            </div>
          </div>
        </Card>

        {friendlyError && (
          <ErrorAlert
            title={friendlyError.title}
            message={friendlyError.message}
            action={friendlyError.action}
          />
        )}

        {/* The code itself */}
        {code ? (
          <Card
            padding="lg"
            className={
              isRunningLow
                ? "flex flex-col items-center gap-3 border-status-warning"
                : "flex flex-col items-center gap-3 border-status-success"
            }
          >
            <p className="text-[12px] text-text-secondary text-center">
              Read this to the operator at {nodeName}
            </p>

            {/* Sized for an operator reading it off the rider's screen at
                arm's length across a counter, not for the rider. */}
            <p className="font-display font-bold text-[44px] leading-none tracking-[0.15em] text-text-primary tabular-nums select-all">
              {code}
            </p>

            <div
              className={
                isRunningLow
                  ? "flex items-center gap-1.5 text-status-warning"
                  : "flex items-center gap-1.5 text-text-muted"
              }
            >
              <ClockIcon size={13} />
              <span className="text-[13px] font-semibold tabular-nums">
                Expires in {formatCountdown(secondsRemaining)}
              </span>
            </div>

            {/* Said on the rider's side too, because it's the half of
                the protocol they control: the operator resolves the
                parcel from their own records, so a rider who starts
                reciting a tracking code is slowing the counter down. */}
            <p className="text-[11px] text-text-muted text-center max-w-[260px]">
              These {HANDOFF_CODE_LENGTH} digits are all the operator needs — they
              already have the parcel&apos;s details.
            </p>

            <Button
              variant="ghost"
              size="sm"
              isLoading={isRequesting}
              onClick={requestCode}
            >
              Get a new code
            </Button>
          </Card>
        ) : isExpired ? (
          <Card padding="lg" className="flex flex-col items-center gap-3 border-status-danger">
            <p className="font-semibold text-[15px] text-text-primary">That code expired</p>
            <p className="text-[13px] text-text-muted text-center max-w-[280px]">
              Codes last 5 minutes. Get a fresh one — the operator can try again straight away.
            </p>
            <Button size="md" isLoading={isRequesting} onClick={requestCode}>
              Get a new code
            </Button>
          </Card>
        ) : (
          <Card padding="lg" className="flex flex-col items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-status-info-bg text-brand-blue flex items-center justify-center">
              <TruckIcon size={22} />
            </span>
            <p className="text-[13px] text-text-secondary text-center max-w-[300px] leading-[1.6]">
              {leg.description}
            </p>
            <p className="text-[12px] text-text-muted text-center">
              Only tap this once you&apos;re at the counter — the code expires 5 minutes
              after it&apos;s issued.
            </p>
            <Button
              fullWidth
              size="lg"
              isLoading={isRequesting}
              onClick={requestCode}
              className="!bg-brand-blue"
            >
              {hasRequested ? "Get my code" : "I'm at the counter — get my code"}
            </Button>
          </Card>
        )}

        <Button
          fullWidth
          size="lg"
          variant="outline"
          leftIcon={<NavigationIcon size={16} />}
          onClick={handleNavigate}
        >
          Navigate to {nodeName}
        </Button>
      </div>
    </div>
  );
}
