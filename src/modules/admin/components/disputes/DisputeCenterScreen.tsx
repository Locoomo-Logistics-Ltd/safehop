"use client";

import { RootTopBar } from "@/components/layout";
import { ROUTES } from "@/core/config/constants";
import { ClockIcon, CheckCircleIcon, WalletIcon } from "@/components/icons";
import { formatCurrency } from "@/lib/format";
import { useAdminDisputes } from "@/modules/admin/hooks/use-admin-disputes";
import { StatCard } from "@/modules/admin/components/shared/StatCard";
import { DisputeListTable } from "./DisputeListTable";
import { DisputeDetailPanel } from "./DisputeDetailPanel";

/** "Dispute Center" — matches admin_UI.png. */
export function DisputeCenterScreen() {
  const { disputes, isLoading, metrics, isMetricsLoading, selectedDispute, selectDispute, resolveDispute, isResolving } =
    useAdminDisputes();

  const openCount = disputes.filter((d) => d.status !== "resolved").length;

  return (
    <div className="min-h-screen">
      <RootTopBar profileHref={ROUTES.adminProfile} hideOnDesktop />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="font-display text-[22px] font-bold text-text-primary">Disputes</h1>
          {openCount > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-status-danger-bg text-status-danger">
              {openCount} open
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <StatCard
            label="Avg Resolution Time"
            value={isMetricsLoading ? "—" : (metrics?.avgResolutionTimeLabel ?? "—")}
            icon={<ClockIcon size={16} />}
            iconTone="accent"
          />
          <StatCard
            label="Resolution Rate"
            value={isMetricsLoading ? "—" : metrics ? `${metrics.resolvedRatePct}%` : "—"}
            icon={<CheckCircleIcon size={16} />}
            iconTone="success"
          />
          <StatCard
            label="Total Refunded"
            value={isMetricsLoading ? "—" : metrics ? formatCurrency(metrics.totalRefunded) : "—"}
            icon={<WalletIcon size={16} />}
            iconTone="warning"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
          <DisputeListTable
            disputes={disputes}
            isLoading={isLoading}
            selectedId={selectedDispute?.id ?? null}
            onSelect={selectDispute}
          />
          <DisputeDetailPanel dispute={selectedDispute} onResolve={resolveDispute} isResolving={isResolving} />
        </div>
      </div>
    </div>
  );
}
