"use client";

import { useParams } from "next/navigation";
import { Button, Card, StatusBadge, RouteRail } from "@/components/ui";
import { TopBar } from "@/components/layout";
import { QrCodeIcon } from "@/components/icons";
import { useDelivery } from "@/modules/user/hooks/use-delivery";
import { getDeliveryProgress } from "@/modules/user/hooks/use-deliveries";
import { TrackingTimeline } from "./TrackingTimeline";

/** Tracking screen — route progress + full event history, matching Figma. */
export function TrackPackageScreen() {
  const params = useParams<{ id: string }>();
  const { delivery, isLoading, isError } = useDelivery(params.id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  if (isError || !delivery) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-canvas px-6 text-center">
        <p className="font-semibold text-text-primary mb-1">Delivery not found</p>
        <p className="text-[13px] text-text-secondary">
          This tracking link may be invalid or expired.
        </p>
      </div>
    );
  }

  const progress = getDeliveryProgress(delivery.status);
  const isReadyForCollection = delivery.status === "ready_for_collection";

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Track Package" showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-10 max-w-[560px] mx-auto">
        <div className="hidden md:block mb-6">
          <h1 className="font-display text-[22px] font-bold text-text-primary">Track Package</h1>
        </div>

        {/* Tracking code header */}
        <Card padding="md" className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
              Tracking Code
            </p>
            <p className="text-[16px] font-bold text-text-primary font-mono tracking-tight">
              {delivery.trackingCode}
            </p>
          </div>
          <StatusBadge status={delivery.status} />
        </Card>

        {/* Route overview */}
        <Card padding="md" className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-3">
            Route Overview
          </p>
          <RouteRail
            originLabel={delivery.route.originLabel}
            destinationLabel={delivery.route.destinationLabel}
            progress={progress}
            variant="full"
          />
          <div className="flex items-center justify-between text-[12px] text-text-secondary mt-2 font-medium">
            <span>{delivery.route.originLabel}</span>
            <span>{delivery.route.destinationLabel}</span>
          </div>
        </Card>

        {/* Tracking history */}
        <Card padding="lg">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-4">
            Tracking History
          </p>
          {delivery.trackingHistory.length === 0 ? (
            <p className="text-[13px] text-text-muted">No tracking events yet.</p>
          ) : (
            <TrackingTimeline events={delivery.trackingHistory} />
          )}
        </Card>

        {isReadyForCollection && (
          <Button fullWidth size="lg" leftIcon={<QrCodeIcon size={18} />} className="mt-5">
            Show Collection QR
          </Button>
        )}
      </div>
    </div>
  );
}
