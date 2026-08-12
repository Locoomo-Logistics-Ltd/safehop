import { Card, RouteRail } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import type { PaymentIntentFeeBreakdown } from "@/core/types";

interface OrderSummaryCardProps {
  originLabel: string;
  destinationLabel: string;
  itemDescription: string;
  parcelSizeLabel: string;
  feeBreakdown: PaymentIntentFeeBreakdown;
  amountKobo: number;
}

/** Order summary card shown at the top of Checkout — rebuilt 2026-08-12 against `PaymentIntent.feeBreakdown` (kobo), replacing the old naira `DeliveryQuote` shape from the undocumented calculate-fare flow. */
export function OrderSummaryCard({
  originLabel,
  destinationLabel,
  itemDescription,
  parcelSizeLabel,
  feeBreakdown,
  amountKobo,
}: OrderSummaryCardProps) {
  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-text-muted mb-2">
          Order Summary
        </p>
        <RouteRail originLabel={originLabel} destinationLabel={destinationLabel} progress={0} />
        <div className="flex items-center justify-between text-[12px] text-text-muted mt-1.5">
          <span>{originLabel}</span>
          <span>{destinationLabel}</span>
        </div>
      </div>

      <div className="h-px bg-border-default" />

      <div className="flex flex-col gap-2 text-[13px]">
        <Row label="Item type" value={itemDescription} />
        <Row label="Parcel size" value={parcelSizeLabel} />
      </div>

      <div className="h-px bg-border-default" />

      <div className="flex flex-col gap-2 text-[13px]">
        <Row label="Base fee" value={formatCurrency(feeBreakdown.baseFeeKobo / 100)} />
        <Row label="Distance" value={`${feeBreakdown.distanceKm.toFixed(1)} km`} />
        <Row label="Per-km rate" value={`${formatCurrency(feeBreakdown.perKmRateKobo / 100)} / km`} />
      </div>

      <div className="h-px bg-border-default" />

      <div className="flex items-center justify-between">
        <span className="text-[14px] font-semibold text-text-primary">Total Amount</span>
        <span className="text-[18px] font-bold text-brand-blue font-display">
          {formatCurrency(amountKobo / 100)}
        </span>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary capitalize">{value}</span>
    </div>
  );
}
