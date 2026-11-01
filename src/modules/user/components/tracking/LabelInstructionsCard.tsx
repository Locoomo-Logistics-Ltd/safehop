"use client";

import { Card } from "@/components/ui";
import { CopyIcon } from "@/components/icons";
import { useNotificationStore } from "@/store/notification.store";
import type { LabelInstructions } from "@/core/types";

/**
 * What the sender writes on the parcel. There are no printers and no QR
 * code: staff type the tracking code off the parcel, so the lines are
 * shown large and monospaced, exactly as they should be written.
 */
export function LabelInstructionsCard({ label }: { label: LabelInstructions }) {
  const showNotification = useNotificationStore((s) => s.showNotification);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(label.lines.join("\n"));
      showNotification({ type: "success", title: "Copied", message: "Label text copied." });
    } catch {
      showNotification({ type: "error", title: "Couldn't copy", message: "Write the lines down by hand instead." });
    }
  };

  return (
    <Card padding="lg" className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-text-primary">Write this on your parcel</p>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy label text"
          className="w-7 h-7 rounded-[8px] text-text-muted hover:bg-bg-subtle hover:text-text-primary flex items-center justify-center transition-colors"
        >
          <CopyIcon size={14} />
        </button>
      </div>

      <div className="rounded-[12px] border-2 border-dashed border-border-strong bg-bg-subtle px-4 py-5 text-center">
        {label.lines.map((line, i) => (
          <p
            key={`${line}-${i}`}
            className={
              i === 0
                ? "font-mono text-[24px] font-bold tracking-wider text-text-primary break-all"
                : "font-mono text-[15px] font-semibold tracking-wide text-text-secondary mt-1.5 break-words"
            }
          >
            {line}
          </p>
        ))}
      </div>

      <p className="text-[12.5px] text-text-secondary leading-[1.6]">{label.note}</p>
    </Card>
  );
}
