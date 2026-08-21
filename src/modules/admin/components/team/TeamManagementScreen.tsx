"use client";

import { useState } from "react";
import { RootTopBar } from "@/components/layout";
import { ROUTES } from "@/core/config/constants";
import { Card, Button, EmptyState } from "@/components/ui";
import { AdminSelect } from "@/modules/admin/components/shared/AdminSelect";
import { UsersIcon, DownloadIcon, PlusIcon } from "@/components/icons";
import { useAdminTeam } from "@/modules/admin/hooks/use-admin-team";
import { InviteMemberForm } from "./InviteMemberForm";
import type { AdminTeamRole, AdminTeamStatus } from "@/core/types";

const ROLE_LABELS: Record<AdminTeamRole, string> = {
  super_admin: "Super Admin",
  ops_manager: "Ops Manager",
  node_manager: "Node Manager",
  support_agent: "Support Agent",
};

const STATUS_CONFIG: Record<AdminTeamStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "var(--status-success)" },
  invited: { label: "Invited", color: "var(--status-info)" },
  suspended: { label: "Suspended", color: "var(--status-danger)" },
};

/** "Team Management" — matches admin_UI.png. */
export function TeamManagementScreen() {
  const { members, total, isLoading, roleFilter, setRoleFilter, statusFilter, setStatusFilter } = useAdminTeam();
  const [showInviteForm, setShowInviteForm] = useState(false);

  return (
    <div className="min-h-screen">
      <RootTopBar profileHref={ROUTES.adminProfile} hideOnDesktop />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-10">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-[22px] font-bold text-text-primary">Team Management</h1>
            <p className="text-[13px] text-text-muted mt-0.5">Manage staff access and node assignments.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<DownloadIcon size={14} />}>
              Export List
            </Button>
            <Button
              size="sm"
              leftIcon={<PlusIcon size={14} />}
              className="bg-admin-accent hover:bg-admin-accent-dark text-white"
              onClick={() => setShowInviteForm((v) => !v)}
            >
              Invite Member
            </Button>
          </div>
        </div>

        {showInviteForm && <InviteMemberForm onClose={() => setShowInviteForm(false)} />}

        <Card padding="md" className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <AdminSelect
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as AdminTeamRole | "all")}
                className="w-[160px]"
              >
                <option value="all">All Roles</option>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </AdminSelect>
              <AdminSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AdminTeamStatus | "all")}
                className="w-[160px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="invited">Invited</option>
                <option value="suspended">Suspended</option>
              </AdminSelect>
            </div>
            <p className="text-[12px] text-text-muted">
              Showing {members.length} of {total} members
            </p>
          </div>
        </Card>

        {isLoading ? (
          <p className="text-[13px] text-text-muted text-center py-10">Loading team…</p>
        ) : members.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={<UsersIcon size={22} />}
              title="No team members to show"
              description="Invite a team member to get started — they'll show up here once added."
            />
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-text-muted bg-bg-subtle">
                    <th className="font-medium px-5 py-2.5">Name / Contact</th>
                    <th className="font-medium px-5 py-2.5">Role</th>
                    <th className="font-medium px-5 py-2.5">Status</th>
                    <th className="font-medium px-5 py-2.5">Assigned Node</th>
                    <th className="font-medium px-5 py-2.5">Last Active</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const status = STATUS_CONFIG[member.status];
                    return (
                      <tr key={member.id} className="border-t border-border-default hover:bg-bg-subtle transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-admin-accent-bg text-admin-accent flex items-center justify-center font-semibold text-[12px] shrink-0">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-text-primary truncate">{member.name}</p>
                              <p className="text-[11px] text-text-muted truncate">{member.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[13px] text-text-secondary whitespace-nowrap">
                          {ROLE_LABELS[member.role]}
                        </td>
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: status.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[13px] text-text-secondary whitespace-nowrap">
                          {member.assignedNodeLabel ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-[12px] text-text-muted whitespace-nowrap">{member.lastActiveLabel}</td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <button type="button" className="text-[12px] font-semibold text-admin-accent hover:underline">
                            Manage Access
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
