import { cn } from "@/lib/utils";
import type { JobStatus } from "@/core/types";

interface JobStepperProps {
  status: JobStatus;
}

const STEPS = [
  { key: "pickup", label: "Pickup" },
  { key: "transit", label: "Transit" },
  { key: "delivered", label: "Delivered" },
] as const;

function getActiveStep(status: JobStatus): number {
  if (status === "accepted") return 0;
  if (status === "picked_up") return 1;
  if (status === "delivered") return 2;
  return 0;
}

/**
 * Horizontal 3-step stepper matching the Figma "Pickup → Transit →
 * Delivered" progress tracker on the active job screen.
 */
export function JobStepper({ status }: JobStepperProps) {
  const activeStep = getActiveStep(status);

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const isDone = i < activeStep;
        const isActive = i === activeStep;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-colors duration-300",
                  isDone
                    ? "bg-status-success border-status-success text-white"
                    : isActive
                      ? "bg-brand-blue border-brand-blue text-white"
                      : "bg-bg-card border-border-default text-text-muted"
                )}
              >
                {isDone ? "✓" : i + 1}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold whitespace-nowrap",
                  isActive ? "text-brand-blue" : isDone ? "text-status-success" : "text-text-muted"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-[2px] mx-1 mb-4 rounded-full transition-colors duration-300",
                  isDone ? "bg-status-success" : "bg-border-default"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
