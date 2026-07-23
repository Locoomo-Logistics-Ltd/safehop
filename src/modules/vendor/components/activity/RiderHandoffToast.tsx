"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { XIcon, TruckIcon } from "@/components/icons";

interface RiderHandoffToastProps {
  trackingCode: string;
  riderName: string;
  minutesAgo: number;
}

/** Dismissable toast at the top of the Activity screen, matching Figma's "Parcel picked up by Rider" card. */
export function RiderHandoffToast({ trackingCode, riderName, minutesAgo }: RiderHandoffToastProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Card padding="md" className="flex items-center gap-3 mb-5 border-l-[3px] border-l-status-warning">
      <span className="w-9 h-9 rounded-[10px] bg-status-warning-bg text-status-warning flex items-center justify-center shrink-0">
        <TruckIcon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-text-primary leading-[1.4]">
          Parcel <span className="font-mono font-semibold">{trackingCode}</span> picked up by Rider —{" "}
          <span className="font-semibold">{riderName}</span>
        </p>
        <p className="text-[11px] text-text-muted mt-0.5">{minutesAgo} mins ago</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-text-muted shrink-0"
      >
        <XIcon size={16} />
      </button>
    </Card>
  );
}
