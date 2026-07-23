"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { PackageIcon, ChevronRightIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { ROUTES } from "@/core/config/constants";
import { useDeliveries } from "@/modules/user/hooks/use-deliveries";
import { DeliveryCard } from "./DeliveryCard";
import { DeliveryCardSkeleton } from "./DeliveryCardSkeleton";

const MAX_VISIBLE = 3;

/** "Active Deliveries" section on the dashboard — shows up to 3, with a View All link. */
export function ActiveDeliveriesSection() {
  const { active, isLoading } = useDeliveries();

  return (
    <section className="px-4 md:px-6 mt-7">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-[16px] text-text-primary">
          Active Deliveries
        </h2>
        {active.length > MAX_VISIBLE && (
          <Link
            href="/track"
            className="flex items-center gap-0.5 text-[13px] font-medium text-brand-blue"
          >
            View All
            <ChevronRightIcon size={15} />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <DeliveryCardSkeleton />
          <DeliveryCardSkeleton />
        </div>
      ) : active.length === 0 ? (
        <EmptyState
          icon={<PackageIcon size={24} />}
          title="No active deliveries"
          description="When you send a parcel, you'll be able to track its journey here."
          action={
            <Link href={ROUTES.newDelivery}>
              <Button size="sm">Send a Parcel</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {active.slice(0, MAX_VISIBLE).map((delivery) => (
            <DeliveryCard key={delivery.id} delivery={delivery} />
          ))}
        </div>
      )}
    </section>
  );
}
