import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  deltaLabel?: string;
  deltaTone?: "success" | "warning" | "danger" | "neutral";
  icon: React.ReactNode;
  iconTone?: "accent" | "success" | "warning" | "danger";
}

const ICON_TONE_CLASSES: Record<NonNullable<StatCardProps["iconTone"]>, string> = {
  accent: "bg-admin-accent-bg text-admin-accent",
  success: "bg-status-success-bg text-status-success",
  warning: "bg-status-warning-bg text-status-warning",
  danger: "bg-status-danger-bg text-status-danger",
};

const DELTA_TONE_CLASSES: Record<NonNullable<StatCardProps["deltaTone"]>, string> = {
  success: "text-status-success",
  warning: "text-status-warning",
  danger: "text-status-danger",
  neutral: "text-text-muted",
};

/** Reused by the Dashboard's top stat row and the Analytics screen's summary row. */
export function StatCard({ label, value, deltaLabel, deltaTone = "neutral", icon, iconTone = "accent" }: StatCardProps) {
  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-[12px] font-medium text-text-muted">{label}</p>
        <span className={cn("w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0", ICON_TONE_CLASSES[iconTone])}>
          {icon}
        </span>
      </div>
      <p className="font-display font-bold text-[26px] text-text-primary leading-none">{value}</p>
      {deltaLabel && (
        <p className={cn("text-[12px] font-medium mt-2", DELTA_TONE_CLASSES[deltaTone])}>{deltaLabel}</p>
      )}
    </Card>
  );
}
