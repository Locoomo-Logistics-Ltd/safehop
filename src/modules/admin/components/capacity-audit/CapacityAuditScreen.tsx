"use client";

import { RootTopBar } from "@/components/layout";
import { ROUTES } from "@/core/config/constants";
import { Card, Button, EmptyState } from "@/components/ui";
import { RefreshCcwIcon, ShieldCheckIcon, AlertTriangleIcon } from "@/components/icons";
import { useCapacityAudit } from "@/modules/admin/hooks/use-admin-capacity-audit";

/**
 * "Capacity Audit" — new, `GET /admin/capacity-audit`. Read-only
 * reconciliation report: `RiderProfile.currentActiveOrderCount` and
 * `Node.currentCount` are mutable counters (incremented on
 * reservation, decremented on release) that can drift from what the
 * order data actually implies. This screen surfaces the drift, it
 * doesn't fix it — there's no write endpoint here, per docs/API.md.
 * No auto-refresh/polling — an Admin pulls a fresh read on demand,
 * same convention as the Revenue Split entries table.
 */
export function CapacityAuditScreen() {
  const { report, isLoading, isFetching, isError, refetch } = useCapacityAudit();

  const riders = report?.riders ?? [];
  const nodes = report?.nodes ?? [];
  const riderMismatches = riders.filter((r) => r.storedCount !== r.expectedCount).length;
  const nodeMismatches = nodes.filter((n) => n.storedCount !== n.expectedCount).length;
  const totalMismatches = riderMismatches + nodeMismatches;

  return (
    <div className="min-h-screen">
      <RootTopBar profileHref={ROUTES.adminProfile} hideOnDesktop />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-10">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-[22px] font-bold text-text-primary">Capacity Audit</h1>
            <p className="text-[13px] text-text-muted mt-0.5">
              Reconciles the stored rider/Node capacity counters against what the order data actually implies.
              Read-only — nothing here is fixed automatically.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCcwIcon size={14} />}
            isLoading={isFetching}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <p className="text-[13px] text-text-muted text-center py-10">Running audit…</p>
        ) : isError ? (
          <Card padding="none">
            <EmptyState
              icon={<AlertTriangleIcon size={22} />}
              title="Couldn't run the audit"
              description="Something went wrong fetching the report. Try refreshing."
            />
          </Card>
        ) : (
          <>
            <Card padding="md" className="mb-6">
              {totalMismatches === 0 ? (
                <div className="flex items-center gap-2 text-status-success">
                  <ShieldCheckIcon size={16} />
                  <p className="text-[13px] font-medium">
                    No discrepancies found across {riders.length} rider{riders.length === 1 ? "" : "s"} and{" "}
                    {nodes.length} node{nodes.length === 1 ? "" : "s"} checked.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-status-warning">
                  <AlertTriangleIcon size={16} />
                  <p className="text-[13px] font-medium">
                    {totalMismatches} discrepanc{totalMismatches === 1 ? "y" : "ies"} found —{" "}
                    {riderMismatches} rider{riderMismatches === 1 ? "" : "s"}, {nodeMismatches} node
                    {nodeMismatches === 1 ? "" : "s"}.
                  </p>
                </div>
              )}
            </Card>

            <AuditTable
              title="Riders"
              subtitle="RiderProfile.currentActiveOrderCount vs. expected concurrent-delivery count"
              emptyText="No rider rows returned by the audit."
              rows={riders}
              idKey="riderId"
              labelKey="riderEmail"
              labelHeader="Rider"
            />

            <div className="h-6" />

            <AuditTable
              title="Nodes"
              subtitle="Node.currentCount vs. expected occupied-capacity count"
              emptyText="No node rows returned by the audit."
              rows={nodes}
              idKey="nodeId"
              labelKey="nodeName"
              labelHeader="Node"
            />
          </>
        )}
      </div>
    </div>
  );
}

interface AuditTableProps<TRow> {
  title: string;
  subtitle: string;
  emptyText: string;
  rows: TRow[];
  idKey: keyof TRow;
  labelKey: keyof TRow;
  labelHeader: string;
}

function AuditTable<TRow extends { storedCount: number; expectedCount: number }>({
  title,
  subtitle,
  emptyText,
  rows,
  idKey,
  labelKey,
  labelHeader,
}: AuditTableProps<TRow>) {
  return (
    <div>
      <div className="mb-2">
        <p className="text-[14px] font-semibold text-text-primary">{title}</p>
        <p className="text-[11px] text-text-muted">{subtitle}</p>
      </div>

      {rows.length === 0 ? (
        <Card padding="md">
          <p className="text-[13px] text-text-muted">{emptyText}</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-text-muted bg-bg-subtle">
                  <th className="font-medium px-5 py-2.5">{labelHeader}</th>
                  <th className="font-medium px-5 py-2.5">Stored</th>
                  <th className="font-medium px-5 py-2.5">Expected</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isMismatch = row.storedCount !== row.expectedCount;
                  return (
                    <tr
                      key={String(row[idKey])}
                      className={
                        "border-t border-border-default transition-colors " +
                        (isMismatch ? "bg-status-warning-bg/40" : "hover:bg-bg-subtle")
                      }
                    >
                      <td className="px-5 py-3 text-[13px] font-medium text-text-primary whitespace-nowrap">
                        {String(row[labelKey])}
                      </td>
                      <td className="px-5 py-3 text-[13px] text-text-secondary whitespace-nowrap">
                        {row.storedCount}
                      </td>
                      <td className="px-5 py-3 text-[13px] text-text-secondary whitespace-nowrap">
                        {row.expectedCount}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {isMismatch && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-status-warning-bg text-status-warning">
                            Mismatch
                          </span>
                        )}
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
  );
}
