import { Card, RouteRail } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { HANDLING_LABELS, type HandlingFlag, type PaymentIntentFeeBreakdown, type VehicleClass } from "@/core/types";

interface OrderSummaryCardProps {
  originLabel: string;
  destinationLabel: string;
  itemDescription: string;
  parcelSizeLabel: string;
  weightKg?: number;
  dimensionsLabel?: string;
  handling?: HandlingFlag[];
  vehicleClass: VehicleClass;
  estimatedDeliveryMinutes: number;
  feeBreakdown: PaymentIntentFeeBreakdown;
  amountKobo: number;
}

/**
 * Order summary at the top of Checkout, built from the price preview
 * (`POST /delivery-quotes`). The vehicle line is deliberately visible:
 * a bigger parcel switches vehicle and the price jumps, which should be
 * explained rather than surprising.
 */
export function OrderSummaryCard({
  originLabel,
  destinationLabel,
  itemDescription,
  parcelSizeLabel,
  weightKg,
  dimensionsLabel,
  handling,
  vehicleClass,
  estimatedDeliveryMinutes,
  feeBreakdown,
  amountKobo,
}: OrderSummaryCardProps) {
  const deliveryFee = feeBreakdown.deliveryFeeKobo ?? feeBreakdown.totalKobo - (feeBreakdown.destinationFeeKobo ?? 0);

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
        <Row label="Item" value={itemDescription} />
        <Row label="Parcel size" value={parcelSizeLabel} />
        {weightKg !== undefined && <Row label="Weight" value={`${weightKg} kg`} />}
        {dimensionsLabel && <Row label="Dimensions" value={dimensionsLabel} />}
        {!!handling?.length && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-text-muted">Handling</span>
            <span className="flex flex-wrap justify-end gap-1.5">
              {handling.map((flag) => (
                <span
                  key={flag}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-status-warning-bg text-status-warning"
                >
                  {HANDLING_LABELS[flag]}
                </span>
              ))}
            </span>
          </div>
        )}
      </div>

      <div className="rounded-[12px] bg-status-info-bg px-3.5 py-3 text-[12.5px] text-text-secondary leading-snug">
        Goes by <span className="font-semibold text-text-primary">{vehicleClass}</span> — about{" "}
        {estimatedDeliveryMinutes} min after drop-off. Estimated, not guaranteed.
      </div>

      <div className="h-px bg-border-default" />

      <div className="flex flex-col gap-2 text-[13px]">
        <Row label="Base fee" value={formatCurrency(feeBreakdown.baseFeeKobo / 100)} />
        <Row
          label={feeBreakdown.distanceSource === "estimate" ? "Distance (estimated)" : "Distance"}
          value={`${feeBreakdown.distanceKm.toFixed(1)} km`}
        />
        <Row label="Per-km rate" value={`${formatCurrency(feeBreakdown.perKmRateKobo / 100)} / km`} />
        <Row label="Delivery" value={formatCurrency(deliveryFee / 100)} />
        {!!feeBreakdown.destinationFeeKobo && (
          <Row label="Collection station fee" value={formatCurrency(feeBreakdown.destinationFeeKobo / 100)} />
        )}
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary text-right">{value}</span>
    </div>
  );
}
