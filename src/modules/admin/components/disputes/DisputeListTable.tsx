import { Card, EmptyState } from "@/components/ui";
import { AlertTriangleIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { AdminDispute } from "@/core/types";

const PRIORITY_COLOR: Record<AdminDispute["priority"], string> = {
  high: "var(--status-danger)",
  medium: "var(--status-warning)",
  low: "var(--status-neutral)",
};

interface DisputeListTableProps {
  disputes: AdminDispute[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DisputeListTable({ disputes, isLoading, selectedId, onSelect }: DisputeListTableProps) {
  if (isLoading) {
    return <p className="text-[13px] text-text-muted text-center py-10">Loading disputes…</p>;
  }

  if (disputes.length === 0) {
    return (
      <Card padding="none">
        <EmptyState
          icon={<AlertTriangleIcon size={22} />}
          title="No disputes to show"
          description="You're all caught up. Any disputes raised by customers or riders will appear here."
        />
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-text-muted bg-bg-subtle">
            <th className="font-medium px-5 py-2.5">Order</th>
            <th className="font-medium px-5 py-2.5">Reason</th>
            <th className="font-medium px-5 py-2.5">Raised By</th>
            <th className="font-medium px-5 py-2.5">Priority</th>
            <th className="font-medium px-5 py-2.5">Opened</th>
          </tr>
        </thead>
        <tbody>
          {disputes.map((dispute) => (
            <tr
              key={dispute.id}
              onClick={() => onSelect(dispute.id)}
              className={cn(
                "border-t border-border-default cursor-pointer transition-colors",
                selectedId === dispute.id ? "bg-admin-accent-bg" : "hover:bg-bg-subtle"
              )}
            >
              <td className="px-5 py-3 text-[13px] font-semibold text-admin-accent whitespace-nowrap">
                {dispute.orderTrackingCode}
              </td>
              <td className="px-5 py-3 text-[13px] text-text-secondary whitespace-nowrap">{dispute.category}</td>
              <td className="px-5 py-3 text-[13px] text-text-primary whitespace-nowrap">{dispute.raisedByName}</td>
              <td className="px-5 py-3">
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ color: PRIORITY_COLOR[dispute.priority], background: "var(--bg-subtle)" }}
                >
                  {dispute.priority}
                </span>
              </td>
              <td className="px-5 py-3 text-[12px] text-text-muted whitespace-nowrap">{dispute.createdAtLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
