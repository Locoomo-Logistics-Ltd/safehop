"use client";

import { useParams } from "next/navigation";
import { Card, RouteRail } from "@/components/ui";
import { TopBar } from "@/components/layout";
import { useDelivery } from "@/modules/user/hooks/use-delivery";
import { getOrderProgress, OrderStatusBadge } from "./OrderStatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";

/**
 * Tracking screen — route progress + order details.
 *
 * Rebuilt 2026-08-12 against the real `Order` type (`GET /orders/:id`).
 * The previous version rendered a `TrackingHistory`/`TrackingTimeline`
 * event-by-event log — the real Order response has no such field
 * (only `status`, a single current value), so that section is dropped
 * rather than fabricated. Re-add it if a real order-events endpoint is
 * ever confirmed against docs/API.md.
 */
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
        <p className="font-semibold text-text-primary mb-1">Order not found</p>
        <p className="text-[13px] text-text-secondary">
          This tracking link may be invalid or expired.
        </p>
      </div>
    );
  }

  const progress = getOrderProgress(delivery.status);

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
          <OrderStatusBadge status={delivery.status} />
        </Card>

        {/* Route overview */}
        <Card padding="md" className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-3">
            Route Overview
          </p>
          <RouteRail
            originLabel={delivery.originNodeName}
            destinationLabel={delivery.destinationNodeName}
            progress={progress}
            variant="full"
          />
          <div className="flex items-center justify-between text-[12px] text-text-secondary mt-2 font-medium">
            <span>{delivery.originNodeName}</span>
            <span>{delivery.destinationNodeName}</span>
          </div>
        </Card>

        {/* Order details */}
        <Card padding="lg">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-4">
            Order Details
          </p>
          <div className="flex flex-col gap-2.5 text-[13px]">
            <DetailRow label="Receiver" value={delivery.receiverFullName} />
            <DetailRow label="Parcel" value={delivery.parcelDescription} />
            <DetailRow label="Origin address" value={delivery.originNodeAddress} />
            <DetailRow label="Destination address" value={delivery.destinationNodeAddress} />
            <DetailRow label="Amount paid" value={formatCurrency(delivery.amountKobo / 100)} />
            <DetailRow label="Placed" value={formatDate(delivery.createdAt)} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary text-right">{value}</span>
    </div>
  );
}
