"use client";

import { cn } from "@/lib/utils";
import type { LocoomoNode } from "@/core/types";

interface MockMapViewProps {
  nodes: LocoomoNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

/**
 * Static styled map visualization with tappable node pins.
 *
 * @deprecated as the active map — SelectNodesScreen now uses
 * GoogleMapView (real, live Google Maps). This component is kept
 * as a reference/offline fallback and for any future screens that
 * want a lightweight decorative map without a Maps API key.
 *
 * Pin positions below are hand-placed percentages standing in for real
 * lat/lng → screen projection.
 */
const PIN_POSITIONS: Record<string, { top: string; left: string }> = {
  node_vi_hub: { top: "62%", left: "58%" },
  node_ikeja_central: { top: "22%", left: "32%" },
  node_ikoyi_city_superama: { top: "48%", left: "74%" },
  node_lekki_phase1: { top: "78%", left: "80%" },
  node_yaba_tech: { top: "15%", left: "60%" },
};

export function MockMapView({ nodes, selectedNodeId, onSelectNode }: MockMapViewProps) {
  return (
    <div className="relative w-full h-[280px] rounded-[18px] overflow-hidden bg-[#E8EEF7] border border-border-default">
      {/* Stylized "streets" texture */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        viewBox="0 0 400 280"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 70 H400 M0 150 H400 M0 220 H400" stroke="#C5D4E8" strokeWidth="2" />
        <path d="M70 0 V280 M180 0 V280 M300 0 V280" stroke="#C5D4E8" strokeWidth="2" />
        <path d="M0 0 L400 280 M400 0 L0 280" stroke="#D5E0EF" strokeWidth="1.5" />
      </svg>

      {/* "Lagos" label */}
      <span className="absolute top-3 left-3 text-[11px] font-semibold text-text-muted bg-white/80 px-2 py-1 rounded-full">
        Lagos
      </span>

      {/* Node pins */}
      {nodes.map((node) => {
        const position = PIN_POSITIONS[node.id] ?? { top: "50%", left: "50%" };
        const isSelected = selectedNodeId === node.id;

        return (
          <button
            key={node.id}
            type="button"
            onClick={() => onSelectNode(node.id)}
            style={{ top: position.top, left: position.left }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
            aria-label={`Select ${node.name}`}
            aria-pressed={isSelected}
          >
            <span
              className={cn(
                "flex items-center justify-center rounded-full border-2 border-white shadow-md transition-all duration-200",
                isSelected ? "w-9 h-9 bg-brand-blue scale-110" : "w-7 h-7 bg-brand-blue-light"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-white" />
            </span>
            {isSelected && (
              <span className="mt-1 text-[10px] font-semibold text-white bg-brand-navy px-2 py-0.5 rounded-full whitespace-nowrap shadow-md">
                {node.name}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
