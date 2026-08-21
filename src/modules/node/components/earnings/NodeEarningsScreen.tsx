"use client";

import { RootTopBar } from "@/components/layout";
import { Card, EmptyState } from "@/components/ui";
import { WalletIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { useNodeEarnings } from "@/modules/node/hooks/use-node-earnings";

/**
 * "Earnings" — this Node's own revenue-split entries, `GET
 * /earnings/my-node`. Only appears for orders where this Node was the
 * *origin* (the full Node share always goes to the origin Node, never
 * split with the destination) — read-only, same as the Rider/Admin
 * views; the actual payout stays off-system.
 *
 * Promoted from a Node Profile row to its own `NODE_NAV_ITEMS` tab
 * 2026-08-21 — same route (`ROUTES.nodeEarnings`), now reached in one
 * tap. `RootTopBar` replaces the old back-button `TopBar` accordingly,
 * matching every other root/tab screen's convention (and the Rider
 * module's own Earnings screen, which made the same switch when its
 * tab was added).
 */
export function NodeEarningsScreen() {
  const { entries, isLoading } = useNodeEarnings();

  const totalKobo = entries.reduce((sum, e) => sum + e.amountKobo, 0);
  const pendingKobo = entries
    .filter((e) => e.payoutStatus === "pending")
    .reduce((sum, e) => sum + e.amountKobo, 0);

  return (
    <div className="min-h-screen bg-bg-canvas">
      <RootTopBar profileHref={ROUTES.nodeProfile} />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-10 max-w-140 mx-auto">
        <h1 className="font-display text-[18px] font-bold text-text-primary mb-4">Earnings</h1>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card padding="md">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
              Total Earned
            </p>
            <p className="font-display text-[20px] font-bold text-text-primary">
              {formatCurrency(totalKobo / 100)}
            </p>
          </Card>
          <Card padding="md">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
              Pending Payout
            </p>
            <p className="font-display text-[20px] font-bold text-status-warning">
              {formatCurrency(pendingKobo / 100)}
            </p>
          </Card>
        </div>

        {isLoading ? (
          <p className="text-[13px] text-text-muted text-center py-10">Loading earnings…</p>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<WalletIcon size={24} />}
            title="No earnings yet"
            description="Your Node's share of completed deliveries — where this Node was the drop-off point — will show up here."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-bg-card border border-border-default border-l-[3px]"
                style={{
                  borderLeftColor:
                    entry.payoutStatus === "paid" ? "var(--status-success)" : "var(--status-warning)",
                }}
              >
                <div className="w-14 shrink-0">
                  <p className="text-[11px] font-semibold text-text-primary">{formatDate(entry.createdAt)}</p>
                </div>
                <div className="flex-1 min-w-0 text-[12px] text-text-secondary font-mono truncate">
                  {entry.orderTrackingCode}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[12px] font-semibold text-text-primary">
                    {formatCurrency(entry.amountKobo / 100)}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      color: entry.payoutStatus === "paid" ? "var(--status-success)" : "var(--status-warning)",
                      background:
                        entry.payoutStatus === "paid"
                          ? "var(--status-success-bg)"
                          : "var(--status-warning-bg)",
                    }}
                  >
                    {entry.payoutStatus === "paid" ? "Paid" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
