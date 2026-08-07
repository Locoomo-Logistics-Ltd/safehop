"use client";

import { useParams } from "next/navigation";
import { TopBar } from "@/components/layout";
import { Card, StatusBadge, RouteRail, Button, EmptyState } from "@/components/ui";
import { AlertTriangleIcon, MapPinIcon } from "@/components/icons";
import { TrackingTimeline } from "@/modules/user/components/tracking";
import { useAdminOrderDetail } from "@/modules/admin/hooks/use-admin-order-detail";
import { OrderPartyCard } from "./OrderPartyCard";
import { OrderPaymentCard } from "./OrderPaymentCard";
import { OrderNodeCard } from "./OrderNodeCard";

/** "Order Details" — matches admin_UI.png. */
export function OrderDetailsScreen() {
  const params = useParams<{ id: string }>();
  const { order, isLoading } = useAdminOrderDetail(params.id);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <TopBar title="Order Details" showBack />
        <p className="text-[13px] text-text-muted text-center py-16">Loading order…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen">
        <TopBar title="Order Details" showBack />
        <div className="px-4 md:px-6 pt-8">
          <EmptyState
            icon={<AlertTriangleIcon size={22} />}
            title="Order details unavailable"
            description="We couldn't find details for this order. It may have been removed, or the link may be incorrect."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar title={order.trackingCode} showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
              Order Tracking ID
            </p>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-[22px] font-bold text-text-primary">{order.trackingCode}</h1>
              <StatusBadge status={order.status} />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<AlertTriangleIcon size={14} />}
            className="border-status-danger text-status-danger hover:bg-status-danger-bg"
          >
            Flag Issue
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <OrderPartyCard role="Sender" name={order.customerName} phone={order.customerPhone} email={order.customerEmail} />
              <OrderPartyCard role="Receiver" name={order.destinationLabel} phone={order.customerPhone} />
            </div>

            <Card padding="md">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-3">Route</p>
              <RouteRail originLabel={order.originLabel} destinationLabel={order.destinationLabel} progress={0.5} variant="full" />
              <div className="flex items-center justify-between mt-2 text-[12px] text-text-secondary">
                <span>{order.originLabel}</span>
                <span>{order.destinationLabel}</span>
              </div>

              <div className="h-[160px] mt-4 rounded-[12px] bg-bg-subtle flex flex-col items-center justify-center gap-2 text-text-muted">
                <MapPinIcon size={20} />
                <p className="text-[12px] px-6 text-center leading-[1.5]">
                  Live route map coming soon.
                </p>
              </div>
            </Card>

            <Card padding="md">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-4">Order Timeline</p>
              {order.timeline.length === 0 ? (
                <p className="text-[13px] text-text-muted">No timeline events yet.</p>
              ) : (
                <TrackingTimeline events={order.timeline} />
              )}
            </Card>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <OrderPaymentCard
              amount={order.amount}
              methodLabel={order.paymentMethodLabel}
              reference={order.paymentReference}
              isPaid={order.status !== "draft" && order.status !== "pending_payment"}
            />
            <OrderNodeCard nodeName={order.originNodeName} riderName={order.assignedRiderName} />
          </div>
        </div>
      </div>
    </div>
  );
}
