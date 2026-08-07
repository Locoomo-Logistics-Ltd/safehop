import { Card, Button, Input } from "@/components/ui";
import { AdminSelect } from "@/modules/admin/components/shared/AdminSelect";
import { SearchIcon, FilterIcon } from "@/components/icons";
import type { AdminOrderFilters } from "@/core/types";
import type { DeliveryStatus } from "@/core/types";

interface OrderFilterBarProps {
  filters: AdminOrderFilters;
  onChange: (filters: AdminOrderFilters) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: Array<{ value: DeliveryStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "package_dropped", label: "Package Dropped" },
  { value: "in_transit", label: "In Transit" },
  { value: "arrived_at_node", label: "Arrived at Node" },
  { value: "ready_for_collection", label: "Ready for Collection" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

/** Filter bar above the admin order table — matches "Order List & Filter" in admin_UI.png. */
export function OrderFilterBar({ filters, onChange, onReset }: OrderFilterBarProps) {
  return (
    <Card padding="md" className="mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        <Input
          label="Search"
          placeholder="Tracking code or customer…"
          leftElement={<SearchIcon size={15} />}
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
        <AdminSelect
          label="Status"
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as AdminOrderFilters["status"] })}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Node"
          value={filters.nodeId}
          onChange={(e) => onChange({ ...filters, nodeId: e.target.value })}
        >
          <option value="all">All nodes</option>
        </AdminSelect>
      </div>
      <Button variant="ghost" size="sm" leftIcon={<FilterIcon size={14} />} onClick={onReset}>
        Clear filters
      </Button>
    </Card>
  );
}
