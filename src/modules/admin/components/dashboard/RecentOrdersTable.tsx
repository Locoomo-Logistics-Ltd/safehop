import Link from "next/link";
import { Card, EmptyState, StatusBadge } from "@/components/ui";
import { PackageIcon, ChevronRightIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import type { AdminOrderSummary } from "@/core/types";

interface RecentOrdersTableProps {
  orders: AdminOrderSummary[];
  isLoading: boolean;
}

/** "Recent Orders" card on the Admin Dashboard — matches the design's left table. */
export function RecentOrdersTable({ orders, isLoading }: RecentOrdersTableProps) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between px-5 h-14 border-b border-border-default">
        <h2 className="font-display font-bold text-[15px] text-text-primary">Recent Orders</h2>
        <Link href={ROUTES.adminOrders} className="text-[12px] font-semibold text-admin-accent hover:underline">
          View all
        </Link>
      </div>

      {isLoading ? (
        <p className="text-[13px] text-text-muted text-center py-10">Loading orders…</p>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<PackageIcon size={22} />}
          title="No recent orders"
          description="Recent orders across the network will show up here as they come in."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-text-muted">
                <th className="font-medium px-5 py-2.5">Tracking Code</th>
                <th className="font-medium px-5 py-2.5">Route</th>
                <th className="font-medium px-5 py-2.5">Status</th>
                <th className="font-medium px-5 py-2.5">Updated</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-border-default hover:bg-bg-subtle transition-colors">
                  <td className="px-5 py-3 text-[13px] font-semibold text-text-primary whitespace-nowrap">
                    {order.trackingCode}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-text-secondary whitespace-nowrap">
                    {order.originLabel} <span className="text-text-muted">→</span> {order.destinationLabel}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3 text-[12px] text-text-muted whitespace-nowrap">{order.updatedAtLabel}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={ROUTES.adminOrderDetail(order.id)} aria-label="View order">
                      <ChevronRightIcon size={16} className="text-text-muted" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
