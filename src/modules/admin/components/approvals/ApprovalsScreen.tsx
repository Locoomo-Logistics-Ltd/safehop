"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout";
import { Card, Button, EmptyState } from "@/components/ui";
import { MapPinIcon, TruckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { useNodeOperatorApprovals, useRiderApprovals } from "@/modules/admin/hooks/use-admin-approvals";

type ApprovalsTab = "node_operators" | "riders";

/**
 * "Approvals" — new 2026-08-12, no home in the original 8-frame
 * `admin_UI.png` design (it predates these endpoints). Modeled on
 * `NodeNetworkScreen`'s tab pattern and `TeamManagementScreen`'s table
 * pattern so it reads as part of the same design system rather than a
 * bolted-on screen.
 */
export function ApprovalsScreen() {
  const [tab, setTab] = useState<ApprovalsTab>("node_operators");
  const nodeOperators = useNodeOperatorApprovals();
  const riders = useRiderApprovals();

  return (
    <div className="min-h-screen">
      <TopBar title="Approvals" />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-10">
        <div className="mb-6">
          <h1 className="font-display text-[22px] font-bold text-text-primary">Approvals</h1>
          <p className="text-[13px] text-text-muted mt-0.5">
            Review self-registered Node Operators and Riders waiting to go active.
          </p>
        </div>

        <div className="flex items-center gap-1 mb-4 border-b border-border-default">
          <TabButton active={tab === "node_operators"} onClick={() => setTab("node_operators")}>
            Node Operators
            {nodeOperators.pending.length > 0 && <CountBadge count={nodeOperators.pending.length} />}
          </TabButton>
          <TabButton active={tab === "riders"} onClick={() => setTab("riders")}>
            Riders
            {riders.pending.length > 0 && <CountBadge count={riders.pending.length} />}
          </TabButton>
        </div>

        {tab === "node_operators" ? (
          <NodeOperatorApprovalsTable
            pending={nodeOperators.pending}
            isLoading={nodeOperators.isLoading}
            onApprove={nodeOperators.approve}
            isApproving={nodeOperators.isApproving}
            approvingProfileId={nodeOperators.approvingProfileId}
          />
        ) : (
          <RiderApprovalsTable
            pending={riders.pending}
            isLoading={riders.isLoading}
            onApprove={riders.approve}
            isApproving={riders.isApproving}
            approvingProfileId={riders.approvingProfileId}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-4 h-10 text-[13px] font-semibold border-b-2 -mb-px transition-colors",
        active ? "border-admin-accent text-admin-accent" : "border-transparent text-text-muted hover:text-text-secondary"
      )}
    >
      {children}
    </button>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning">
      {count}
    </span>
  );
}

interface NodeOperatorApprovalsTableProps {
  pending: ReturnType<typeof useNodeOperatorApprovals>["pending"];
  isLoading: boolean;
  onApprove: (profileId: string) => void;
  isApproving: boolean;
  approvingProfileId: string | undefined;
}

function NodeOperatorApprovalsTable({
  pending,
  isLoading,
  onApprove,
  isApproving,
  approvingProfileId,
}: NodeOperatorApprovalsTableProps) {
  if (isLoading) {
    return <p className="text-[13px] text-text-muted text-center py-10">Loading pending node operators…</p>;
  }

  if (pending.length === 0) {
    return (
      <Card padding="none">
        <EmptyState
          icon={<MapPinIcon size={22} />}
          title="No pending node operators"
          description="Node operators who complete self-service onboarding will show up here, waiting for approval."
        />
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-text-muted bg-bg-subtle">
              <th className="font-medium px-5 py-2.5">Applicant</th>
              <th className="font-medium px-5 py-2.5">Node</th>
              <th className="font-medium px-5 py-2.5">Area</th>
              <th className="font-medium px-5 py-2.5">Capacity</th>
              <th className="font-medium px-5 py-2.5">Submitted</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {pending.map((operator) => {
              const isThisRowApproving = isApproving && approvingProfileId === operator.profileId;
              return (
                <tr key={operator.profileId} className="border-t border-border-default hover:bg-bg-subtle transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-[13px] font-semibold text-text-primary whitespace-nowrap">
                      {operator.userFirstName} {operator.userLastName}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">{operator.userEmail}</p>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-text-secondary whitespace-nowrap">{operator.node.name}</td>
                  <td className="px-5 py-3 text-[13px] text-text-secondary whitespace-nowrap">
                    {operator.node.city}, {operator.node.state}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-text-primary whitespace-nowrap">
                    {operator.node.capacity} parcels
                  </td>
                  <td className="px-5 py-3 text-[12px] text-text-muted whitespace-nowrap">
                    {formatDate(operator.submittedAt)}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <Button
                      size="sm"
                      isLoading={isThisRowApproving}
                      disabled={isApproving && !isThisRowApproving}
                      className="bg-admin-accent hover:bg-admin-accent-dark text-white"
                      onClick={() => onApprove(operator.profileId)}
                    >
                      Approve
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

interface RiderApprovalsTableProps {
  pending: ReturnType<typeof useRiderApprovals>["pending"];
  isLoading: boolean;
  onApprove: (profileId: string) => void;
  isApproving: boolean;
  approvingProfileId: string | undefined;
}

function RiderApprovalsTable({ pending, isLoading, onApprove, isApproving, approvingProfileId }: RiderApprovalsTableProps) {
  if (isLoading) {
    return <p className="text-[13px] text-text-muted text-center py-10">Loading pending riders…</p>;
  }

  if (pending.length === 0) {
    return (
      <Card padding="none">
        <EmptyState
          icon={<TruckIcon size={22} />}
          title="No pending riders"
          description="Riders who submit KYC verification will show up here, waiting for approval."
        />
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-text-muted bg-bg-subtle">
              <th className="font-medium px-5 py-2.5">Applicant</th>
              <th className="font-medium px-5 py-2.5">Current Employer</th>
              <th className="font-medium px-5 py-2.5">Document</th>
              <th className="font-medium px-5 py-2.5">Submitted</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {pending.map((rider) => {
              const isThisRowApproving = isApproving && approvingProfileId === rider.profileId;
              const document = rider.documents[0];
              return (
                <tr key={rider.profileId} className="border-t border-border-default hover:bg-bg-subtle transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-[13px] font-semibold text-text-primary whitespace-nowrap">
                      {rider.userFirstName} {rider.userLastName}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">{rider.userEmail}</p>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-text-secondary whitespace-nowrap">{rider.currentEmployer}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {document ? (
                      <a
                        href={document.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] font-semibold text-admin-accent hover:underline"
                      >
                        View screenshot
                      </a>
                    ) : (
                      <span className="text-[12px] text-text-muted">No document</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[12px] text-text-muted whitespace-nowrap">{formatDate(rider.submittedAt)}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <Button
                      size="sm"
                      isLoading={isThisRowApproving}
                      disabled={isApproving && !isThisRowApproving}
                      className="bg-admin-accent hover:bg-admin-accent-dark text-white"
                      onClick={() => onApprove(rider.profileId)}
                    >
                      Approve
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
