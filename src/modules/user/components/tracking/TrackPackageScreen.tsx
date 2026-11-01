"use client";

import { useParams } from "next/navigation";
import { Card } from "@/components/ui";
import { CopyIcon } from "@/components/icons";
import { TopBar } from "@/components/layout";
import { useDelivery, useOrderTimeline } from "@/modules/user/hooks/use-delivery";
import { isReturnStatus } from "@/lib/order-status";
import { useNotificationStore } from "@/store/notification.store";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { DeliveryJourneyCard } from "./DeliveryJourneyCard";
import { OrderDetailsCard } from "./OrderDetailsCard";
import { OrderTimelineCard } from "./OrderTimelineCard";
import { DeliveryInfoCard } from "./DeliveryInfoCard";
import { ShareTrackingButton } from "./ShareTrackingButton";

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
  const { data: timeline, isLoading: timelineLoading } = useOrderTimeline(params.id, delivery?.status);

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

        {isReturnStatus(delivery.status) ? (
          <ReturnBanner
            status={delivery.status}
            nodeName={delivery.originNodeName}
            nodeAddress={delivery.originNodeAddress}
          />
        ) : (
          <div className="animate-locoomo-fade-up" style={{ animationDelay: "80ms" }}>
            <DeliveryJourneyCard
              originLabel={delivery.originNodeName}
              destinationLabel={delivery.destinationNodeName}
              status={delivery.status}
            />
          </div>
        )}

        {delivery.status === "awaiting_drop_off" && (
          <Card padding="md" className="mb-4">
            <p className="text-[13px] font-semibold text-text-primary mb-1">Drop-off pending</p>
            <p className="text-[12.5px] text-text-secondary leading-[1.6]">
              Write <span className="font-mono font-semibold">{delivery.trackingCode}</span> and the destination on
              your parcel, then take it to {delivery.originNodeName}, {delivery.originNodeAddress}.
            </p>
          </Card>
        )}

        {delivery.delivery && delivery.delivery.status !== "cancelled" && (
          <div className="animate-locoomo-fade-up" style={{ animationDelay: "120ms" }}>
            <DeliveryInfoCard delivery={delivery.delivery} />
          </div>
        )}

        <OrderTimelineCard entries={timeline} isLoading={timelineLoading} />

        <div className="animate-locoomo-fade-up" style={{ animationDelay: "160ms" }}>
          <OrderDetailsCard order={delivery} />
        </div>

        {delivery.trackingUrl && (
          <ShareTrackingButton
            className="mt-4"
            trackingUrl={delivery.trackingUrl}
            trackingCode={delivery.trackingCode}
          />
        )}
      </div>
    </div>
  );
}

/**
 * A failed delivery comes back to the **origin** station, where the sender
 * collects it with an emailed code. Same wording as the API's own return
 * statuses; the copy only decides what the sender should do next.
 */
function ReturnBanner({
  status,
  nodeName,
  nodeAddress,
}: {
  status: string;
  nodeName: string;
  nodeAddress: string;
}) {
  const ready = status === "ready_for_sender_collection";
  const done = status === "return_completed";

  return (
    <Card padding="md" className="mb-4 border border-status-warning">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-status-warning mb-1">
        Delivery couldn&apos;t be completed
      </p>
      <p className="text-[14px] font-semibold text-text-primary mb-1">
        {done
          ? "You collected your parcel"
          : ready
            ? `Collect your parcel from ${nodeName}`
            : `Your parcel is coming back to ${nodeName}`}
      </p>
      <p className="text-[12.5px] text-text-secondary leading-[1.6]">
        {done
          ? "This order is closed."
          : ready
            ? `${nodeAddress}. We've emailed you a collection code — bring it and an ID. The code is valid for 60 minutes; ask the station to resend it if it lapses.`
            : "We'll email you a collection code once it's back and checked in."}
      </p>
    </Card>
  );
}
