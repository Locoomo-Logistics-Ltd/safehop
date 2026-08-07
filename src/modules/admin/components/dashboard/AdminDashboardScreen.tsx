"use client";

import { TopBar } from "@/components/layout";
import { PackageIcon, TruckIcon, CheckCircleIcon, AlertTriangleIcon } from "@/components/icons";
import { useAdminDashboard } from "@/modules/admin/hooks/use-admin-dashboard";
import { StatCard } from "@/modules/admin/components/shared/StatCard";
import { RecentOrdersTable } from "./RecentOrdersTable";
import { NetworkStatusCard, OnboardNodeCtaCard } from "./NetworkStatusCard";

/** Admin Home Dashboard — matches "1. Admin Home Dashboard" in admin_UI.png. */
export function AdminDashboardScreen() {
  const {
    stats,
    isStatsLoading,
    recentOrders,
    isRecentOrdersLoading,
    networkStatus,
    isNetworkStatusLoading,
  } = useAdminDashboard();

  return (
    <div className="min-h-screen">
      <TopBar title="Dashboard" rightSlot={undefined} />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-10">
        <div className="hidden md:block mb-6">
          <h1 className="font-display text-[22px] font-bold text-text-primary">Dashboard</h1>
          <p className="text-[13px] text-text-muted mt-0.5">
            Network-wide overview of orders, riders and node health.
          </p>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
          <StatCard
            label="Active Deliveries"
            value={isStatsLoading ? "—" : (stats?.activeDeliveries ?? "—")}
            deltaLabel={stats?.activeDeliveriesDeltaLabel}
            deltaTone="success"
            icon={<PackageIcon size={16} />}
            iconTone="accent"
          />
          <StatCard
            label="Online Riders"
            value={isStatsLoading ? "—" : (stats?.onlineRiders ?? "—")}
            deltaLabel={stats?.onlineRidersLabel}
            deltaTone="neutral"
            icon={<TruckIcon size={16} />}
            iconTone="success"
          />
          <StatCard
            label="Completed Today"
            value={isStatsLoading ? "—" : (stats?.completedToday ?? "—")}
            deltaLabel={stats?.completedTodayLabel}
            deltaTone="success"
            icon={<CheckCircleIcon size={16} />}
            iconTone="success"
          />
          <StatCard
            label="Open Disputes"
            value={isStatsLoading ? "—" : (stats?.openDisputes ?? "—")}
            deltaLabel={stats?.openDisputesLabel}
            deltaTone="danger"
            icon={<AlertTriangleIcon size={16} />}
            iconTone="danger"
          />
        </div>

        {/* Two-column content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
          <RecentOrdersTable orders={recentOrders} isLoading={isRecentOrdersLoading} />
          <div className="flex flex-col gap-4">
            <NetworkStatusCard status={networkStatus} isLoading={isNetworkStatusLoading} />
            <OnboardNodeCtaCard />
          </div>
        </div>
      </div>
    </div>
  );
}
