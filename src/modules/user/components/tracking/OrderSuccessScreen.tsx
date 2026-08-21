"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { CheckCircleIcon, ShareIcon } from "@/components/icons";
import { formatDate, formatCurrency } from "@/lib/format";
import { ROUTES } from "@/core/config/constants";
import { useDelivery } from "@/modules/user/hooks/use-delivery";
import { QrCodeBlock } from "./QrCodeBlock";

/**
 * "Order Placed Successfully" confirmation screen — reached from
 * `/orders/payment-callback` once a paid `PaymentIntent` resolves to a
 * real Order (`GET /orders/:id`), not directly from Checkout anymore
 * (rebuilt 2026-08-12 — payment now happens on Paystack's hosted page
 * in between). The real Order has no fee breakdown (only
 * `PaymentIntent.feeBreakdown` does) and no `collectionQrCode`/
 * `qrNonce`, so this shows the total paid and a QR of the tracking
 * code alone.
 */
export function OrderSuccessScreen() {
  const params = useParams<{ id: string }>();
  const { delivery, isLoading } = useDelivery(params.id);

  if (isLoading || !delivery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-canvas flex flex-col items-center px-4 md:px-6 py-10">
      <div className="w-full max-w-[420px] flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mb-5">
          <CheckCircleIcon size={32} />
        </div>

        <h1 className="font-display text-[20px] font-bold text-text-primary text-center">
          Order Placed Successfully
        </h1>
        <p className="text-[14px] text-text-secondary text-center mt-1.5 mb-7">
          Your shipment is ready for dispatch.
        </p>

        <Card padding="lg" className="w-full flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Order Receipt
              </p>
              <p className="text-[15px] font-bold text-text-primary font-mono mt-0.5">
                {delivery.trackingCode}
              </p>
            </div>
            <p className="text-[12px] text-text-muted">{formatDate(delivery.createdAt)}</p>
          </div>

          <div className="h-px bg-border-default" />

          <div className="flex flex-col gap-2 text-[13px]">
            <Row label="Route" value={`${delivery.originNodeName} → ${delivery.destinationNodeName}`} />
            <Row label="Receiver" value={delivery.receiverFullName} />
            <Row label="Parcel" value={delivery.parcelDescription} />
          </div>

          <div className="h-px bg-border-default" />

          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-text-primary">Total Paid</span>
            <span className="text-[18px] font-bold text-brand-blue font-display">
              {formatCurrency(delivery.amountKobo / 100)}
            </span>
          </div>
        </Card>

        <Card padding="lg" className="w-full mt-4 flex flex-col items-center">
          <p className="text-[13px] font-semibold text-text-primary mb-1">Drop-off QR Code</p>
          <p className="text-[12px] text-text-muted text-center mb-2">
            Show this at {delivery.originNodeName} to drop off your parcel
          </p>
          <QrCodeBlock value={delivery.trackingCode} />
        </Card>

        <div className="flex flex-col gap-3 w-full mt-6">
          <Link href={ROUTES.track(delivery.id)}>
            <Button fullWidth size="lg">Track Package →</Button>
          </Link>
          <Button fullWidth size="lg" variant="outline" leftIcon={<ShareIcon size={16} />}>
            Share with Receiver
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary text-right">{value}</span>
    </div>
  );
}
