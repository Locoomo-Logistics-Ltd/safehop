import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

/** Generic empty state — used for empty delivery lists, search results, etc. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center text-center py-10 px-6", className)}>
      <div className="w-14 h-14 rounded-[16px] bg-bg-subtle flex items-center justify-center text-text-muted mb-4">
        {icon}
      </div>
      <p className="font-semibold text-[15px] text-text-primary mb-1">{title}</p>
      <p className="text-[13px] text-text-secondary max-w-[280px] leading-[1.6]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
