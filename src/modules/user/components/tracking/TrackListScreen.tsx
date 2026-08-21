"use client";

import { RootTopBar } from "@/components/layout";
import { EmptyState, Button } from "@/components/ui";
import { PackageIcon } from "@/components/icons";
import Link from "next/link";
import { ROUTES } from "@/core/config/constants";
import { useDeliveries } from "@/modules/user/hooks/use-deliveries";
import { DeliveryCard } from "@/modules/user/components/dashboard/DeliveryCard";
import { DeliveryCardSkeleton } from "@/modules/user/components/dashboard/DeliveryCardSkeleton";

/** "Track" tab — full list of all deliveries (active + past), each linking to detail tracking. */
export function TrackListScreen() {
  const { deliveries, isLoading } = useDeliveries();

  return (
    <div className="min-h-screen bg-bg-canvas">
      <RootTopBar profileHref={ROUTES.profile} />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-8 max-w-[640px] mx-auto">
        <h1 className="font-display text-[18px] md:text-[22px] font-bold text-text-primary mb-4 md:mb-6">
          Track Deliveries
        </h1>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <DeliveryCardSkeleton />
            <DeliveryCardSkeleton />
            <DeliveryCardSkeleton />
          </div>
        ) : deliveries.length === 0 ? (
          <EmptyState
            icon={<PackageIcon size={24} />}
            title="No deliveries yet"
            description="Once you send a parcel, it'll show up here so you can track its journey."
            action={
              <Link href={ROUTES.newDelivery}>
                <Button size="sm">Send a Parcel</Button>
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {deliveries.map((delivery) => (
              <DeliveryCard key={delivery.id} delivery={delivery} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
