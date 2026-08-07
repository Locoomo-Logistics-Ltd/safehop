"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout";
import { Card, Input, Button } from "@/components/ui";
import { AdminSelect } from "@/modules/admin/components/shared/AdminSelect";
import { ShieldCheckIcon, UsersIcon, AlertTriangleIcon } from "@/components/icons";
import { StatCard } from "@/modules/admin/components/shared/StatCard";
import { useSuperAdminOverview } from "@/modules/admin/hooks/use-super-admin-overview";
import { useElevateSuperAdmin } from "@/modules/admin/hooks/use-elevate-super-admin";

const ESCALATION_REASONS = [
  "Coverage during staff absence",
  "New ops leadership hire",
  "Emergency incident response",
  "Platform migration/maintenance",
];

/** "Super Admin Overview" — matches admin_UI.png. The elevation form is wired to a real endpoint. */
export function SuperAdminScreen() {
  const { overview, isLoading } = useSuperAdminOverview();
  const { elevateUser, isSubmitting } = useElevateSuperAdmin();

  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [context, setContext] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  const canSubmit = userId.trim() && reason && acknowledged;

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

        <Card padding="lg" className="border-l-[3px] border-l-status-danger">
          <div className="flex items-start gap-3 mb-4">
            <span className="w-9 h-9 rounded-[10px] bg-status-danger-bg text-status-danger flex items-center justify-center shrink-0">
              <ShieldCheckIcon size={18} />
            </span>
            <div>
              <p className="font-display font-bold text-[16px] text-text-primary">Super Admin Override</p>
              <p className="text-[12px] text-text-secondary leading-[1.6] mt-1">
                Elevating a staff member to Super Admin grants full platform access, including{" "}
                <span className="font-semibold text-status-danger">financial controls</span>. This action is logged
                and audited.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Input
              label="User ID or email to elevate"
              placeholder="e.g. staff@locoomo.com"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />

            <AdminSelect label="Escalation reason" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Select escalation reason…</option>
              {ESCALATION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </AdminSelect>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-secondary">Additional context</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Describe why this elevation is necessary. Be specific about the incident or justification…"
                className="w-full rounded-[12px] border border-border-default bg-bg-card text-text-primary text-[14px] placeholder:text-text-muted px-4 py-3 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-colors resize-none"
              />
              <p className="text-[11px] text-text-muted text-right">{context.length}/500</p>
            </div>

            <label className="flex items-start gap-2.5 text-[12px] text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 accent-status-danger"
              />
              I understand this action is logged and audited, and confirm this elevation is authorized.
            </label>

            <Button
              variant="danger"
              fullWidth
              disabled={!canSubmit}
              isLoading={isSubmitting}
              onClick={() => elevateUser(userId.trim())}
            >
              Confirm Elevation
            </Button>
          </div>
        </Card>

        <p className="flex items-center gap-1.5 text-[11px] text-text-muted mt-4">
          <AlertTriangleIcon size={12} />
          Payload shape for this action is unverified against the live API — see admin.service.ts.
        </p>
      </div>
    </div>
  );
}
