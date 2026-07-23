"use client";

import { cn } from "@/lib/utils";
import { ImageOffIcon, ArchiveIcon, HelpCircleIcon, DotsIcon } from "@/components/icons";
import type { FlagReason } from "@/core/types";

interface ReasonOption {
  value: FlagReason;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const REASONS: ReasonOption[] = [
  { value: "damaged", label: "Damaged", icon: ImageOffIcon },
  { value: "wrong_item", label: "Wrong Item", icon: ArchiveIcon },
  { value: "missing", label: "Missing", icon: HelpCircleIcon },
  { value: "other", label: "Other", icon: DotsIcon },
];

interface FlagReasonGridProps {
  value: FlagReason | null;
  onChange: (reason: FlagReason) => void;
}

/** 2x2 grid of issue reasons, matching Figma "Select Issue Reason". */
export function FlagReasonGrid({ value, onChange }: FlagReasonGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Select issue reason">
      {REASONS.map((reason) => {
        const isSelected = value === reason.value;
        const Icon = reason.icon;
        return (
          <button
            key={reason.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(reason.value)}
            className={cn(
              "relative flex flex-col items-center gap-2 py-5 rounded-[14px] border-2 transition-all duration-150",
              isSelected ? "border-brand-navy bg-brand-navy text-white" : "border-border-default bg-bg-card text-text-secondary"
            )}
          >
            {isSelected && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-blue flex items-center justify-center">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m20 6-11 11-5-5" />
                </svg>
              </span>
            )}
            <Icon size={22} />
            <span className="text-[13px] font-semibold">{reason.label}</span>
          </button>
        );
      })}
    </div>
  );
}
