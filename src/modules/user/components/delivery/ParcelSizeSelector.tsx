"use client";

import { cn } from "@/lib/utils";
import type { ParcelSize } from "@/core/types";

interface SizeOption {
  value: ParcelSize;
  label: string;
  hint: string;
  emoji: string;
}

const SIZE_OPTIONS: SizeOption[] = [
  { value: "small", label: "Small", hint: "Fits in an envelope", emoji: "✉️" },
  { value: "medium", label: "Medium", hint: "Fits in a backpack", emoji: "🎒" },
  { value: "large", label: "Large", hint: "Fits in a basket", emoji: "🧺" },
  { value: "xl", label: "XL", hint: "Moving box size", emoji: "📦" },
];

interface ParcelSizeSelectorProps {
  value: ParcelSize | undefined;
  onChange: (size: ParcelSize) => void;
}

/** 2x2 grid of selectable parcel size tiles, matching the Figma "Parcel details" step. */
export function ParcelSizeSelector({ value, onChange }: ParcelSizeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Parcel size">
      {SIZE_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-start gap-1 p-4 rounded-[14px] border-2 text-left transition-all duration-150",
              isSelected ? "border-brand-blue bg-status-info-bg" : "border-border-default bg-bg-card"
            )}
          >
            <span className="text-[20px]" aria-hidden="true">{option.emoji}</span>
            <span className="font-semibold text-[14px] text-text-primary">{option.label}</span>
            <span className="text-[11px] text-text-muted leading-tight">{option.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
