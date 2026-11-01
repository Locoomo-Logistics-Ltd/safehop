"use client";

import { useState } from "react";
import Link from "next/link";
import { RootTopBar } from "@/components/layout";
import { EmptyState, Button } from "@/components/ui";
import { PackageIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/core/config/constants";
import type { OrderTab } from "@/core/api/services/delivery.service";
import { useOrdersTab } from "@/modules/user/hooks/use-deliveries";
import { DeliveryCard } from "@/modules/user/components/dashboard/DeliveryCard";
import { DeliveryCardSkeleton } from "@/modules/user/components/dashboard/DeliveryCardSkeleton";

const TABS: { value: OrderTab; label: string; emptyTitle: string; emptyBody: string }[] = [
  {
    value: "active",
    label: "Active",
    emptyTitle: "Nothing on the way",
    emptyBody: "Parcels you've sent that are still moving will show up here.",
  },
  {
    value: "delivered",
    label: "Delivered",
    emptyTitle: "No delivered parcels yet",
    emptyBody: "Once a receiver collects a parcel, it moves here.",
  },
  {
    value: "returns",
    label: "Returns",
    emptyTitle: "No returns",
    emptyBody: "If a delivery can't be completed, the parcel comes back to you and shows up here.",
  },
];

/** "Track" tab — the Consumer's orders, filtered server-side into Active / Delivered / Returns, each linking to detail tracking. */
export function TrackListScreen() {
  const [tab, setTab] = useState<OrderTab>("active");
  const { orders, isLoading, isError, hasMore, loadMore, isLoadingMore, refetch } = useOrdersTab(tab);
  const current = TABS.find((t) => t.value === tab)!;

  return (
    <div className="min-h-screen bg-bg-canvas">
      <RootTopBar profileHref={ROUTES.profile} />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-8 max-w-[640px] mx-auto">
        <h1 className="font-display text-[18px] md:text-[22px] font-bold text-text-primary mb-4 md:mb-5">
          Track Deliveries
        </h1>

        <div className="flex gap-2 mb-5" role="tablist" aria-label="Order filter">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "px-4 h-9 rounded-full text-[13px] font-semibold border transition-colors",
                tab === t.value
                  ? "bg-brand-blue border-brand-blue text-white"
                  : "bg-bg-card border-border-default text-text-secondary"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <DeliveryCardSkeleton />
            <DeliveryCardSkeleton />
            <DeliveryCardSkeleton />
          </div>
        ) : isError ? (
          <EmptyState
            icon={<PackageIcon size={24} />}
            title="Couldn't load your parcels"
            description="Check your connection and try again."
            action={
              <Button size="sm" onClick={() => void refetch()}>
                Retry
              </Button>
            }
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<PackageIcon size={24} />}
            title={current.emptyTitle}
            description={current.emptyBody}
            action={
              tab === "active" ? (
                <Link href={ROUTES.newDelivery}>
                  <Button size="sm">Send a Parcel</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((delivery) => (
              <DeliveryCard key={delivery.id} delivery={delivery} />
            ))}
            {hasMore && (
              <Button variant="outline" onClick={() => loadMore()} isLoading={isLoadingMore}>
                Load more
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
