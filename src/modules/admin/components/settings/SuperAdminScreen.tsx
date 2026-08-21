"use client";

import { TopBar } from "@/components/layout";
import { Card, EmptyState } from "@/components/ui";
import { ShieldCheckIcon, UsersIcon } from "@/components/icons";
import { StatCard } from "@/modules/admin/components/shared/StatCard";
import { useSuperAdminOverview } from "@/modules/admin/hooks/use-super-admin-overview";

/** "Super Admin Overview" — matches admin_UI.png. Elevation isn't a real feature: the role enum has no `super_admin` concept per docs/API.md. */
export function SuperAdminScreen() {
  const { overview, isLoading } = useSuperAdminOverview();

  return (
    <div className="min-h-screen">
      <TopBar title="Settings" />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-10 max-w-[720px] mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-[22px] font-bold text-text-primary">Super Admin</h1>
          <p className="text-[13px] text-text-muted mt-0.5">Platform-level staff access and elevation controls.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            label="Total Staff"
            value={isLoading ? "—" : (overview?.totalStaff ?? "—")}
            icon={<UsersIcon size={16} />}
            iconTone="accent"
          />
          <StatCard
            label="Pending Elevation Requests"
            value={isLoading ? "—" : (overview?.pendingElevationRequests ?? "—")}
            icon={<ShieldCheckIcon size={16} />}
            iconTone="warning"
          />
        </div>

        <Card padding="none">
          <EmptyState
            icon={<ShieldCheckIcon size={22} />}
            title="Staff elevation isn't available yet"
            description="Granting Super Admin access isn't supported by the platform yet. Check back once this capability is added."
          />
        </Card>
      </div>
    </div>
  );
}
