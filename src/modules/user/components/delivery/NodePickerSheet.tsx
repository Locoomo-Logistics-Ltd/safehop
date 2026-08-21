"use client";

import { SearchIcon, XIcon, MapPinIcon, NavigationIcon } from "@/components/icons";
import { Input } from "@/components/ui";
import { NodeListItem } from "./NodeListItem";
import type { PickupNode } from "@/core/types";

interface NodePickerSheetProps {
  title: string;
  /** Nodes to render, already filtered/sorted by the screen (text match, or by distance to a searched address). */
  nodes: PickupNode[];
  isLoading: boolean;
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
  onClose: () => void;

  searchValue: string;
  onSearchChange: (value: string) => void;

  /** Whether an address-proximity search (vs. plain name/city text match) is available — hidden entirely when no geocoding API key is configured, same graceful-degradation pattern as `AddressGeocodeButton`. */
  addressSearchAvailable: boolean;
  onSearchAddress: () => void;
  isSearchingAddress: boolean;
  searchAddressError: string | null;
  /** Set once an address search resolves — the list below is then every node sorted by distance to it, not text-filtered. */
  searchedAddressLabel: string | null;
  onClearAddressSearch: () => void;
}

/**
 * Full node list, in a pull-up sheet — opened from `NodePickerField`.
 * Same overlay/handle pattern as `VerificationReminderSheet`/
 * `MoreNavSheet`. Two ways to narrow the list, both through the same
 * input: type a station/city name for an instant local filter, or type
 * a real address and tap the pin button to geocode it and re-sort every
 * node by distance to that address instead of the user's own location —
 * for picking a station near someone else's address (the receiver's,
 * a friend's), not just near wherever the sender happens to be standing.
 */
export function NodePickerSheet({
  title,
  nodes,
  isLoading,
  selectedNodeId,
  onSelect,
  onClose,
  searchValue,
  onSearchChange,
  addressSearchAvailable,
  onSearchAddress,
  isSearchingAddress,
  searchAddressError,
  searchedAddressLabel,
  onClearAddressSearch,
}: NodePickerSheetProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button className="absolute inset-0 bg-black/50" aria-label="Dismiss" onClick={onClose} />

      <div
        className="relative bg-bg-card rounded-t-[24px] pt-3 max-w-[560px] w-full mx-auto flex flex-col"
        style={{ maxHeight: "85vh" }}
      >
        <div className="w-10 h-1 rounded-full bg-border-strong mx-auto mb-3 shrink-0" />

        <div className="flex items-center justify-between px-4 pb-3 shrink-0">
          <h2 className="font-display text-[16px] font-bold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-bg-subtle transition-colors"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="px-4 pb-3 shrink-0">
          <Input
            autoFocus
            placeholder="Search by station name, or type an address"
            leftElement={<SearchIcon size={16} />}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSearchAddress();
              }
            }}
            rightElement={
              addressSearchAvailable ? (
                <button
                  type="button"
                  onClick={onSearchAddress}
                  disabled={isSearchingAddress || !searchValue.trim()}
                  aria-label="Find stations near this address"
                  className="pointer-events-auto w-7 h-7 rounded-full flex items-center justify-center text-brand-blue disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSearchingAddress ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-brand-blue/30 border-t-brand-blue animate-spin" />
                  ) : (
                    <NavigationIcon size={15} />
                  )}
                </button>
              ) : undefined
            }
          />

          {addressSearchAvailable && !searchedAddressLabel && (
            <p className="text-[11px] text-text-muted mt-1.5">
              Type a station name to filter, or an address and tap{" "}
              <NavigationIcon size={11} className="inline -mt-0.5" /> to find stations nearby.
            </p>
          )}

          {searchAddressError && (
            <p className="text-[11px] text-status-danger mt-1.5">{searchAddressError}</p>
          )}

          {searchedAddressLabel && (
            <div className="flex items-center justify-between gap-2 mt-2 px-3 py-2 rounded-[10px] bg-status-info-bg">
              <p className="text-[12px] text-brand-blue truncate min-w-0">
                <MapPinIcon size={12} className="inline -mt-0.5 mr-1" />
                Showing stations near <span className="font-semibold">{searchedAddressLabel}</span>
              </p>
              <button
                type="button"
                onClick={onClearAddressSearch}
                className="text-[11px] font-semibold text-brand-blue shrink-0"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-2.5">
          {isLoading ? (
            <p className="text-[13px] text-text-muted text-center py-6">Loading nodes…</p>
          ) : nodes.length === 0 ? (
            <p className="text-[13px] text-text-muted text-center py-6">
              {searchValue.trim() && !searchedAddressLabel
                ? `No stations match "${searchValue}"`
                : "No stations available yet."}
            </p>
          ) : (
            nodes.map((node) => (
              <NodeListItem
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={(id) => {
                  onSelect(id);
                  onClose();
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
