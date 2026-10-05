"use client";

import { Card } from "@/components/ui";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { isNodePubliclyVisible } from "@/core/types";
import { useNodeVisibility } from "@/modules/node/hooks/use-node-visibility";
import type { NodeOperatorNode } from "@/core/types";

/**
 * The public drop-offs switch — `PATCH
 * /node-operators/nodes/:nodeId/visibility` (docs/API.md, 2026-09-03).
 * Owner-only, and only meaningful on an `active` Node (the route
 * answers `403 NODE_NOT_ACTIVE` otherwise), so it renders disabled with
 * an explanation rather than firing a request that can't succeed.
 *
 * **Labelled "Public drop-offs", not "Deactivate station"** — that
 * wording would be wrong in a way that costs an operator real parcels.
 * Switching this off doesn't stop the station: handoffs, earnings,
 * staff, and parcels other operators dispatch to it all keep working.
 * It only removes the station from customer-facing listings and blocks
 * a Consumer booking it. An operator who read "deactivated" would stop
 * checking their counter while parcels kept arriving. Genuine
 * deactivation (`status: inactive`) is Admin-only and isn't exposed
 * here at all.
 *
 * The copy under the switch therefore always states what *keeps*
 * working, not just what stops.
 */
export function NodeVisibilityCard({ node }: { node: NodeOperatorNode }) {
  const { setVisibility, isSaving } = useNodeVisibility(node.id);
  const isVisible = isNodePubliclyVisible(node);
  const isNodeActive = node.status === "active";
  const isDisabled = !isNodeActive || isSaving;

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
        Public Drop-offs
      </p>

      <Card padding="md">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0",
              isVisible
                ? "bg-status-success-bg text-status-success"
                : "bg-status-neutral-bg text-status-neutral"
            )}
          >
            {isVisible ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-text-primary">
              {isVisible ? "Open to customers" : "Closed to customers"}
            </p>
            <p className="text-[12px] text-text-secondary mt-0.5 leading-normal">
              {isVisible
                ? "This station is listed for customers and they can send parcels to and from it."
                : "Customers can't find this station or send parcels to it. It still handles handoffs, still earns, and can still send and receive your own parcels."}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isVisible}
            aria-label="Public drop-offs"
            disabled={isDisabled}
            onClick={() => setVisibility(!isVisible)}
            className={cn(
              "relative shrink-0 w-11 h-6 rounded-full transition-colors duration-150 mt-0.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40",
              isVisible ? "bg-brand-blue" : "bg-border-strong",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-150",
                isVisible ? "translate-x-[22px]" : "translate-x-5"
              )}
            />
          </button>
        </div>

        {!isNodeActive && (
          <p className="text-[12px] text-status-warning font-medium mt-3">
            You can change this once this station is approved.
          </p>
        )}
      </Card>
    </div>
  );
}
