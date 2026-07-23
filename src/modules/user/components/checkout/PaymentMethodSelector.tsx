"use client";

import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/core/types";

interface PaymentOption {
  value: PaymentMethod;
  label: string;
  description: string;
  emoji: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { value: "alat_pay", label: "ALAT Pay", description: "Make a contactless transfer with ALAT", emoji: "💳" },
  { value: "bank_transfer", label: "Bank Transfer", description: "Transfer to a dedicated account", emoji: "🏦" },
  { value: "opay", label: "Pay with Opay", description: "Complete transaction using Opay", emoji: "📱" },
  { value: "card", label: "Debit/Credit Card", description: "Pay with your saved card", emoji: "💴" },
  { value: "ussd", label: "Pay with USSD", description: "Complete payment using USSD code", emoji: "🔢" },
];

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Payment method">
      {PAYMENT_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center gap-3 p-3.5 rounded-[14px] border-2 text-left transition-all duration-150",
              isSelected ? "border-brand-blue bg-status-info-bg" : "border-border-default bg-bg-card"
            )}
          >
            <span className="text-[20px] shrink-0" aria-hidden="true">{option.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-text-primary">{option.label}</p>
              <p className="text-[12px] text-text-muted">{option.description}</p>
            </div>
            <span
              className={cn(
                "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center",
                isSelected ? "border-brand-blue" : "border-border-strong"
              )}
            >
              {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-brand-blue" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
