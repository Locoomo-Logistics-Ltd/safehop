import { Card, RouteRail } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import type { DeliveryQuote } from "@/core/types";

interface OrderSummaryCardProps {
  originLabel: string;
  destinationLabel: string;
  itemDescription: string;
  deliveryTypeLabel: string;
  quote: DeliveryQuote;
}

/** Order summary card shown at the top of Checkout, matching Figma. */
export function OrderSummaryCard({
  originLabel,
  destinationLabel,
  itemDescription,
  deliveryTypeLabel,
  quote,
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
        <Row label="Delivery type" value={deliveryTypeLabel} />
      </div>

      <div className="h-px bg-border-default" />

      <div className="flex flex-col gap-2 text-[13px]">
        <Row label="Base fare" value={formatCurrency(quote.baseFare)} />
        {quote.expressSurcharge > 0 && (
          <Row label="Express surcharge" value={formatCurrency(quote.expressSurcharge)} />
        )}
        <Row label="Insurance" value={formatCurrency(quote.insurance)} />
      </div>

      <div className="h-px bg-border-default" />

      <div className="flex items-center justify-between">
        <span className="text-[14px] font-semibold text-text-primary">Total Amount</span>
        <span className="text-[18px] font-bold text-brand-blue font-display">
          {formatCurrency(quote.total)}
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
