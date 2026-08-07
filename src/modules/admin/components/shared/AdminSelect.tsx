import * as React from "react";
import { ChevronDownIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

/**
 * Small native `<select>` styled to match `Input`'s surface — the
 * codebase has no shared `Select` primitive yet, so this stays scoped
 * to `modules/admin` (filter bars on Orders/Disputes) rather than
 * being promoted to `components/ui` speculatively.
 */
export const AdminSelect = React.forwardRef<HTMLSelectElement, AdminSelectProps>(
  ({ className, label, id, children, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-[12px] font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full h-10 rounded-[10px] border border-border-default bg-bg-card text-text-primary text-[13px]",
              "pl-3 pr-9 appearance-none outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-colors",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDownIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
      </div>
    );
  }
);
AdminSelect.displayName = "AdminSelect";
