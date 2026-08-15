"use client";

import type { ReactNode } from "react";

interface MapUnavailableProps {
  /** Kept selectable/announced for screen readers and keyboard users even without a visual map. */
  children?: ReactNode;
  className?: string;
}

/**
 * Shown wherever a map would be when no map provider key is configured.
 *
 * The point is that the surrounding screen stays *usable* — node
 * selection happens from the list below, not the map — so this states
 * what's missing and gets out of the way, rather than blocking the
 * flow behind a configuration error.
 */
export function MapUnavailable({ children, className }: MapUnavailableProps) {
  return (
    <div
      className={
        className ??
        "w-full h-full rounded-[18px] border border-dashed border-border-strong bg-bg-subtle flex flex-col items-center justify-center px-6 text-center gap-2"
      }
    >
      <span className="text-[22px]" aria-hidden="true">
        🗺️
      </span>
      <p className="text-[13px] font-semibold text-text-secondary">Map unavailable</p>
      <p className="text-[12px] text-text-muted max-w-[280px] leading-[1.5]">
        Add{" "}
        <code className="text-[11px] bg-bg-card px-1 py-0.5 rounded">
          NEXT_PUBLIC_GEOAPIFY_API_KEY
        </code>{" "}
        to <code className="text-[11px] bg-bg-card px-1 py-0.5 rounded">.env.local</code> to see
        locations here. Everything else on this screen still works.
      </p>
      {children}
    </div>
  );
}
