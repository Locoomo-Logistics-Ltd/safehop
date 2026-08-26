"use client";

import { useParams } from "next/navigation";
import { Card } from "@/components/ui";
import { CopyIcon } from "@/components/icons";
import { TopBar } from "@/components/layout";
import { useDelivery } from "@/modules/user/hooks/use-delivery";
import { useNotificationStore } from "@/store/notification.store";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { DeliveryJourneyCard } from "./DeliveryJourneyCard";
import { OrderDetailsCard } from "./OrderDetailsCard";

/**
 * Tracking screen — animated journey card + a captivating order-details
 * receipt, both real data off `GET /orders/:id` (`Order`, `payment.types.ts`).
 *
 * Rebuilt 2026-08-12 against the real `Order` type — the previous
 * event-by-event `TrackingHistory` log is gone for good (the real Order
 * response has no such field, only a single current `status`; re-add it
 * if a real order-events endpoint is ever confirmed against
 * docs/API.md). Rebuilt again 2026-08-26 for visual polish: the route
 * card is now `DeliveryJourneyCard` (an animated 5-stage stepper,
 * mapped off the real lifecycle values in
 * `core/types/handoff.types.ts`'s `HANDOFF_STATUS`) instead of
 * `RouteRail`'s dashed-line texture, and order details moved into
 * `OrderDetailsCard`, an icon-row receipt layout that also surfaces
 * `receiverPhone`/`receiverEmail`/`parcelSize` — real fields on `Order`
 * the old plain list never showed.
 */
export function TrackPackageScreen() {
  const params = useParams<{ id: string }>();
  const { delivery, isLoading, isError } = useDelivery(params.id);
  const showNotification = useNotificationStore((s) => s.showNotification);

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
        <p className="font-semibold text-text-primary mb-1">Order not found</p>
        <p className="text-[13px] text-text-secondary">
          This tracking link may be invalid or expired.
        </p>
      </div>
    );
  }

  const handleCopyTrackingCode = async () => {
    try {
      await navigator.clipboard.writeText(delivery.trackingCode);
      showNotification({ type: "success", title: "Copied", message: "Tracking code copied to clipboard." });
    } catch {
      showNotification({ type: "error", title: "Couldn't copy", message: "Copy the tracking code manually instead." });
    }
  };

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Track Package" showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-10 max-w-[560px] mx-auto">
        <div className="hidden md:block mb-6">
          <h1 className="font-display text-[22px] font-bold text-text-primary">Track Package</h1>
        </div>

        {/* Tracking code header */}
        <Card padding="md" className="mb-4 flex items-center justify-between gap-3 animate-locoomo-fade-up">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
              Tracking Code
            </p>
            <div className="flex items-center gap-2">
              <p className="text-[16px] font-bold text-text-primary font-mono tracking-tight truncate">
                {delivery.trackingCode}
              </p>
              <button
                type="button"
                aria-label="Copy tracking code"
                onClick={handleCopyTrackingCode}
                className="shrink-0 w-6 h-6 rounded-[7px] text-text-muted hover:bg-bg-subtle hover:text-text-primary flex items-center justify-center transition-colors"
              >
                <CopyIcon size={13} />
              </button>
            </div>
          </div>
          <OrderStatusBadge status={delivery.status} className="shrink-0" />
        </Card>

        <div className="animate-locoomo-fade-up" style={{ animationDelay: "80ms" }}>
          <DeliveryJourneyCard
            originLabel={delivery.originNodeName}
            destinationLabel={delivery.destinationNodeName}
            status={delivery.status}
          />
        </div>

        <div className="animate-locoomo-fade-up" style={{ animationDelay: "160ms" }}>
          <OrderDetailsCard order={delivery} />
        </div>
      </div>
    </div>
  );
}
