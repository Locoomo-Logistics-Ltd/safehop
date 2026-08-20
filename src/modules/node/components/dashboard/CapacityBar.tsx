import { Card } from "@/components/ui";
import { UserIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface CapacityBarProps {
  total: number;
  occupied: number;
  isHighFull: boolean;
}

/** Node capacity card with progress bar and "High Full" warning badge, matching Figma. */
export function CapacityBar({ total, occupied, isHighFull }: CapacityBarProps) {
  const pct = Math.min(100, Math.round((occupied / total) * 100));

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Node Capacity
        </p>
        {isHighFull && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-status-warning bg-status-warning-bg px-2 py-0.5 rounded-full">
            <UserIcon size={11} />
            High Full
          </span>
        )}
      </div>

      <p className="font-display text-[20px] font-bold text-text-primary mb-2.5">
        {occupied} / {total} parcels
      </p>

      <div className="h-2 rounded-full bg-bg-subtle overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isHighFull ? "bg-status-warning" : "bg-brand-navy"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </Card>
  );
}
