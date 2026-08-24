"use client";

import { useState } from "react";
import { RootTopBar } from "@/components/layout";
import { ROUTES } from "@/core/config/constants";
import { Card, Button, EmptyState } from "@/components/ui";
import { AdminSelect } from "@/modules/admin/components/shared/AdminSelect";
import { WalletIcon, PlusIcon, CheckCircleIcon } from "@/components/icons";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  useRevenueSplitRatios,
  useRevenueSplitEntries,
  useMarkRevenueSplitEntryPaid,
} from "@/modules/admin/hooks/use-admin-revenue-split";
import { SetRevenueSplitRatioForm } from "./SetRevenueSplitRatioForm";
import type { PayoutStatus, RevenueSplitPartyType } from "@/core/types";

/** Kobo, as every amount here arrives, isn't what an Admin reads at a glance. */
function nairaFromKobo(kobo: number): number {
  return kobo / 100;
}

const PARTY_LABEL: Record<RevenueSplitPartyType, string> = {
  rider: "Rider",
  node: "Node",
  destination_node: "Destination Node",
  platform: "Platform",
};

/**
 * "Revenue Split" — replaces the earlier "Rider Earnings" screen, which
 * was wired to `GET /admin/rider-earnings`, an endpoint that never
 * appeared in docs/API.md. The real contract is three routes: the
 * configured split ratio (`POST/GET /admin/revenue-split`, append-only,
 * same pattern as Pricing), and the payout-readiness entries this
 * screen's table renders (`GET /admin/revenue-split/entries`,
 * `PATCH .../mark-paid`). Not a payout flow — the actual transfer stays
 * off-system; this is what to read before running one, and how to
 * record that it happened.
 */
export function RevenueSplitScreen() {
  const [showForm, setShowForm] = useState(false);
  const [partyType, setPartyType] = useState<RevenueSplitPartyType | "">("");
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatus | "">("");

  const { ratios, isLoading: isLoadingRatios } = useRevenueSplitRatios();
  const { entries, isLoading: isLoadingEntries } = useRevenueSplitEntries({
    partyType: partyType || undefined,
    payoutStatus: payoutStatus || undefined,
  });
  const { markPaid, isMarkingPaidId } = useMarkRevenueSplitEntryPaid();

  const currentRatio = ratios[0];

  return (
    <div className="min-h-screen">
      <RootTopBar profileHref={ROUTES.adminProfile} hideOnDesktop />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-10">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-[22px] font-bold text-text-primary">Revenue Split</h1>
            <p className="text-[13px] text-text-muted mt-0.5">
              What&apos;s owed to each party for completed deliveries. Payouts run off-system — this is what to read
              before running one.
            </p>
          </div>
          <Button
            size="sm"
            leftIcon={<PlusIcon size={14} />}
            className="bg-admin-accent hover:bg-admin-accent-dark text-white"
            onClick={() => setShowForm((v) => !v)}
          >
            Set Ratio
          </Button>
        </div>

        {showForm && <SetRevenueSplitRatioForm onClose={() => setShowForm(false)} />}

        <Card padding="md" className="mb-6">
          <p className="text-[12px] font-medium text-text-muted mb-2">Current split</p>
          {isLoadingRatios ? (
            <p className="text-[13px] text-text-muted">Loading…</p>
          ) : currentRatio ? (
            <div className="flex flex-wrap items-center gap-4">
              <RatioPill label="Rider" value={currentRatio.riderPercent} />
              <RatioPill label="Node" value={currentRatio.nodePercent} />
              <RatioPill label="Platform" value={currentRatio.platformPercent} />
              <span className="text-[11px] text-text-muted">
                effective {formatDate(currentRatio.effectiveFrom)}
              </span>
            </div>
          ) : (
            <p className="text-[13px] text-text-muted">
              No split ratio configured yet — completed orders can&apos;t be split until one is set.
            </p>
          )}
        </Card>

        <div className="flex flex-wrap gap-3 mb-4">
          <AdminSelect
            value={partyType}
            onChange={(e) => setPartyType(e.target.value as RevenueSplitPartyType | "")}
            className="w-auto"
          >
            <option value="">All parties</option>
            <option value="rider">Rider</option>
            <option value="node">Node</option>
            <option value="destination_node">Destination Node</option>
            <option value="platform">Platform</option>
          </AdminSelect>
          <AdminSelect
            value={payoutStatus}
            onChange={(e) => setPayoutStatus(e.target.value as PayoutStatus | "")}
            className="w-auto"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </AdminSelect>
        </div>

        {isLoadingEntries ? (
          <p className="text-[13px] text-text-muted text-center py-10">Loading entries…</p>
        ) : entries.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={<WalletIcon size={22} />}
              title="Nothing to show"
              description="Once a delivery reaches Completed, its split entries show up here."
            />
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-text-muted bg-bg-subtle">
                    <th className="font-medium px-5 py-2.5">Order</th>
                    <th className="font-medium px-5 py-2.5">Party</th>
                    <th className="font-medium px-5 py-2.5">Owed to</th>
                    <th className="font-medium px-5 py-2.5">Amount</th>
                    <th className="font-medium px-5 py-2.5">Status</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-t border-border-default hover:bg-bg-subtle transition-colors">
                      <td className="px-5 py-3 text-[12px] font-mono text-text-secondary whitespace-nowrap">
                        {entry.orderTrackingCode}
                      </td>
                      <td className="px-5 py-3 text-[13px] text-text-secondary whitespace-nowrap">
                        {PARTY_LABEL[entry.partyType]}
                      </td>
                      <td className="px-5 py-3 text-[13px] text-text-primary whitespace-nowrap">
                        {entry.partyLabel}
                      </td>
                      <td className="px-5 py-3 text-[13px] font-semibold text-text-primary whitespace-nowrap">
                        {formatCurrency(nairaFromKobo(entry.amountKobo))}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full " +
                            (entry.payoutStatus === "paid"
                              ? "bg-status-success-bg text-status-success"
                              : "bg-status-warning-bg text-status-warning")
                          }
                        >
                          {entry.payoutStatus === "paid" ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {entry.payoutStatus === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<CheckCircleIcon size={13} />}
                            isLoading={isMarkingPaidId === entry.id}
                            onClick={() => markPaid(entry.id)}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function RatioPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-display text-[18px] font-bold text-text-primary">{value}%</span>
      <span className="text-[12px] text-text-muted">{label}</span>
    </div>
  );
}
