"use client";

import { useEffect, useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { nodeService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { isApiError } from "@/core/api/errors";
import { useActiveNodeStore } from "@/store/active-node.store";
import { useCurrentUser } from "@/store/auth.store";
import { myNodeId, myNodeName, useRawMyNodeOrders } from "./use-raw-node-orders";
import type { NodeMembership, NodeOperatorNode } from "@/core/types";

/**
 * Every Node this account has a stake at, plus which one the counter
 * screens are currently scoped to. **This is the single source for "my
 * Nodes" in the app** — `useNodeProfile`, `useNodeSetup` and
 * `useNodeDashboard` are all thin wrappers over this, so the list is
 * resolved once and the active selection can't disagree between
 * screens.
 *
 * ---
 *
 * **Two genuinely different data sources feed this hook, by role, and
 * this is a live-backend-confirmed fact, not a design choice:**
 *
 * - An **owner** (`node_operator`) calls `GET /node-operators/me/nodes`
 *   directly. Real, confirmed, works exactly as docs/API.md describes.
 *
 * - A **staff member** (`node_staff`) cannot call that route — it
 *   answers a plain `403 FORBIDDEN` on the live backend (confirmed
 *   2026-09-08), despite the response shape's own `roleAtNode: "staff"`
 *   value implying otherwise. This hook briefly called it for staff too
 *   on the strength of that field ("a list only an owner could call
 *   would never need a staff value"), and that theory was wrong for
 *   *this* deployed backend — it 403s in practice, whatever the schema
 *   implies. Compare the two routes' own doc text: `/handoffs/
 *   my-node/orders` spells out "**NodeOperator or NodeStaff**" and
 *   explains why; `/node-operators/me/nodes` says only "an
 *   authenticated NodeOperator session," with no such qualifier. That
 *   asymmetry, confirmed by the live 403, is the real signal — every
 *   route in this API that admits staff says so explicitly.
 *
 *   So for staff this hook reconstructs the same `NodeMembership[]`
 *   shape from two routes that ARE confirmed open to them:
 *     1. `GET /handoffs/my-node/orders` (via `useMyNodeOrders`) —
 *        every order that's touched a Node they belong to, which is
 *        the *only* place a staff session's Node id(s) appear anywhere
 *        in this API. `myNodeId()`/`myNodeName()` pull the distinct
 *        station(s) out of it.
 *     2. `GET /nodes/:id` (`nodeService.getNodeById`, via `useQueries`
 *        run in parallel, one per discovered id) — open to any
 *        authenticated role, and what supplies the real capacity,
 *        status, and `isPubliclyVisible` a placeholder can't: this
 *        hook never fabricates those, it either has the real values or
 *        it's still loading.
 *
 *   **The real limitation this leaves**, honestly: a brand-new staff
 *   invite whose station has never had a single order has no id to
 *   discover this way, and there is currently no endpoint that closes
 *   that gap — not a route this file could call differently, an actual
 *   hole in the API for that one case. `hasNoStationsYet` covers it
 *   with copy that doesn't pretend otherwise. The fix that actually
 *   closes it is either opening `GET /node-operators/me/nodes` to
 *   NodeStaff, or a dedicated "my staff memberships" route — flagged in
 *   `docs/API_INTEGRATION_STATUS.md`.
 *
 * ---
 *
 * `roleAtNode` gates only what a member may *change* — payout account,
 * public visibility, and the team are owner-only, and each of those
 * routes answers `404` for a staff membership, so their UI is hidden
 * rather than rendered-and-failing. Everything operational (handoffs,
 * dispatch, activity, seeing the station itself) is open to both.
 *
 * Not-onboarded is an empty array, not a `404`, for an owner — the old
 * singular route answered `404` and every caller trapped that code.
 * What an empty result *means* differs by role, and
 * `notOnboarded`/`hasNoStationsYet` below keep those apart: an owner
 * with none needs the "set up your first station" form (never shown to
 * staff — creating a Node needs the `node_operator` role), while a
 * staff member with none is either not yet invited or invited to a
 * station with no order history yet to discover it by.
 */
export function useMyNodes() {
  const user = useCurrentUser();
  const isStaff = user?.role === "node_staff";

  const activeNodeId = useActiveNodeStore((s) => s.activeNodeId);
  const setActiveNodeId = useActiveNodeStore((s) => s.setActiveNodeId);
  const hydrate = useActiveNodeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // ── Owner path: the real, direct route ──────────────────────────
  const ownerQuery = useQuery({
    queryKey: QUERY_KEYS.nodeOperatorNodes,
    queryFn: () => nodeService.getMyNodes(),
    // Never call the owner-only route for a staff session — it's a
    // confirmed 403, not a maybe. See this hook's header.
    enabled: !isStaff,
    retry: false,
  });

  // ── Staff path: reconstructed from orders + per-Node lookups ────
  // `enabled: isStaff` on both layers below — an owner's `nodes` never
  // touches this branch, so it costs an owner session nothing.
  const {
    orders: staffOrders,
    isLoading: isOrdersLoading,
    error: ordersError,
    refetch: refetchStaffOrders,
  } = useRawMyNodeOrders();

  const staffNodeIds = useMemo(() => {
    if (!isStaff) return [];
    const seen = new Map<string, string>(); // id -> best-known name
    for (const order of staffOrders) {
      const id = myNodeId(order);
      if (!seen.has(id)) seen.set(id, myNodeName(order));
    }
    return Array.from(seen.keys());
  }, [isStaff, staffOrders]);

  const staffNodeDetailQueries = useQueries({
    queries: staffNodeIds.map((nodeId) => ({
      queryKey: QUERY_KEYS.nodeStationDetail(nodeId),
      queryFn: () => nodeService.getNodeById(nodeId),
      enabled: isStaff,
      retry: false,
    })),
  });

  const isStaffDetailsLoading = staffNodeDetailQueries.some((q) => q.isLoading);

  // A `404` here means "this Node exists but isn't `active`" per
  // `GET /nodes/:id`'s own documented non-Admin behavior — reachable
  // if a station a staff member was invited to (only possible once
  // `active`) is later suspended/deactivated by Admin. That's not a
  // fetch failure worth surfacing as an error for the *whole* list,
  // especially for a staff member on several stations where the rest
  // are perfectly fine — it just means this one station quietly drops
  // out, same as an owner's suspended Node would stop appearing
  // wherever visibility is enforced. Any other error (network, 500,
  // …) is a real problem and is surfaced.
  const staffDetailsError = staffNodeDetailQueries.find(
    (q) => q.error && !(isApiError(q.error) && q.error.code === "NOT_FOUND")
  )?.error;

  const staffNodes = useMemo<NodeMembership[]>(() => {
    if (!isStaff) return [];
    const memberships: NodeMembership[] = [];
    staffNodeDetailQueries.forEach((detailQuery, index) => {
      const node = detailQuery.data as NodeOperatorNode | undefined;
      if (!node) return; // still loading, 404'd (see above), or a real error — never fabricate a fake Node record
      memberships.push({
        // Synthetic — there's no membership id anywhere in the API for
        // a staff session (that's the whole gap this hook works
        // around). Only ever used as a React list key; nothing here
        // sends it back to the server the way an owner's real
        // `profileId` gets sent to Admin's approve route.
        profileId: `staff-${staffNodeIds[index]}`,
        roleAtNode: "staff",
        node,
        // A staff membership has no payout account anywhere in the
        // API — these are never read for `roleAtNode: "staff"` (every
        // payout surface is owner-gated), so "not configured" is
        // correct by construction, not a guess.
        payoutAccountConfigured: false,
        payoutBankCode: null,
        payoutBankName: null,
        payoutAccountNumber: null,
        payoutAccountName: null,
      });
    });
    return memberships;
  }, [isStaff, staffNodeDetailQueries, staffNodeIds]);

  // ── Merge the two paths into one shape everything below reads ───
  const ownerNodes = ownerQuery.data;
  const nodes = useMemo(
    () => (isStaff ? staffNodes : ownerNodes ?? []),
    [isStaff, staffNodes, ownerNodes]
  );

  const isSourceLoading = isStaff
    ? isOrdersLoading || (staffNodeIds.length > 0 && isStaffDetailsLoading)
    : ownerQuery.isLoading;

  // A staff session's "no stations" is only knowable once every query
  // that feeds it has actually resolved — never while still loading.
  // For staff, wait for every discovered id's detail lookup to settle
  // before deciding the list is empty — not just the orders query.
  // This also covers a rarer edge case correctly: a station discovered
  // via order history that's since been suspended (so `GET /nodes/:id`
  // now 404s it, silently dropped above) ends up here too rather than
  // stuck in a stale "still loading" or mislabeled "pending" state.
  const sourceSucceededEmpty = isStaff
    ? !isOrdersLoading &&
      !ordersError &&
      !isStaffDetailsLoading &&
      !staffDetailsError &&
      staffNodes.length === 0
    : ownerQuery.isSuccess && (ownerQuery.data?.length ?? 0) === 0;

  const sourceError = isStaff ? ordersError ?? staffDetailsError : ownerQuery.error;
  const isSourceError = isStaff ? !!sourceError : ownerQuery.isError;

  // Nodes this account actually controls, as opposed to ones it was
  // invited to work at. Anything owner-gated server-side — payout
  // accounts, visibility, staff — should be driven off this, not
  // `nodes`, so the UI never offers an action the API will 404.
  const ownedNodes = useMemo(
    () => nodes.filter((membership) => membership.roleAtNode === "owner"),
    [nodes]
  );

  // Resolution order: the persisted selection if it's still a Node we
  // have, else the first *active* one (the only kind that can actually
  // take parcels), else the first of any status — a brand-new operator
  // with one pending Node should still see it named on their dashboard
  // rather than an empty switcher.
  const activeMembership = useMemo(() => {
    if (nodes.length === 0) return undefined;
    return (
      nodes.find((membership) => membership.node.id === activeNodeId) ??
      nodes.find((membership) => membership.node.status === "active") ??
      nodes[0]
    );
  }, [nodes, activeNodeId]);

  // Write the resolved id back whenever it drifts from what's stored —
  // covers first login (nothing stored), a Node that was suspended or
  // removed from this account, a staff membership that was revoked, and
  // a stale id left behind by a different account on a shared device.
  useEffect(() => {
    const resolvedId = activeMembership?.node.id ?? null;
    if (resolvedId !== activeNodeId) setActiveNodeId(resolvedId);
  }, [activeMembership, activeNodeId, setActiveNodeId]);

  const hasNoStationsYet = sourceSucceededEmpty;

  return {
    /** Every membership, owner and staff alike, in the order the API returned them (staff: reconstructed, see this hook's header). */
    nodes,
    /** Just the ones with an `owner` membership — gate payout/visibility/team UI on this. */
    ownedNodes,
    /** The membership the counter screens are scoped to, or `undefined` while loading / with no stations at all. */
    activeMembership,
    /** Convenience: the active membership's Node. */
    activeNode: activeMembership?.node,
    /** Whether the signed-in account owns the active Node (vs. being staff at it). */
    isOwnerOfActiveNode: activeMembership?.roleAtNode === "owner",
    /** True for a `node_staff` session — use it to choose *copy* and which fetch path runs, never to hide a station that's actually there. */
    isStaff,
    setActiveNodeId,

    isLoading: isSourceLoading,
    /**
     * An **owner** with no stations — the "set up your first Pickup
     * station" state. Deliberately false for staff: they can't create
     * one, so showing them that form would be a dead end.
     */
    notOnboarded: hasNoStationsYet && !isStaff,
    /**
     * No stations at all, whoever's asking. For staff this specifically
     * means "no order has ever touched a station I belong to" — see
     * this hook's header for why that's the honest limit of what the
     * client can currently know, not a proxy for "never invited."
     */
    hasNoStationsYet,
    /** A genuine fetch failure — the empty-list states above are not errors. */
    error: sourceError,
    isError: isSourceError,
    /** Re-runs whichever source is actually live for this role — the direct list for an owner, orders + every discovered station's detail lookup for staff. */
    refetch: isStaff
      ? () => {
          refetchStaffOrders();
          staffNodeDetailQueries.forEach((q) => q.refetch());
        }
      : ownerQuery.refetch,
  };
}
