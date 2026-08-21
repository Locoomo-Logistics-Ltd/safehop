"use client";

import Link from "next/link";
import { Button, Card, EmptyState } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { RootTopBar } from "@/components/layout";
import {
  BriefcaseIcon,
  ShieldCheckIcon,
  MapPinIcon,
  RefreshCcwIcon,
  TruckIcon,
} from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { RIDER_MAX_CONCURRENT_DELIVERIES } from "@/core/types";
import { useRiderVerification } from "@/modules/rider/hooks/use-rider-verification";
import { useAvailableOrders } from "@/modules/rider/hooks/use-available-orders";
import { useAcceptOrder } from "@/modules/rider/hooks/use-accept-order";
import { useActiveDeliveries } from "@/modules/rider/hooks/use-active-deliveries";
import { AvailableJobCard } from "./AvailableJobCard";

/**
 * The real job board — `GET /handoffs/available-orders`.
 *
 * Supersedes JobOfferScreen, which models a single pushed offer with a
 * countdown against the undocumented `riderOps.jobBoard`. The documented
 * contract is a pull-based list of everything unclaimed: no expiry, no
 * decline, and a rider may hold up to three at once. That's a different
 * screen, not a restyled one.
 *
 * The verification gate is carried over from JobOfferScreen unchanged.
 * It isn't decoration — this endpoint answers `403 RIDER_NOT_ACTIVE`
 * for a rider whose profile hasn't been approved, so without the gate
 * an unverified rider would just watch a request fail with nothing
 * useful to do about it.
 */
export function AvailableJobsScreen() {
  const {
    profile: verification,
    isLoadingProfile: isLoadingVerification,
    profileError: verificationError,
  } = useRiderVerification();

  const {
    items,
    page,
    limit,
    total,
    hasNextPage,
    hasPreviousPage,
    setPage,
    isLoading,
    isFetching,
    error,
    refetch,
    isSortTrustworthy,
  } = useAvailableOrders();

  const { acceptOrder, isAccepting, acceptingOrderId, acceptError } = useAcceptOrder();
  const { isAtCapacity, remainingCapacity } = useActiveDeliveries();

  if (isLoadingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  // A real fetch failure (network/auth/server) is not the same as
  // "not yet verified" — show the actual error instead of telling a
  // Rider whose session just expired that they need to verify again.
  if (verificationError) {
    const friendly = getFriendlyError(verificationError);
    return (
      <div className="min-h-screen bg-bg-canvas flex flex-col items-center justify-center px-6">
        <ErrorAlert title={friendly.title} message={friendly.message} action={friendly.action} />
      </div>
    );
  }

  if (verification?.status !== "active") {
    return (
      <div className="min-h-screen bg-bg-canvas flex flex-col items-center justify-center px-6">
        <EmptyState
          icon={<ShieldCheckIcon size={24} />}
          title="Verification required"
          description="You need to complete verification before you can view or take any job. It only takes a minute."
          action={
            <Link href={ROUTES.riderVerification}>
              <Button size="md">Complete Verification</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const friendlyAcceptError = acceptError ? getFriendlyError(acceptError) : null;
  const friendlyListError = error ? getFriendlyError(error) : null;

  return (
    <div className="min-h-screen bg-bg-canvas">
      <RootTopBar profileHref={ROUTES.riderProfile} />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[480px] mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-[18px] font-bold text-text-primary">
              Jobs near you
            </h1>
            <p className="text-[12px] text-text-muted">
              {total > 0
                ? `${total} parcel${total === 1 ? "" : "s"} waiting for a rider`
                : "Parcels waiting at their origin node"}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            isLoading={isFetching && !isLoading}
            onClick={() => refetch()}
            leftIcon={<RefreshCcwIcon size={14} />}
          >
            Refresh
          </Button>
        </div>

        {/* The sort is only as good as the position it ran against, and
            useGeolocation falls back to Lagos centre on denial rather
            than failing — saying nothing here would present a fiction
            as a fact. */}
        {!isSortTrustworthy && (
          <Card padding="md" className="flex items-start gap-2.5 border-status-warning">
            <span className="w-8 h-8 rounded-[9px] bg-status-warning-bg text-status-warning flex items-center justify-center shrink-0">
              <MapPinIcon size={14} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-text-primary">
                Location is off, so these aren&apos;t sorted by distance
              </p>
              <p className="text-[12px] text-text-muted mt-0.5">
                We&apos;re listing jobs from the Lagos city centre instead. Turn on location
                access to see what&apos;s genuinely closest to you.
              </p>
            </div>
          </Card>
        )}

        {isAtCapacity && (
          <Card padding="md" className="flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-[9px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
              <TruckIcon size={14} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-text-primary">
                You&apos;re carrying {RIDER_MAX_CONCURRENT_DELIVERIES} deliveries
              </p>
              <p className="text-[12px] text-text-muted mt-0.5">
                Drop one off before taking another.{" "}
                <Link href={ROUTES.riderActiveDeliveries} className="text-brand-blue underline">
                  See your active deliveries
                </Link>
              </p>
            </div>
          </Card>
        )}

        {friendlyAcceptError && (
          <ErrorAlert
            title={friendlyAcceptError.title}
            message={friendlyAcceptError.message}
            action={friendlyAcceptError.action}
          />
        )}

        {friendlyListError && (
          <ErrorAlert
            title={friendlyListError.title}
            message={friendlyListError.message}
            action={friendlyListError.action}
          />
        )}

        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
          </div>
        ) : items.length === 0 && !friendlyListError ? (
          <EmptyState
            icon={<BriefcaseIcon size={24} />}
            title="No jobs available right now"
            description="Every parcel at nearby nodes has a rider. Pull down or refresh in a moment — new ones appear as consumers drop off."
            action={
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Refresh
              </Button>
            }
          />
        ) : (
          <>
            {!isAtCapacity && remainingCapacity < RIDER_MAX_CONCURRENT_DELIVERIES && (
              <p className="text-[12px] text-text-muted">
                You can take {remainingCapacity} more{" "}
                {remainingCapacity === 1 ? "delivery" : "deliveries"}.
              </p>
            )}

            <div className="flex flex-col gap-3">
              {items.map((order) => (
                <AvailableJobCard
                  key={order.id}
                  order={order}
                  onAccept={acceptOrder}
                  isAccepting={acceptingOrderId === order.id}
                  isAnyAccepting={isAccepting}
                  isAtCapacity={isAtCapacity}
                  showDistance={isSortTrustworthy}
                />
              ))}
            </div>

            {(hasNextPage || hasPreviousPage) && (
              <div className="flex items-center justify-between gap-3 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasPreviousPage || isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  ← Previous
                </Button>

                <span className="text-[12px] text-text-muted">
                  Page {page} of {Math.max(1, Math.ceil(total / limit))}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNextPage || isFetching}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
