import { Card } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { useRiderEarnings } from "@/modules/rider/hooks/use-rider-earnings";

/** Today's earnings + delivery count cards, matching the Figma rider dashboard stat row. */
export function EarningsStatCards() {
  const { earnings, isLoading } = useRiderEarnings();

  if (isLoading || !earnings) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="h-[80px] rounded-[14px] bg-bg-subtle animate-pulse" />
        <div className="h-[80px] rounded-[14px] bg-bg-subtle animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card padding="md">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
          Today&apos;s Earnings
        </p>
        <p className="font-display text-[22px] font-bold text-text-primary">
          {formatCurrency(earnings.todayEarnings)}
        </p>
      </Card>
      <Card padding="md">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
          Deliveries
        </p>
        <p className="font-display text-[22px] font-bold text-text-primary">
          {earnings.todayDeliveries}
        </p>
      </Card>
    </div>
  );
}
