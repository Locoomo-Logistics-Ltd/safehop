"use client";

import Link from "next/link";
import { Button, Card, EmptyState } from "@/components/ui";
import { TopBar } from "@/components/layout";
import {
  TruckIcon,
  PackageIcon,
  NavigationIcon,
  ChevronRightIcon,
} from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { nextHandoffType } from "@/modules/rider/hooks/use-my-orders";
import { useActiveDeliveries } from "@/modules/rider/hooks/use-active-deliveries";
import {
  HANDOFF_LEG_COPY,
  buildNavigationUrl,
  isAppleDevice,
  parcelSizeLabel,
} from "@/modules/rider/lib/handoff-format";
import type { MyOrderSummary } from "@/core/types";

/**
 * The deliveries this rider is currently carrying.
 *
 * Sourced from `GET /handoffs/my-orders` (`use-active-deliveries.ts`) —
 * real, server-backed, and shared across every device this rider signs
 * into. Supersedes the 2026-08-14 device-local version of this screen,
 * which read `store/rider-jobs.store.ts` because no rider-scoped orders
 * endpoint existed yet; that store is deleted.
 */
export function ActiveDeliveriesScreen() {
  const { deliveries, isLoading } = useActiveDeliveries();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Active Deliveries" hideOnDesktop={false} />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[480px] mx-auto flex flex-col gap-4">
        <div>
          <h1 className="font-display text-[18px] font-bold text-text-primary">
            Carrying now
          </h1>
          <p className="text-[12px] text-text-muted">
            {deliveries.length === 0
              ? "Nothing on board"
              : `${deliveries.length} parcel${deliveries.length === 1 ? "" : "s"} in your care`}
          </p>
        </div>

        {deliveries.length === 0 ? (
          <EmptyState
            icon={<TruckIcon size={24} />}
            title="No active deliveries"
            description="Take a job from the board and it'll show up here with the code you need at each node."
            action={
              <Link href={ROUTES.riderAvailableJobs}>
                <Button size="md">Browse available jobs</Button>
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {deliveries.map((delivery) => (
              <ActiveDeliveryRow key={delivery.id} delivery={delivery} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveDeliveryRow({ delivery }: { delivery: MyOrderSummary }) {
  const handoffType = nextHandoffType(delivery);
  const leg = HANDOFF_LEG_COPY[handoffType];

  const nextNodeName =
    handoffType === "rider_pickup" ? delivery.originNodeName : delivery.destinationNodeName;
  const nextNodeAddress =
    handoffType === "rider_pickup" ? delivery.originNodeAddress : delivery.destinationNodeAddress;

  const handleNavigate = () => {
    window.open(buildNavigationUrl(nextNodeAddress, isAppleDevice()), "_blank");
  };

  return (
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
            handoffType === "rider_pickup"
              ? "shrink-0 text-[10px] font-semibold text-status-warning bg-status-warning-bg px-2 py-0.5 rounded-full uppercase tracking-wide"
              : "shrink-0 text-[10px] font-semibold text-brand-blue bg-status-info-bg px-2 py-0.5 rounded-full uppercase tracking-wide"
          }
        >
          {leg.badge}
        </span>
      </div>

      <div className="flex items-start gap-2.5">
        <span className="w-8 h-8 rounded-[9px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0 mt-0.5">
          <PackageIcon size={14} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-0.5">
            {leg.nodeLabel}
          </p>
          <p className="text-[13px] font-semibold text-text-primary truncate">{nextNodeName}</p>
          <p className="text-[12px] text-text-muted truncate">{nextNodeAddress}</p>
          <p className="text-[11px] text-text-muted mt-1">
            {delivery.parcelDescription} · {parcelSizeLabel(delivery.parcelSize)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href={ROUTES.riderHandoff(delivery.id)} className="flex-1">
          <Button fullWidth size="md" rightIcon={<ChevronRightIcon size={15} />}>
            Get handoff code
          </Button>
        </Link>

        <Button
          variant="outline"
          size="md"
          onClick={handleNavigate}
          aria-label={`Navigate to ${nextNodeName}`}
        >
          <NavigationIcon size={16} />
        </Button>
      </div>
    </Card>
  );
}
