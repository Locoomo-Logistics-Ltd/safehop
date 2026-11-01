import { Card } from "@/components/ui";
import { safeTelHref } from "@/lib/safe-url";
import { HandoffStatusPill } from "@/components/ui/HandoffStatusPill";
import { PhoneIcon } from "@/components/icons";
import { HANDLING_LABELS, type NodeOrderSummary } from "@/core/types";

/**
 * The parcel at the counter: what staff need to match the physical thing
 * in front of them — handling warnings, shelf, a masked receiver, and
 * who is carrying it. Handling chips show on every counter screen
 * (docs/LOGISTICS_API.md §5.3); the shelf number is the big one because
 * staff write it on the parcel at drop-off and intake.
 */
export function CounterOrderCard({ order }: { order: NodeOrderSummary }) {
  const parcel = order.parcel;
  const hasDimensions = !!(parcel?.lengthCm && parcel.widthCm && parcel.heightCm);
  const courier = order.delivery?.courier;

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Parcel</p>
          <p className="font-mono text-[20px] font-bold text-text-primary tracking-tight break-all">
            {order.trackingCode}
          </p>
        </div>
        <HandoffStatusPill status={order.status} className="shrink-0" />
      </div>

      {order.shelfNumber != null && (
        <div className="flex items-center gap-4 rounded-[12px] bg-status-info-bg px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Shelf</p>
            <p className="font-display text-[34px] leading-none font-bold text-brand-blue">
              {order.shelfNumber}
            </p>
          </div>
          <p className="text-[12.5px] text-text-secondary leading-snug">
            Where this parcel sits on your shelf. Write it on the parcel.
          </p>
        </div>
      )}

      {!!parcel?.handling.length && (
        <div className="flex flex-wrap gap-2" aria-label="Handling">
          {parcel.handling.map((flag) => (
            <span
              key={flag}
              className="text-[12px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-status-warning-bg text-status-warning"
            >
              {HANDLING_LABELS[flag]}
            </span>
          ))}
        </div>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
        <dt className="text-text-muted">Contents</dt>
        <dd className="font-medium text-text-primary text-right">{order.parcelDescription}</dd>

        <dt className="text-text-muted">Size</dt>
        <dd className="font-medium text-text-primary text-right capitalize">
          {order.parcelSize.replace("_", " ")}
          {parcel?.weightKg ? ` · ${parcel.weightKg} kg` : ""}
          {hasDimensions ? ` · ${parcel!.lengthCm}×${parcel!.widthCm}×${parcel!.heightCm} cm` : ""}
        </dd>

        <dt className="text-text-muted">Route</dt>
        <dd className="font-medium text-text-primary text-right">
          {order.originNodeName} → {order.destinationNodeName}
        </dd>

        {order.receiverMasked && (
          <>
            <dt className="text-text-muted">Receiver</dt>
            <dd className="font-medium text-text-primary text-right">{order.receiverMasked}</dd>
          </>
        )}

        {order.delivery && (
          <>
            <dt className="text-text-muted">{order.delivery.type === "return" ? "Returning with" : "Carried by"}</dt>
            <dd className="font-medium text-text-primary text-right">
              {order.delivery.providerLabel}
              {order.delivery.etaMinutes !== null ? ` · ~${order.delivery.etaMinutes} min` : ""}
            </dd>
          </>
        )}
      </dl>

      {courier && (courier.name || courier.phone) && (
        <div className="flex items-center justify-between gap-3 rounded-[12px] border border-border-default px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-text-primary truncate">{courier.name ?? "Courier"}</p>
            {courier.vehicle && <p className="text-[12px] text-text-muted capitalize">{courier.vehicle}</p>}
          </div>
          {courier.phone && (
            <a
              href={safeTelHref(courier.phone)}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-blue shrink-0"
              aria-label={`Call ${courier.name ?? "the courier"}`}
            >
              <PhoneIcon size={14} />
              Call
            </a>
          )}
        </div>
      )}
    </Card>
  );
}
