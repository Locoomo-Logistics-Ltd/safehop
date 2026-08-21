"use client";

import { useState } from "react";
import { RootTopBar } from "@/components/layout";
import { ROUTES } from "@/core/config/constants";
import { Card, Button, EmptyState, Input } from "@/components/ui";
import { PlusIcon, SearchIcon, MapPinIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useAdminNodes } from "@/modules/admin/hooks/use-admin-nodes";
import { NodeNetworkMap } from "./NodeNetworkMap";
import { NodeStatusCard } from "./NodeStatusCard";
import { OnboardNodeForm } from "./OnboardNodeForm";

type ViewMode = "map" | "list";

/** "Node Network" — matches admin_UI.png. */
export function NodeNetworkScreen() {
  const [view, setView] = useState<ViewMode>("map");
  const [showOnboardForm, setShowOnboardForm] = useState(false);
  const { nodes, isLoading, search, setSearch } = useAdminNodes();

  return (
    <div className="min-h-screen">
      <RootTopBar profileHref={ROUTES.adminProfile} hideOnDesktop />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[22px] font-bold text-text-primary">Node Network</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-status-info-bg text-status-info">
              Live
            </span>
          </div>
          <Button
            size="sm"
            leftIcon={<PlusIcon size={14} />}
            className="bg-status-success hover:opacity-90 text-white"
            onClick={() => setShowOnboardForm((v) => !v)}
          >
            Add Node
          </Button>
        </div>

        {showOnboardForm && <OnboardNodeForm onClose={() => setShowOnboardForm(false)} />}

        <div className="flex items-center gap-1 mb-4 border-b border-border-default">
          <TabButton active={view === "map"} onClick={() => setView("map")}>
            Map View
          </TabButton>
          <TabButton active={view === "list"} onClick={() => setView("list")}>
            List View
          </TabButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
          <div>
            {view === "map" ? (
              <NodeNetworkMap nodes={nodes} />
            ) : (
              <NodeListTable nodes={nodes} isLoading={isLoading} />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Card padding="md">
              <p className="text-[12px] font-semibold text-text-primary mb-2">Active Nodes</p>
              <Input
                placeholder="Search nodes, region…"
                leftElement={<SearchIcon size={14} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Card>

            {isLoading ? (
              <p className="text-[13px] text-text-muted text-center py-6">Loading nodes…</p>
            ) : nodes.length === 0 ? (
              <Card padding="none">
                <EmptyState
                  icon={<MapPinIcon size={22} />}
                  title="No node status data"
                  description="Node status will appear here once nodes are added to the network."
                />
              </Card>
            ) : (
              nodes.map((node) => <NodeStatusCard key={node.id} node={node} />)
            )}
          </div>
        </div>
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
        "px-4 h-10 text-[13px] font-semibold border-b-2 -mb-px transition-colors",
        active ? "border-admin-accent text-admin-accent" : "border-transparent text-text-muted hover:text-text-secondary"
      )}
    >
      {children}
    </button>
  );
}

function NodeListTable({ nodes, isLoading }: { nodes: ReturnType<typeof useAdminNodes>["nodes"]; isLoading: boolean }) {
  if (isLoading) {
    return <p className="text-[13px] text-text-muted text-center py-10">Loading nodes…</p>;
  }

  if (nodes.length === 0) {
    return (
      <Card padding="none">
        <EmptyState
          icon={<MapPinIcon size={22} />}
          title="No nodes to show"
          description="Nodes will appear here once they're added to the network."
        />
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-text-muted bg-bg-subtle">
            <th className="font-medium px-5 py-2.5">Node</th>
            <th className="font-medium px-5 py-2.5">Area</th>
            <th className="font-medium px-5 py-2.5">Capacity</th>
            <th className="font-medium px-5 py-2.5">Hours</th>
            <th className="font-medium px-5 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr key={node.id} className="border-t border-border-default hover:bg-bg-subtle transition-colors">
              <td className="px-5 py-3 text-[13px] font-semibold text-text-primary whitespace-nowrap">{node.name}</td>
              <td className="px-5 py-3 text-[13px] text-text-secondary whitespace-nowrap">{node.area}</td>
              <td className="px-5 py-3 text-[13px] text-text-primary whitespace-nowrap">{node.capacity} parcels</td>
              <td className="px-5 py-3 text-[13px] text-text-secondary whitespace-nowrap">{node.operatingHoursLabel}</td>
              <td className="px-5 py-3">
                <NodeStatusBadge status={node.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function NodeStatusBadge({ status }: { status: "pending" | "active" | "inactive" | "suspended" }) {
  const config = {
    active: { label: "Active", color: "var(--status-success)", bg: "var(--status-success-bg)" },
    pending: { label: "Pending", color: "var(--status-warning)", bg: "var(--status-warning-bg)" },
    inactive: { label: "Inactive", color: "var(--status-neutral)", bg: "var(--status-neutral-bg)" },
    suspended: { label: "Suspended", color: "var(--status-danger)", bg: "var(--status-danger-bg)" },
  }[status];

  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: config.color, background: config.bg }}
    >
      {config.label}
    </span>
  );
}
