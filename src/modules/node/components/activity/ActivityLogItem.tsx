import { cn } from "@/lib/utils";
import { formatRelativeDateTime } from "@/lib/format";
import { AlertTriangleIcon, TruckIcon, ArchiveIcon, PackageIcon } from "@/components/icons";
import type { ActivityEventType, ActivityLogEntry } from "@/core/types";

interface ActivityLogItemProps {
  entry: ActivityLogEntry;
  isLast?: boolean;
}

const ICON_MAP: Record<ActivityEventType, React.ComponentType<{ size?: number; className?: string }>> = {
  handoff_to_rider: TruckIcon,
  batch_received: ArchiveIcon,
  scan_exception: AlertTriangleIcon,
  node_closed: ArchiveIcon,
  parcel_checked_in: PackageIcon,
  parcel_released: PackageIcon,
};

/** One row in the Activity Log timeline — red exception variant matches Figma's "Scan Exception" card. */
export function ActivityLogItem({ entry, isLast }: ActivityLogItemProps) {
  const Icon = ICON_MAP[entry.type];

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
            entry.isException ? "bg-status-danger-bg text-status-danger" : "bg-bg-subtle text-text-secondary"
          )}
        >
          <Icon size={15} />
        </span>
        {!isLast && <span className="w-[2px] flex-1 bg-border-default my-1" />}
      </div>

      <div
        className={cn(
          "flex-1 rounded-[14px] p-3.5 mb-3",
          entry.isException ? "bg-status-danger-bg" : "bg-bg-card border border-border-default"
        )}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <p
            className={cn(
              "text-[13px] font-semibold",
              entry.isException ? "text-status-danger" : "text-text-primary"
            )}
          >
            {entry.title}
          </p>
          <span className="text-[11px] text-text-muted whitespace-nowrap shrink-0">
            {formatRelativeDateTime(entry.timestamp)}
          </span>
        </div>
        <p
          className={cn(
            "text-[12.5px] leading-[1.5]",
            entry.isException ? "text-status-danger/85" : "text-text-secondary"
          )}
        >
          {entry.description}
        </p>
        {entry.tag && (
          <span className="inline-block mt-2 text-[11px] font-semibold text-status-success bg-status-success-bg px-2 py-0.5 rounded-full">
            {entry.tag}
          </span>
        )}
      </div>
    </div>
  );
}
