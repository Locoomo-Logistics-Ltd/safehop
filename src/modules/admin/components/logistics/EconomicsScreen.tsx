"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { StatCard } from "@/modules/admin/components/shared/StatCard";
import { AdminSelect } from "@/modules/admin/components/shared/AdminSelect";
import { PackageIcon, WalletIcon, TruckIcon, BarChartIcon } from "@/components/icons";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useEconomics, useLogisticsProviders } from "@/modules/admin/hooks/use-admin-logistics";
import { LogisticsLayout } from "./LogisticsLayout";

const kobo = (v: number) => formatCurrency(v / 100);

/** "Economics" — per-order courier economics (GET /admin/logistics/economics). Margin = what was set aside for whoever carries the parcel, minus what the courier cost. */
export function EconomicsScreen() {
  const [provider, setProvider] = useState("");
  const [page, setPage] = useState(1);
  const { providers } = useLogisticsProviders();
  const { data, isLoading, isError } = useEconomics({ provider: provider || undefined, page });
  const lastPage = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <LogisticsLayout
      title="Economics"
      description="What customers paid, what the courier cost, and the margin on each order. Totals cover the whole filter, not just this page."
      actions={
        <div className="w-44">
          <AdminSelect
            aria-label="Courier"
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All couriers</option>
            {providers.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </AdminSelect>
        </div>
      }
    >
      {isLoading ? (
        <p className="text-[13px] text-text-muted text-center py-10">Loading economics…</p>
      ) : isError || !data ? (
        <ErrorAlert title="Couldn't load economics" message="Check your connection and try again." />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard label="Orders" value={data.totals.orders} icon={<PackageIcon size={16} />} />
            <StatCard label="Customers paid" value={kobo(data.totals.customerPaidKobo)} icon={<WalletIcon size={16} />} iconTone="success" />
            <StatCard label="Courier cost" value={kobo(data.totals.courierCostKobo)} icon={<TruckIcon size={16} />} iconTone="warning" />
            <StatCard
              label="Margin"
              value={kobo(data.totals.marginKobo)}
              icon={<BarChartIcon size={16} />}
              iconTone={data.totals.marginKobo < 0 ? "danger" : "success"}
              deltaLabel={data.totals.marginKobo < 0 ? "Couriers cost more than budgeted" : undefined}
              deltaTone="danger"
            />
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-text-muted bg-bg-subtle">
                    <th className="font-medium px-5 py-2.5">Order</th>
                    <th className="font-medium px-5 py-2.5">Couriers</th>
                    <th className="font-medium px-5 py-2.5 text-right">Customer paid</th>
                    <th className="font-medium px-5 py-2.5 text-right">Delivery fee</th>
                    <th className="font-medium px-5 py-2.5 text-right">Courier cost</th>
                    <th className="font-medium px-5 py-2.5 text-right">Allocation</th>
                    <th className="font-medium px-5 py-2.5 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-[13px] text-text-muted">
                        No orders for this filter.
                      </td>
                    </tr>
                  ) : (
                    data.items.map((row) => (
                      <tr key={row.orderId} className="border-t border-border-default">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <p className="font-mono text-[13px] font-semibold text-text-primary">{row.orderTrackingCode}</p>
                          <p className="text-[11px] text-text-muted">
                            {row.orderStatus.replaceAll("_", " ")} · {formatDate(row.createdAt)}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-[12.5px] text-text-secondary">
                          {row.providers.join(", ") || "—"}
                          {!row.settled && <span className="block text-[11px] text-text-muted">not settled</span>}
                        </td>
                        <td className="px-5 py-3 text-[13px] text-right whitespace-nowrap">{kobo(row.customerPaidKobo)}</td>
                        <td className="px-5 py-3 text-[13px] text-right whitespace-nowrap">{kobo(row.deliveryFeeKobo)}</td>
                        <td className="px-5 py-3 text-[13px] text-right whitespace-nowrap">{kobo(row.courierCostKobo)}</td>
                        <td className="px-5 py-3 text-[13px] text-right whitespace-nowrap">
                          {kobo(row.courierAllocationKobo)}
                          {row.allocationEstimated && (
                            <span className="block text-[11px] text-text-muted" title="No revenue-split entry yet; computed from the current split">
                              estimated
                            </span>
                          )}
                        </td>
                        <td
                          className={cn(
                            "px-5 py-3 text-[13px] font-semibold text-right whitespace-nowrap",
                            row.marginKobo < 0 ? "text-status-danger" : "text-text-primary"
                          )}
                        >
                          {kobo(row.marginKobo)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex items-center justify-between pt-4">
            <p className="text-[12px] text-text-muted">
              Page {page} of {lastPage}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </LogisticsLayout>
  );
}
