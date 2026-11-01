import { Card } from "@/components/ui";
import { TruckIcon } from "@/components/icons";
import type { OrderDelivery } from "@/core/types";

/** Who is moving the parcel right now. Senders never get the courier's phone (the API omits it), so there's nothing to call from here. */
export function DeliveryInfoCard({ delivery }: { delivery: OrderDelivery }) {
  const isReturn = delivery.type === "return";
  const courierName = delivery.courier?.name;

  return (
    <Card padding="md" className="mb-4">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
          <TruckIcon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            {isReturn ? "Returning with" : "Carried by"}
          </p>
          <p className="text-[14px] font-semibold text-text-primary truncate">{delivery.providerLabel}</p>
        </div>
        {delivery.etaMinutes !== null && delivery.status !== "delivered" && delivery.status !== "returned" && (
          <span className="text-[12px] font-semibold text-brand-blue bg-status-info-bg px-2.5 py-1 rounded-full shrink-0">
            ~{delivery.etaMinutes} min
          </span>
        )}
      </div>

      <p className="text-[13px] text-text-secondary mt-3 leading-snug">
        {courierName
          ? `${courierName}${delivery.courier?.vehicle ? ` · ${delivery.courier.vehicle}` : ""}`
          : delivery.status === "requested"
            ? "Finding a courier for your parcel…"
            : "A courier will be assigned shortly."}
        {delivery.attemptNumber > 1 && " · Rebooked with a new courier"}
      </p>
    </Card>
  );
}
