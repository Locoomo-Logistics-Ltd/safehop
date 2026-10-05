"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDownIcon,
  CheckCircleIcon,
  EyeOffIcon,
  MapPinIcon,
  PlusIcon,
} from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { isNodePubliclyVisible } from "@/core/types";
import { cn } from "@/lib/utils";
import { useMyNodes } from "@/modules/node/hooks/use-my-nodes";
import { NodeStatusBadge } from "./NodeStatusBadge";

/**
 * Which Node the operator is standing at — the header control on every
 * Node-scoped screen (Home, Activity), and the only way to change the
 * selection `use-my-nodes.ts` holds.
 *
 * Renders as plain, non-interactive text when there's exactly one Node
 * (the overwhelmingly common case, and what every operator saw before
 * multi-Node) so a single-station member isn't given a menu that only
 * ever contains one thing.
 *
 * **Staff get this too, in full.** Someone invited to a station is
 * running that counter, so it's named here for them exactly as it is
 * for its owner, someone invited to two can switch between them, and
 * the footer link into My Stations works for them the same way — it's
 * a real, working read-only list of the stations they're on, not a
 * screen with nothing on it. Only its label adapts, since staff can't
 * add a station or approve one.
 *
 * Built as a details-style popover from primitives rather than a shared
 * component: `components/ui` has no menu/popover primitive, and the two
 * existing dropdowns in the app (`AdminSelect`, the bank picker in
 * `PayoutAccountCard`) are native `<select>`s, which can't render a
 * status pill per option or an "add another" action at the bottom.
 */
export function NodeSwitcher({ className }: { className?: string }) {
  const { nodes, activeMembership, setActiveNodeId, isStaff } = useMyNodes();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on an outside click or Escape — the two dismissals a popover
  // is expected to have, and the reason this can't just be CSS hover.
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!activeMembership) return null;

  const { node } = activeMembership;

  if (nodes.length === 1) {
    return (
      <div className={cn("min-w-0", className)}>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-[18px] md:text-[22px] font-bold text-text-primary truncate">
            {node.name}
          </h1>
          <NodeStatusBadge status={node.status} />
        </div>
        <p className="text-[13px] text-text-muted mt-0.5 truncate">{node.address}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative min-w-0", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex flex-col items-start text-left min-w-0 max-w-full group"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="font-display text-[18px] md:text-[22px] font-bold text-text-primary truncate">
            {node.name}
          </span>
          <ChevronDownIcon
            size={16}
            className={cn(
              "text-text-muted shrink-0 transition-transform duration-150",
              isOpen && "rotate-180"
            )}
          />
          <NodeStatusBadge status={node.status} />
        </span>
        <span className="text-[13px] text-text-muted mt-0.5 truncate max-w-full">
          {node.address}
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-2 z-40 w-[min(320px,calc(100vw-2rem))] rounded-[14px] border border-border-default bg-bg-card shadow-[var(--shadow-raised)] overflow-hidden"
        >
          <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Your stations
          </p>

          {nodes.map((membership) => {
            const isActive = membership.node.id === node.id;
            return (
              <button
                key={membership.profileId}
                type="button"
                role="menuitem"
                onClick={() => {
                  setActiveNodeId(membership.node.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors",
                  isActive ? "bg-status-info-bg" : "hover:bg-bg-subtle"
                )}
              >
                <span className="w-7 h-7 rounded-[9px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0 mt-0.5">
                  <MapPinIcon size={14} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[13px] font-semibold text-text-primary truncate">
                      {membership.node.name}
                    </span>
                    {membership.roleAtNode === "staff" && (
                      <span className="text-[10px] font-semibold text-text-muted shrink-0">
                        Staff
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-text-muted truncate">
                    {membership.node.address}
                  </span>
                  <span className="flex items-center gap-1.5 mt-1">
                    <NodeStatusBadge status={membership.node.status} />
                    {!isNodePubliclyVisible(membership.node) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-status-neutral">
                        <EyeOffIcon size={10} />
                        Not public
                      </span>
                    )}
                  </span>
                </span>
                {isActive && (
                  <CheckCircleIcon size={15} className="text-brand-blue shrink-0 mt-1" />
                )}
              </button>
            );
          })}

          <div className="h-px bg-border-default" />
          <Link
            href={ROUTES.nodeSetup}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-3 text-[13px] font-semibold text-brand-blue hover:bg-bg-subtle transition-colors"
          >
            {/* PlusIcon reads correctly for an owner (that screen's
                where "Add Another Station" lives); staff get a neutral
                icon since there's nothing to add from there. */}
            {isStaff ? <MapPinIcon size={15} /> : <PlusIcon size={15} />}
            {isStaff ? "View stations" : "Manage stations"}
          </Link>
        </div>
      )}
    </div>
  );
}
