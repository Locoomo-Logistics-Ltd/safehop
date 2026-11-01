"use client";

import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { AdminSelect } from "@/modules/admin/components/shared/AdminSelect";
import { formatCurrency, formatRelativeDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAdminDeliveries, useDeliveryAction, useLogisticsProviders } from "@/modules/admin/hooks/use-admin-logistics";
import type { AdminDelivery, DeliveryLegStatus } from "@/core/types";
import { LogisticsLayout } from "./LogisticsLayout";

const STATUSES: DeliveryLegStatus[] = ["requested", "assigned", "picked_up", "delivered", "returning", "returned", "cancelled"];
const kobo = (v: number | null) => (v === null ? "—" : formatCurrency(v / 100));

const STATUS_TONE: Record<DeliveryLegStatus, string> = {
  requested: "bg-status-warning-bg text-status-warning",
  assigned: "bg-status-info-bg text-status-info",
  picked_up: "bg-status-info-bg text-status-info",
  delivered: "bg-status-success-bg text-status-success",
  returning: "bg-status-warning-bg text-status-warning",
  returned: "bg-status-success-bg text-status-success",
  cancelled: "bg-status-neutral-bg text-status-neutral",
};

/**
 * "Deliveries" — every courier booking (GET /admin/logistics/deliveries).
 * One order can have several: retries, a fallback to Locoomo riders, and
 * the return leg. Filter by tracking code to see an order's whole courier
 * history. Retry / Fallback / Reconcile are the Admin's levers.
 */
export function DeliveriesScreen() {
  const [trackingCode, setTrackingCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [status, setStatus] = useState<DeliveryLegStatus | "">("");
  const [provider, setProvider] = useState("");
  const [stuck, setStuck] = useState(false);
  const [page, setPage] = useState(1);

  const { providers } = useLogisticsProviders();
  const { deliveries, total, limit, isLoading, isError, refetch } = useAdminDeliveries({
    trackingCode: appliedCode || undefined,
    status: status || undefined,
    provider: provider || undefined,
    stuck: stuck || undefined,
    page,
  });
  const { run, pendingId } = useDeliveryAction();
  const lastPage = Math.max(1, Math.ceil(total / limit));

  const reset = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <LogisticsLayout
      title="Deliveries"
      description="Every courier booking. A booking with no external id that's still “requested” never reached the courier — retry it. Refreshes every 30 seconds."
    >
      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end mb-5"
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedCode(trackingCode.trim());
          setPage(1);
        }}
      >
        <Input
          label="Tracking code"
          placeholder="LCM-… (any format)"
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
        />
        <AdminSelect label="Status" value={status} onChange={(e) => reset(setStatus)(e.target.value as DeliveryLegStatus | "")}>
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect label="Courier" value={provider} onChange={(e) => reset(setProvider)(e.target.value)}>
          <option value="">All</option>
          {providers.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </AdminSelect>
        <label className="flex items-center gap-2.5 text-[13px] text-text-primary h-10">
          <input type="checkbox" className="w-4 h-4" checked={stuck} onChange={(e) => reset(setStuck)(e.target.checked)} />
          Stuck (nothing heard 30+ min)
        </label>
        <Button type="submit" size="sm" variant="outline">
          Search
        </Button>
      </form>

      {isLoading ? (
        <p className="text-[13px] text-text-muted text-center py-10">Loading deliveries…</p>
      ) : isError ? (
        <ErrorAlert title="Couldn't load deliveries" message="Check your connection and try again." />
      ) : deliveries.length === 0 ? (
        <Card padding="md">
          <p className="text-[13px] text-text-muted text-center py-6">No deliveries match these filters.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {deliveries.map((d) => (
            <DeliveryRow key={d.id} delivery={d} busy={pendingId === d.id} onAction={(action) => run({ id: d.id, action })} />
          ))}

          <div className="flex items-center justify-between pt-2">
            <p className="text-[12px] text-text-muted">
              {total} booking{total === 1 ? "" : "s"} · page {page} of {lastPage}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
              <Button size="sm" variant="ghost" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
          </div>
        </div>
      )}
    </LogisticsLayout>
  );
}

function DeliveryRow({
  delivery: d,
  busy,
  onAction,
}: {
  delivery: AdminDelivery;
  busy: boolean;
  onAction: (action: "retry" | "fallback" | "reconcile") => void;
}) {
  // Mirrors the API's own refusals (docs/LOGISTICS_API.md §8.5) so a button
  // that can only fail is never offered.
  const neverReachedCourier = d.externalId === null && d.status === "requested";
  const final = ["delivered", "returned", "cancelled"].includes(d.status);
  const pickedUp = ["picked_up", "delivered", "returning", "returned"].includes(d.status);
  const isCourier = d.provider !== "in_house";

  return (
    <Card padding="md" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[14px] font-bold text-text-primary">{d.orderTrackingCode}</p>
          <p className="text-[12px] text-text-muted">
            {d.providerLabel} · {d.legType} leg · attempt {d.attemptNumber}
            {d.vehicleClass ? ` · ${d.vehicleClass}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-bg-subtle text-text-secondary">
            order: {d.orderStatus.replaceAll("_", " ")}
          </span>
          <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", STATUS_TONE[d.status])}>
            {d.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-[12.5px]">
        <Fact label="Courier" value={d.courierName ?? "—"} sub={d.courierPhone ?? undefined} />
        <Fact label="External id" value={d.externalId ?? "none"} sub={d.providerStatus ? `raw: ${d.providerStatus}` : undefined} />
        <Fact label="Quoted" value={kobo(d.quotedKobo)} sub={d.actualKobo !== null ? `actual ${kobo(d.actualKobo)}` : undefined} />
        <Fact label="Surcharge" value={kobo(d.surchargeKobo)} />
      </dl>

      {neverReachedCourier && (
        <p className="text-[12.5px] text-status-warning" role="status">
          The courier never received this booking — retry it.
        </p>
      )}
      {d.failureReason && <p className="text-[12.5px] text-text-muted">Reason: {d.failureReason.replaceAll("_", " ")}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-text-muted">
          Created {formatRelativeDateTime(d.createdAt)} · updated {formatRelativeDateTime(d.updatedAt)}
          {d.endedAt ? ` · ended ${formatRelativeDateTime(d.endedAt)}` : ""}
        </p>
        {!final && (
          <div className="flex gap-2">
            {neverReachedCourier && (
              <Button size="sm" variant="outline" isLoading={busy} onClick={() => onAction("retry")}>
                Retry
              </Button>
            )}
            {isCourier && !pickedUp && (
              <Button
                size="sm"
                variant="outline"
                isLoading={busy}
                onClick={() => {
                  if (window.confirm("Take this off the courier and give it to Locoomo riders?")) onAction("fallback");
                }}
              >
                Fall back to riders
              </Button>
            )}
            {isCourier && (
              <Button size="sm" variant="outline" isLoading={busy} onClick={() => onAction("reconcile")}>
                Reconcile
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function Fact({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-text-muted">{label}</dt>
      <dd className="font-semibold text-text-primary truncate">{value}</dd>
      {sub && <dd className="text-[11px] text-text-muted truncate">{sub}</dd>}
    </div>
  );
}
