"use client";

import { Input } from "@/components/ui";
import { HANDOFF_CODE_LENGTH } from "@/core/types";

interface CodeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  error?: string;
  autoFocus?: boolean;
}

/**
 * A 6-digit code field that takes the physical keyboard as well as a
 * phone's numeric pad — counters are often a desktop, which the
 * on-screen-only PinPad never served. Digits only, so a pasted
 * "481 920" works.
 */
export function CodeInput({ label, value, onChange, onSubmit, error, autoFocus }: CodeInputProps) {
  return (
    <Input
      label={label}
      value={value}
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus={autoFocus}
      maxLength={HANDOFF_CODE_LENGTH + 2}
      placeholder="• • • • • •"
      className="font-mono text-[22px] tracking-[0.4em] text-center"
      error={error}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, HANDOFF_CODE_LENGTH))}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSubmit?.();
      }}
    />
  );
}
