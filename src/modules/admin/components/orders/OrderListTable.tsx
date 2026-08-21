import Link from "next/link";
import { Card, EmptyState, StatusBadge } from "@/components/ui";
import { PackageIcon, ChevronRightIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { formatCurrency } from "@/lib/format";
import type { AdminOrderListItem } from "@/core/types";

interface OrderListTableProps {
  orders: AdminOrderListItem[];
  isLoading: boolean;
}

export function OrderListTable({ orders, isLoading }: OrderListTableProps) {
  if (isLoading) {
    return <p className="text-[13px] text-text-muted text-center py-10">Loading orders…</p>;
  }

  if (orders.length === 0) {
    return (
      <Card padding="none">
        <EmptyState
          icon={<PackageIcon size={22} />}
          title="No orders to show"
          description="Orders across the network will appear here once customers start placing them."
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
              <th className="font-medium px-5 py-2.5">Tracking Code</th>
              <th className="font-medium px-5 py-2.5">Customer</th>
              <th className="font-medium px-5 py-2.5">Route</th>
              <th className="font-medium px-5 py-2.5">Status</th>
              <th className="font-medium px-5 py-2.5">Amount</th>
              <th className="font-medium px-5 py-2.5">Created</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-border-default hover:bg-bg-subtle transition-colors">
                <td className="px-5 py-3 text-[13px] font-semibold text-admin-accent whitespace-nowrap">
                  {order.trackingCode}
                </td>
                <td className="px-5 py-3 text-[13px] font-medium text-text-primary whitespace-nowrap">
                  {order.customerName}
                </td>
                <td className="px-5 py-3 text-[13px] text-text-secondary whitespace-nowrap">
                  {order.originLabel} <span className="text-text-muted">→</span> {order.destinationLabel}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-3 text-[13px] text-text-primary whitespace-nowrap">
                  {formatCurrency(order.amount)}
                </td>
                <td className="px-5 py-3 text-[12px] text-text-muted whitespace-nowrap">{order.createdAtLabel}</td>
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
    </Card>
  );
}
