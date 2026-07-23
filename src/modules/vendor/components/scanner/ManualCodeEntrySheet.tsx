"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";

interface ManualCodeEntrySheetProps {
  onSubmit: (code: string) => void;
  onClose: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

/** Bottom sheet for entering a tracking code manually, matching Figma's "Having trouble?" fallback. */
export function ManualCodeEntrySheet({ onSubmit, onClose, isSubmitting, error }: ManualCodeEntrySheetProps) {
  const [code, setCode] = useState("");

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end">
      <button
        className="absolute inset-0 bg-black/50"
        aria-label="Close manual entry"
        onClick={onClose}
      />
      <div className="relative bg-bg-card rounded-t-[24px] p-6 pb-8">
        <div className="w-10 h-1 rounded-full bg-border-strong mx-auto mb-5" />

        <h2 className="font-display font-bold text-[16px] text-text-primary mb-1">
          Enter code manually
        </h2>
        <p className="text-[13px] text-text-muted mb-4">
          Type the tracking code printed on the parcel label.
        </p>

        <Input
          placeholder="e.g. LC-482TX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoFocus
          error={error ?? undefined}
        />

        <Button
          fullWidth
          size="lg"
          className="mt-4"
          disabled={!code.trim()}
          isLoading={isSubmitting}
          onClick={() => onSubmit(code.trim())}
        >
          Look Up Parcel
        </Button>
      </div>
    </div>
  );
}
