import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftElement, rightElement, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftElement && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-text-muted">
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            className={cn(
              "w-full h-12 rounded-[12px] border bg-bg-card text-text-primary text-[15px]",
              "placeholder:text-text-muted font-sans",
              "px-4 transition-colors duration-150",
              "outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15",
              leftElement && "pl-10",
              rightElement && "pr-10",
              error ? "border-status-danger" : "border-border-default",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3.5 flex items-center text-text-muted">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[12px] text-status-danger" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="text-[12px] text-text-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
