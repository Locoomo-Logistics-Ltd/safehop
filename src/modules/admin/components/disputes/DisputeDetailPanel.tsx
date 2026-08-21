import { Card, Button, ProgressSteps, EmptyState } from "@/components/ui";
import { AlertTriangleIcon } from "@/components/icons";
import type { AdminDispute, DisputeStatus } from "@/core/types";

const STATUS_STEP: Record<DisputeStatus, number> = {
  open: 1,
  investigating: 2,
  resolved: 3,
};

const STATUS_LABEL: Record<DisputeStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  resolved: "Resolved",
};

interface DisputeDetailPanelProps {
  dispute: AdminDispute | null;
  onResolve: (id: string) => void;
  isResolving: boolean;
}

/** Right-column detail panel for the selected dispute — matches admin_UI.png. */
export function DisputeDetailPanel({ dispute, onResolve, isResolving }: DisputeDetailPanelProps) {
  if (!dispute) {
    return (
      <Card padding="none">
        <EmptyState
          icon={<AlertTriangleIcon size={22} />}
          title="No dispute selected"
          description="Select a dispute from the list to view its details."
        />
      </Card>
    );
  }

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-[14px] font-bold text-text-primary">{dispute.orderTrackingCode}</p>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap uppercase"
          style={{
            color: dispute.priority === "high" ? "var(--status-danger)" : "var(--status-warning)",
            background: dispute.priority === "high" ? "var(--status-danger-bg)" : "var(--status-warning-bg)",
          }}
        >
          {dispute.priority} priority
        </span>
      </div>
      <p className="text-[12px] text-text-muted mb-4">
        Reported by {dispute.raisedByName} · {dispute.category}
      </p>

      <div className="flex gap-2 mb-4">
        <Button size="sm" fullWidth className="bg-brand-navy hover:opacity-90 text-white">
          View Order
        </Button>
        <Button size="sm" fullWidth className="bg-admin-accent hover:bg-admin-accent-dark text-white">
          Contact Customer
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        fullWidth
        disabled={dispute.status === "resolved"}
        isLoading={isResolving}
        onClick={() => onResolve(dispute.id)}
        className="border-status-danger text-status-danger hover:bg-status-danger-bg mb-5"
      >
        {dispute.status === "resolved" ? "Resolved" : "Mark Resolved"}
      </Button>

      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">Case Status</p>
      <ProgressSteps total={3} current={STATUS_STEP[dispute.status]} className="mb-1.5" />
      <p className="text-[12px] text-text-secondary mb-5">{STATUS_LABEL[dispute.status]}</p>

      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">Customer Statement</p>
      <div className="rounded-[10px] bg-bg-subtle border-l-[3px] border-l-admin-accent px-3.5 py-3">
        <p className="text-[13px] text-text-secondary leading-[1.6] italic">&ldquo;{dispute.description}&rdquo;</p>
        <p className="text-[12px] text-text-muted mt-2">— {dispute.raisedByName}</p>
      </div>
    </Card>
  );
}
