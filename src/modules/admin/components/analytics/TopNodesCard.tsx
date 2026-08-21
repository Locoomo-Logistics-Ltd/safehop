import { Card, EmptyState } from "@/components/ui";
import { MapPinIcon } from "@/components/icons";
import { formatCurrency } from "@/lib/format";
import type { TopNodePerformance } from "@/core/types";

interface TopNodesCardProps {
  nodes: TopNodePerformance[];
  isLoading: boolean;
}

export function TopNodesCard({ nodes, isLoading }: TopNodesCardProps) {
  return (
    <Card padding="md">
      <p className="text-[14px] font-bold text-text-primary mb-0.5">Top Nodes</p>
      <p className="text-[12px] text-text-muted mb-4">By order volume</p>

      {isLoading ? (
        <p className="text-[13px] text-text-muted text-center py-6">Loading…</p>
      ) : nodes.length === 0 ? (
        <EmptyState
          icon={<MapPinIcon size={20} />}
          title="No node analytics yet"
          description="Node performance data will appear here once there's enough order activity."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {nodes.map((node, i) => (
            <div key={node.nodeId} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-full bg-bg-subtle text-text-muted flex items-center justify-center text-[11px] font-semibold shrink-0">
                  {i + 1}
                </span>
                <span className="text-[13px] font-medium text-text-primary truncate">{node.nodeName}</span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-semibold text-text-primary">{node.ordersCount} orders</p>
                <p className="text-[11px] text-text-muted">{formatCurrency(node.revenue)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
