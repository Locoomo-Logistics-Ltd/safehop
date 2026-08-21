"use client";

import { cn } from "@/lib/utils";

interface PinPadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  /** Optional secondary action shown bottom-left (e.g. "Resend" on OTP screens). */
  secondaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  disabled?: boolean;
}

const DIGIT_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

/**
 * Shared numeric keypad — used by both the Node Operator PIN setup screen and
 * the OTP "Release Parcel" screen, which need identical numpad UX.
 */
export function PinPad({ onDigit, onBackspace, secondaryAction, disabled }: PinPadProps) {
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mx-auto">
      {DIGIT_ROWS.flat().map((digit) => (
        <PadButton key={digit} onClick={() => onDigit(digit)} disabled={disabled}>
          {digit}
        </PadButton>
      ))}

      {secondaryAction ? (
        <PadButton
          onClick={secondaryAction.onClick}
          disabled={disabled || secondaryAction.disabled}
          variant="text"
        >
          {secondaryAction.label}
        </PadButton>
      ) : (
        <span />
      )}

      <PadButton onClick={() => onDigit("0")} disabled={disabled}>
        0
      </PadButton>

      <PadButton onClick={onBackspace} disabled={disabled} aria-label="Delete digit">
        <BackspaceIcon />
      </PadButton>
    </div>
  );
}

function PadButton({
  children,
  onClick,
  disabled,
  variant = "default",
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "text";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-14 rounded-[14px] flex items-center justify-center font-display font-semibold text-[18px]",
        "transition-all duration-100 active:scale-95 disabled:opacity-40 disabled:active:scale-100",
        variant === "default"
          ? "bg-bg-subtle text-text-primary hover:bg-border-default"
          : "bg-transparent text-[13px] font-sans font-medium text-text-muted"
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function BackspaceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
      <path d="M13 9l-4 4M9 9l4 4" />
    </svg>
  );
}
