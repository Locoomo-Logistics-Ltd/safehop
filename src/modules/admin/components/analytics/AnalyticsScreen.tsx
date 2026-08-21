"use client";

import { useState } from "react";
import { RootTopBar } from "@/components/layout";
import { ROUTES } from "@/core/config/constants";
import { Card, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";
import { PackageIcon, WalletIcon, ClockIcon, BarChartIcon } from "@/components/icons";
import { formatCurrency } from "@/lib/format";
import { useAdminAnalytics } from "@/modules/admin/hooks/use-admin-analytics";
import { StatCard } from "@/modules/admin/components/shared/StatCard";
import { OrdersTrendChart } from "./OrdersTrendChart";
import { TopNodesCard } from "./TopNodesCard";
import { RiderPerformanceCard } from "./RiderPerformanceCard";

type RangeMode = "daily" | "weekly" | "monthly";

/** "Analytics & Performance" — matches admin_UI.png. */
export function AnalyticsScreen() {
  const [range, setRange] = useState<RangeMode>("weekly");
  const { summary, isSummaryLoading, trend, isTrendLoading, topNodes, isTopNodesLoading, riderPerformance, isRiderPerformanceLoading } =
    useAdminAnalytics();

  return (
    <div className="min-h-screen">
      <RootTopBar profileHref={ROUTES.adminProfile} hideOnDesktop />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-10">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-[22px] font-bold text-text-primary">Analytics</h1>
            <p className="text-[13px] text-text-muted mt-0.5">Network performance across orders, revenue and riders.</p>
          </div>
          <div className="flex items-center gap-1 border-b border-border-default">
            {(["daily", "weekly", "monthly"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setRange(mode)}
                className={cn(
                  "px-3 h-9 text-[13px] font-semibold border-b-2 -mb-px capitalize transition-colors",
                  range === mode ? "border-admin-accent text-admin-accent" : "border-transparent text-text-muted hover:text-text-secondary"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
          <StatCard
            label="Orders"
            value={isSummaryLoading ? "—" : (summary?.totalOrders ?? "—")}
            icon={<PackageIcon size={16} />}
            iconTone="accent"
          />
          <StatCard
            label="Revenue"
            value={isSummaryLoading ? "—" : summary ? formatCurrency(summary.totalRevenue) : "—"}
            icon={<WalletIcon size={16} />}
            iconTone="success"
          />
          <StatCard
            label="Avg Delivery Time"
            value={isSummaryLoading ? "—" : (summary?.avgDeliveryTimeLabel ?? "—")}
            icon={<ClockIcon size={16} />}
            iconTone="accent"
          />
          <StatCard
            label="Growth Rate"
            value={isSummaryLoading ? "—" : (summary?.growthPctLabel ?? "—")}
            icon={<BarChartIcon size={16} />}
            iconTone="warning"
          />
        </div>

        <Card padding="md" className="mb-4">
          <p className="text-[14px] font-bold text-text-primary mb-0.5">Orders Placed vs Completed</p>
          <p className="text-[12px] text-text-muted mb-4">Network-wide throughput over the selected range</p>

          {isTrendLoading ? (
            <p className="text-[13px] text-text-muted text-center py-10">Loading trend…</p>
          ) : trend.length === 0 ? (
            <EmptyState
              icon={<BarChartIcon size={22} />}
              title="No trend data yet"
              description="Order trends will appear here once there's enough activity in the selected range."
            />
          ) : (
            <OrdersTrendChart data={trend} />
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopNodesCard nodes={topNodes} isLoading={isTopNodesLoading} />
          <RiderPerformanceCard riders={riderPerformance} isLoading={isRiderPerformanceLoading} />
        </div>
      </div>
    </div>
  );
}
