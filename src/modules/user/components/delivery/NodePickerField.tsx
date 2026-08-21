"use client";

import { ChevronDownIcon, MapPinIcon } from "@/components/icons";
import type { PickupNode } from "@/core/types";

interface NodePickerFieldProps {
  label: string;
  placeholder: string;
  node: PickupNode | null | undefined;
  onClick: () => void;
}

/**
 * Collapsed trigger for `NodePickerSheet` — what used to be an
 * always-rendered search box + full node list is now this one compact
 * field; tapping it opens the sheet where the actual list lives. Fixes
 * the "keep scrolling" problem a large Node network created on this
 * screen (2026-08-21).
 */
export function NodePickerField({ label, placeholder, node, onClick }: NodePickerFieldProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3.5 rounded-[14px] border-2 border-border-default bg-bg-card text-left transition-colors hover:border-border-strong"
    >
      <span className="w-9 h-9 rounded-[10px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0">
        <MapPinIcon size={16} />
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-text-muted">{label}</p>
        {node ? (
          <p className="text-[14px] font-semibold text-text-primary truncate">
            {node.name}
            {node.distanceKm !== undefined && (
              <span className="font-normal text-text-muted"> · {node.distanceKm.toFixed(1)}km away</span>
            )}
          </p>
        ) : (
          <p className="text-[14px] text-text-muted truncate">{placeholder}</p>
        )}
      </div>

      <ChevronDownIcon size={18} className="text-text-muted shrink-0" />
    </button>
  );
}
