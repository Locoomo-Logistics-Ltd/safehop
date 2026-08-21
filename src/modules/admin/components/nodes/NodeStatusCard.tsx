"use client";

import { useState } from "react";
import { Card, Button } from "@/components/ui";
import { AdminSelect } from "@/modules/admin/components/shared/AdminSelect";
import { useAdminNodeDetail } from "@/modules/admin/hooks/use-admin-node-detail";
import { useManageNode } from "@/modules/admin/hooks/use-manage-node";
import type { AdminNodeStatus, NodeLifecycleStatus } from "@/core/types";

const STATUS_CONFIG: Record<NodeLifecycleStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "var(--status-success)", bg: "var(--status-success-bg)" },
  pending: { label: "Pending", color: "var(--status-warning)", bg: "var(--status-warning-bg)" },
  inactive: { label: "Inactive", color: "var(--status-neutral)", bg: "var(--status-neutral-bg)" },
  suspended: { label: "Suspended", color: "var(--status-danger)", bg: "var(--status-danger-bg)" },
};

const STATUS_OPTIONS: Array<{ value: NodeLifecycleStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

interface NodeStatusCardProps {
  node: AdminNodeStatus;
}

/** One node's card in the "Active Nodes" side panel — matches admin_UI.png. */
export function NodeStatusCard({ node }: NodeStatusCardProps) {
  const config = STATUS_CONFIG[node.status];
  const [showDetails, setShowDetails] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [nextStatus, setNextStatus] = useState<NodeLifecycleStatus>(node.status);
  const { node: detail, isLoading, isError } = useAdminNodeDetail(node.id, showDetails);
  const { updateNode, isUpdating } = useManageNode();

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-[13px] font-semibold text-text-primary">{node.name}</p>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ color: config.color, background: config.bg }}
        >
          {config.label}
        </span>
      </div>
      <p className="text-[11px] text-text-muted mb-3">{node.area}</p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-[8px] bg-bg-subtle px-2.5 py-1.5">
          <p className="text-[9px] text-text-muted uppercase tracking-wide">Capacity</p>
          <p className="text-[13px] font-semibold text-text-primary">{node.capacity} parcels</p>
        </div>
        <div className="rounded-[8px] bg-bg-subtle px-2.5 py-1.5">
          <p className="text-[9px] text-text-muted uppercase tracking-wide">Hours</p>
          <p className="text-[13px] font-semibold text-text-primary truncate">{node.operatingHoursLabel}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" fullWidth onClick={() => setShowDetails((v) => !v)}>
          {showDetails ? "Hide Details" : "View Details"}
        </Button>
        <Button
          size="sm"
          fullWidth
          className="bg-admin-accent hover:bg-admin-accent-dark text-white"
          onClick={() => setShowManage((v) => !v)}
        >
          {showManage ? "Cancel" : "Manage"}
        </Button>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-border-default space-y-1">
          {isLoading && <p className="text-[12px] text-text-muted">Loading details…</p>}
          {isError && <p className="text-[12px] text-status-danger">Couldn&apos;t load node details.</p>}
          {detail && (
            <>
              <DetailRow label="Address" value={detail.address} />
              <DetailRow label="Country" value={detail.country} />
              <DetailRow label="Onboarding type" value={detail.onboardingType} />
              <DetailRow label="Created" value={detail.createdAtLabel} />
            </>
          )}
        </div>
      )}

      {showManage && (
        <div className="mt-3 pt-3 border-t border-border-default">
          <p className="text-[11px] font-medium text-text-secondary mb-1.5">Change status</p>
          <div className="flex gap-2">
            <AdminSelect
              className="flex-1"
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value as NodeLifecycleStatus)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </AdminSelect>
            <Button
              size="sm"
              disabled={nextStatus === node.status}
              isLoading={isUpdating}
              onClick={() => updateNode({ nodeId: node.id, payload: { status: nextStatus } })}
              className="bg-admin-accent hover:bg-admin-accent-dark text-white"
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[12px] text-text-secondary">
      <span className="text-text-muted">{label}:</span> {value}
    </p>
  );
}
