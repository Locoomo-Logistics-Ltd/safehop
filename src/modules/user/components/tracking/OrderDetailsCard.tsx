import { Card } from "@/components/ui";
import {
  PackageIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  NavigationIcon,
  WalletIcon,
  ClockIcon,
} from "@/components/icons";
import { formatCurrency, formatRelativeDateTime } from "@/lib/format";
import type { Order, OrderParcelSize } from "@/core/types";

const PARCEL_SIZE_LABEL: Record<OrderParcelSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  extra_large: "Extra Large",
};

/**
 * The Track Package screen's order-details card — an icon-row list
 * grouped under one card with a highlighted "Amount Paid" receipt line
 * at the bottom, instead of the old plain label/value dash rows. Every
 * field is real (`Order` per `GET /orders/:id`) — this only adds
 * `receiverPhone`/`receiverEmail`/`parcelSize`, which the type already
 * carried but the old layout never rendered.
 */
export function OrderDetailsCard({ order }: { order: Order }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Order Details
        </p>
      </div>

      <div className="divide-y divide-border-default border-t border-border-default">
        <DetailRow
          icon={<PackageIcon size={15} />}
          label="Parcel"
          value={order.parcelDescription}
          tag={PARCEL_SIZE_LABEL[order.parcelSize]}
        />
        <DetailRow icon={<UserIcon size={15} />} label="Receiver" value={order.receiverFullName} />
        <DetailRow icon={<PhoneIcon size={15} />} label="Phone" value={order.receiverPhone} />
        <DetailRow icon={<MailIcon size={15} />} label="Email" value={order.receiverEmail} />
        <DetailRow icon={<MapPinIcon size={15} />} label="Origin" value={order.originNodeAddress} />
        <DetailRow icon={<NavigationIcon size={15} />} label="Destination" value={order.destinationNodeAddress} />
      </div>

      <div className="flex items-center justify-between gap-3 mx-5 my-4 px-4 py-3 rounded-[12px] bg-status-success-bg">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-[9px] bg-bg-card text-status-success flex items-center justify-center shrink-0">
            <WalletIcon size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] text-text-muted">Amount Paid</p>
            <p className="font-display font-bold text-[16px] text-status-success">
              {formatCurrency(order.amountKobo / 100)}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-text-muted flex items-center gap-1 justify-end">
            <ClockIcon size={11} />
            Placed
          </p>
          <p className="text-[12px] font-medium text-text-secondary">
            {formatRelativeDateTime(order.createdAt)}
          </p>
        </div>
      </div>
    </Card>
  );
}

function DetailRow({
  icon,
  label,
  value,
  tag,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tag?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <span className="w-8 h-8 rounded-[9px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-text-muted">{label}</p>
        <p className="text-[13px] font-medium text-text-primary truncate">{value}</p>
      </div>
      {tag && (
        <span className="text-[10px] font-semibold text-brand-blue bg-status-info-bg px-2 py-0.5 rounded-full shrink-0">
          {tag}
        </span>
      )}
    </div>
  );
}
