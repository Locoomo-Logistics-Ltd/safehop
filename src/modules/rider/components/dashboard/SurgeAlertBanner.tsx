import { Card } from "@/components/ui";
import { BoltIcon, ChevronRightIcon } from "@/components/icons";

/** "High Demand Area Nearby" banner shown on the rider home screen, matching Figma. */
export function SurgeAlertBanner() {
  return (
    <Card
      padding="md"
      interactive
      className="flex items-center gap-3 border-l-[3px] border-l-status-warning"
    >
      <span className="w-9 h-9 rounded-[10px] bg-status-warning-bg text-status-warning flex items-center justify-center shrink-0">
        <BoltIcon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-text-primary">High Demand Area Nearby</p>
        <p className="text-[12px] text-text-muted truncate">Downtown Zone is currently surging.</p>
      </div>
      <ChevronRightIcon size={16} className="text-text-muted shrink-0" />
    </Card>
  );
}
