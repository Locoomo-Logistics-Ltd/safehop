"use client";

import { safeTelHref } from "@/lib/safe-url";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Card } from "@/components/ui";
import { CheckCircleIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { formatDate, formatCurrency } from "@/lib/format";
import { getTodayHoursText } from "@/lib/opening-hours";
import { ROUTES, QUERY_KEYS } from "@/core/config/constants";
import { nodesService } from "@/core/api/services";
import { HANDLING_LABELS } from "@/core/types";
import { useDelivery } from "@/modules/user/hooks/use-delivery";
import { LabelInstructionsCard } from "./LabelInstructionsCard";
import { ShareTrackingButton } from "./ShareTrackingButton";

/**
 * "Order placed" + label screen — reached from `/orders/payment-callback`
 * once a paid `PaymentIntent` resolves to its Order.
 *
 * The next thing the sender has to do is write the tracking code and
 * destination on the parcel (`labelInstructions`) and take it to the
 * origin station — there are no printers and no QR code. So the label is
 * the headline, with the station's address, today's hours and phone right
 * below it.
 */
export function OrderSuccessScreen() {
  const params = useParams<{ id: string }>();
  const { delivery, isLoading } = useDelivery(params.id);

  const originNodeId = delivery?.originNodeId;
  const { data: originNode } = useQuery({
    queryKey: QUERY_KEYS.node(originNodeId ?? ""),
    queryFn: () => nodesService.getById(originNodeId!),
    enabled: !!originNodeId,
    staleTime: 5 * 60_000,
  });

  if (isLoading || !delivery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  const awaitingDropOff = delivery.status === "awaiting_drop_off";
  const hoursText = getTodayHoursText(originNode?.openingHours);
  const handling = delivery.parcel?.handling ?? [];

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
          {awaitingDropOff
            ? "Now label your parcel and take it to the station below."
            : "Your parcel is on its way through the network."}
        </p>

        {awaitingDropOff && delivery.labelInstructions && (
          <LabelInstructionsCard label={delivery.labelInstructions} />
        )}

        {awaitingDropOff && (
          <Card padding="lg" className="w-full mt-4 flex flex-col gap-3">
            <p className="text-[13px] font-semibold text-text-primary">Drop it off at</p>
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
                <MapPinIcon size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-text-primary">{delivery.originNodeName}</p>
                <p className="text-[12.5px] text-text-secondary leading-snug">{delivery.originNodeAddress}</p>
                {hoursText && <p className="text-[12px] text-text-muted mt-1">{hoursText}</p>}
              </div>
            </div>
            {originNode?.contactPhone && (
              <a
                href={safeTelHref(originNode.contactPhone)}
                className="flex items-center gap-2 text-[13px] font-medium text-brand-blue"
              >
                <PhoneIcon size={14} />
                {originNode.contactPhone}
              </a>
            )}
            {handling.length > 0 && (
              <p className="text-[12px] text-status-warning">
                Handle with care: {handling.map((h) => HANDLING_LABELS[h]).join(", ")}
              </p>
            )}
          </Card>
        )}

        <Card padding="lg" className="w-full mt-4 flex flex-col gap-5">
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

        <div className="flex flex-col gap-3 w-full mt-6">
          <Link href={ROUTES.track(delivery.id)}>
            <Button fullWidth size="lg">Track Package →</Button>
          </Link>
          {delivery.trackingUrl && (
            <ShareTrackingButton trackingUrl={delivery.trackingUrl} trackingCode={delivery.trackingCode} />
          )}
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
