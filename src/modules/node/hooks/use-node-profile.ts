"use client";

import { isNodePubliclyVisible } from "@/core/types";
import { useMyNodes } from "./use-my-nodes";

/**
 * The Node the member is currently working at — name, address,
 * capacity, approval status, payout state — resolved by `useMyNodes`
 * plus the active-Node selection (an owner's from `GET
 * /node-operators/me/nodes` directly; a staff member's reconstructed
 * from order history + per-Node lookups, since that route 403s them —
 * see `use-my-nodes.ts`'s header for the full story).
 *
 * Kept as its own hook (rather than folding callers into `useMyNodes`)
 * because the dashboard only ever cares about the *one* Node in front
 * of it: this is the seam where "which Node" stops mattering and
 * screens can go back to reading a single object, exactly as they did
 * before multi-Node landed.
 *
 * Owner or staff — both resolve a real station here, once one is
 * discoverable. A staff member invited to Yaba Node gets Yaba Node
 * from this hook, with its real status and capacity, not a
 * placeholder; `isOwnerOfActiveNode` is what decides whether they may
 * change anything about it.
 */
export function useNodeProfile() {
  const {
    activeNode,
    activeMembership,
    isOwnerOfActiveNode,
    isStaff,
    isLoading,
    notOnboarded,
    hasNoStationsYet,
    error,
    isError,
  } = useMyNodes();

  return {
    node: activeNode,
    membership: activeMembership,
    isOwnerOfActiveNode,
    isStaff,
    /**
     * Whether this station takes public drop-offs. `undefined` while
     * there's no Node loaded — screens branch on `=== false` so a
     * loading session never renders the "closed to the public" state
     * by accident.
     */
    isPubliclyVisible: activeNode ? isNodePubliclyVisible(activeNode) : undefined,
    payoutAccountConfigured: activeMembership?.payoutAccountConfigured,
    isLoading,
    notOnboarded,
    hasNoStationsYet,
    error,
    isError,
  };
}
