"use client";

import { cn } from "@/lib/utils";
import { MapPinIcon } from "@/components/icons";
import type { PickupNode } from "@/core/types";

interface NodeListItemProps {
  node: PickupNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
}

export function NodeListItem({ node, isSelected, onSelect }: NodeListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      aria-pressed={isSelected}
      className={cn(
        "w-full flex items-center gap-3 p-3.5 rounded-[14px] border-2 text-left transition-all duration-150",
        isSelected ? "border-brand-blue bg-status-info-bg" : "border-border-default bg-bg-card"
      )}
    >
      <span
        className={cn(
          "w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0",
          isSelected ? "bg-brand-blue text-white" : "bg-bg-subtle text-text-muted"
        )}
      >
        <MapPinIcon size={16} />
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-text-primary truncate">{node.name}</p>
        <p className="text-[12px] text-text-muted truncate">
          {node.distanceKm !== undefined ? `${node.distanceKm.toFixed(1)}km away · ` : ""}
          {node.city}, {node.state}
          {node.operatingHours ? ` · ${node.operatingHours}` : ""}
        </p>
      </div>
    </button>
  );
}
