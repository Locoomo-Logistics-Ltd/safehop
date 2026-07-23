"use client";

import { cn } from "@/lib/utils";
import type { ShelfLocation } from "@/core/types";

interface ShelfLocationPickerProps {
  shelves: ShelfLocation[];
  selectedId: string | null;
  onSelect: (shelfId: string) => void;
}

/**
 * Grid of shelf buttons grouped by rack (Rack A, Rack B), matching
 * the Figma "Assign Shelf Location" step. Occupied shelves are
 * disabled — same visual treatment as the Figma's greyed "A6" slot.
 */
export function ShelfLocationPicker({ shelves, selectedId, onSelect }: ShelfLocationPickerProps) {
  const racks = groupByRack(shelves);

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(racks).map(([rackLabel, rackShelves]) => (
        <div key={rackLabel}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
            {rackLabel}
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {rackShelves.map((shelf) => {
              const isSelected = selectedId === shelf.id;
              return (
                <button
                  key={shelf.id}
                  type="button"
                  disabled={shelf.isOccupied}
                  onClick={() => onSelect(shelf.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "h-12 rounded-[10px] border-2 font-display font-semibold text-[14px] transition-all duration-150",
                    shelf.isOccupied
                      ? "border-border-default bg-bg-subtle text-text-muted cursor-not-allowed"
                      : isSelected
                        ? "border-brand-navy bg-brand-navy text-white"
                        : "border-border-default bg-bg-card text-text-primary hover:border-border-strong"
                  )}
                >
                  {shelf.id}
                  {shelf.isOccupied && <span className="ml-1 text-[10px]">🔒</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupByRack(shelves: ShelfLocation[]): Record<string, ShelfLocation[]> {
  return shelves.reduce<Record<string, ShelfLocation[]>>((acc, shelf) => {
    acc[shelf.rackLabel] = acc[shelf.rackLabel] ?? [];
    acc[shelf.rackLabel].push(shelf);
    return acc;
  }, {});
}
