import { Card } from "@/components/ui";
import { formatCurrency } from "@/lib/format";

interface OrderPaymentCardProps {
  amount: number;
  methodLabel: string;
  reference: string;
  isPaid: boolean;
}

export function OrderPaymentCard({ amount, methodLabel, reference, isPaid }: OrderPaymentCardProps) {
  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Payment Status</p>
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            color: isPaid ? "var(--status-success)" : "var(--status-warning)",
            background: isPaid ? "var(--status-success-bg)" : "var(--status-warning-bg)",
          }}
        >
          {isPaid ? "Paid" : "Pending"}
        </span>
      </div>

      <p className="font-display font-bold text-[26px] text-text-primary mb-4">{formatCurrency(amount)}</p>

      <div className="flex flex-col gap-2 text-[12px]">
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Payment Method</span>
          <span className="text-text-primary font-medium">{methodLabel}</span>
        </div>
        <div className="h-px bg-border-default" />
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Reference</span>
          <span className="text-text-primary font-medium">{reference}</span>
        </div>
      </div>
    </Card>
  );
}
