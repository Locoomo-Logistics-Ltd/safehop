/**
 * Node Operator domain types. A Node Operator runs **one or more**
 * Nodes (Pickup Stations) — the parcel custody chain itself runs
 * through `core/types/handoff.types.ts`; this file covers a Node's own
 * profile, its Activity Log, self-onboarding, and staff.
 *
 * Multi-Node (docs/API.md, 2026-09-02): the account↔Node relationship
 * is a *membership*, not a one-to-one profile. `GET
 * /node-operators/me/nodes` returns an array of them, each carrying a
 * `roleAtNode` (`owner` — the operator who created it — or `staff` —
 * someone the owner invited to work the counter). Everything Node-
 * scoped is keyed on `node.id` from here on: payout accounts, staff
 * invites, and Admin approval are all per-Node, never per-account.
 */

import type { PayoutAccountFields } from "./earnings.types";
import type { CreatePaymentIntentPayload } from "./payment.types";

export type ActivityEventType =
  | "handoff_to_rider"
  | "batch_received"
  | "scan_exception"
  | "node_closed"
  | "parcel_checked_in"
  | "parcel_released";

export interface ActivityLogEntry {
  id: string;
  type: ActivityEventType;
  title: string;
  description: string;
  timestamp: string;
  isException: boolean; // renders the red/warning variant
  tag?: string; // e.g. "12 Removed from inventory"
}

// ── Node Operator self-onboarding (multi-Node) ──────────────────
// POST /node-operators/onboarding, POST /node-operators/nodes and
// GET /node-operators/me/nodes are real, confirmed routes per
// docs/API.md — the second, self-service step of a NodeOperator
// account's registration: sets up a Node they'll run. Every Node is
// created "pending" and needs its own Admin approval
// (PATCH /node-operators/:id/approve, Admin-only) before it appears in
// /nodes or is usable — including the 2nd and 3rd Node of an operator
// whose account is already active.
//
// The two create routes take an identical body and return an identical
// shape; they differ only in which one the account is allowed to call:
// `onboarding` for the first Node (409 NODE_OPERATOR_ALREADY_ONBOARDED
// afterward), `nodes` for every one after it (400
// NODE_OPERATOR_NOT_ONBOARDED before).

export interface NodeOperatorOnboardingPayload {
  name: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  latitude: number;
  longitude: number;
  capacity: number;
  operatingHours?: string;
}

export type NodeOperatorNodeStatus = "pending" | "active" | "inactive" | "suspended";

/**
 * Which side of a Node this account sits on. `owner` created the Node
 * and is the only one who can set its payout account, invite staff to
 * it, or see its earnings; `staff` was invited by an owner and can do
 * the counter work (scan, drop-off, confirm-handoff, intake, collect)
 * and nothing else. Per-Node, not per-account — the same person can be
 * an owner at one Node and staff at another.
 */
export type NodeRoleAtNode = "owner" | "staff";

/** Raw Node shape as returned nested in the membership responses — see docs/API.md. */
export interface NodeOperatorNode {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  capacity: number;
  status: NodeOperatorNodeStatus;
  onboardingType: string;
  operatingHours: string | null;
  /**
   * Whether this Node is publicly discoverable (default `true`) —
   * toggled by its owner via `PATCH
   * /node-operators/nodes/:nodeId/visibility` (docs/API.md,
   * 2026-09-03).
   *
   * **This is not `status`.** `false` hides the Node from `GET /nodes`
   * and `GET /nodes/nearby` for non-Admins, and makes a
   * Consumer-initiated `POST /payments/intents` naming it — as origin
   * *or* destination — answer `404`. Everything else is unaffected: it
   * still runs handoffs, still earns, still keeps its staff, and can
   * still both send parcels (via `dispatch`) and receive ones another
   * operator dispatched to it. A Node whose owner has switched this
   * off is closed to the public, not switched off.
   *
   * Optional on this type because the field post-dates the Node shape:
   * a backend that hasn't shipped it yet simply omits it, and every
   * read site here treats `undefined` as `true` (the documented
   * default) rather than as "private".
   */
  isPubliclyVisible?: boolean;
  createdAt: string;
}

/**
 * Whether a Node takes public drop-offs. `undefined` means the backend
 * didn't send `isPubliclyVisible` at all, which per docs/API.md
 * defaults to `true` — never render a Node as private on a missing
 * field, that would wrongly tell an operator their station is hidden.
 */
export function isNodePubliclyVisible(node: Pick<NodeOperatorNode, "isPubliclyVisible">): boolean {
  return node.isPubliclyVisible !== false;
}

/**
 * One account↔Node membership — the shape every multi-Node route
 * returns: each item of `GET /node-operators/me/nodes`, and the whole
 * response of `POST /node-operators/onboarding`, `POST
 * /node-operators/nodes`, `PATCH /node-operators/nodes/:nodeId/payout-account`,
 * and `PATCH /node-operators/:id/approve`.
 *
 * `profileId` identifies the *membership*, not the user — it's what
 * Admin's approve route takes, and an operator with three Nodes has
 * three distinct ones. Also carries the five `payoutAccountFields`,
 * always present per docs/API.md (unset until this Node's
 * payout-account route is called), used to drive the "set up your
 * payout account" prompt per Node.
 */
export interface NodeMembership extends PayoutAccountFields {
  profileId: string;
  roleAtNode: NodeRoleAtNode;
  node: NodeOperatorNode;
}

/**
 * @deprecated Kept as an alias while call sites migrate — the
 * singular "one operator, one profile" framing this name carries is no
 * longer true (docs/API.md, 2026-09-02). Use `NodeMembership`.
 */
export type NodeOperatorProfile = NodeMembership;

// ── Node staff ──────────────────────────────────────────────────
// POST /node-operators/nodes/:nodeId/staff/invite — owner-only, and
// the Node must already be `active` (403 NODE_NOT_ACTIVE). Provisions
// a `node_staff` account through the same invite-email →
// POST /auth/invite/confirm mechanism Admin's POST /users/invite uses;
// `node_staff` is never self-registerable.

/** `POST /node-operators/nodes/:nodeId/staff/invite` request body. Responds with the same `UserResponseDto` an Admin invite does (`status: "invited"`, `role: "node_staff"`). */
export interface NodeStaffInvitePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/**
 * One row of `GET /node-operators/nodes/:nodeId/staff` — the Node's
 * currently-active staff, owner-only. Removed staff aren't listed, and
 * an owner never appears in their own Node's roster.
 *
 * `userId` is a **User** id, not a membership id, and this list is the
 * only place to recover it after the one-time invite response — which
 * is exactly what `DELETE .../staff/:userId` needs, so don't build a
 * remove action that isn't fed from this list.
 */
export interface NodeStaffMember {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
}

// ── Node visibility ─────────────────────────────────────────────
// PATCH /node-operators/nodes/:nodeId/visibility — owner-only, and the
// Node must already be `active`. See `NodeOperatorNode.isPubliclyVisible`
// above for what this actually controls (less than the word "visibility"
// suggests, and much less than "deactivate" would).

/** `PATCH /node-operators/nodes/:nodeId/visibility` request body. Responds with the updated `NodeMembership`. */
export interface NodeVisibilityPayload {
  isPubliclyVisible: boolean;
}

// ── Dispatch ────────────────────────────────────────────────────
// POST /node-operators/nodes/:nodeId/dispatch — the operator's own
// outbound parcel, no Consumer involved. NodeOperator *or* NodeStaff
// with a membership at the Node (operational work, not owner-gated).

/**
 * `POST /node-operators/nodes/:nodeId/dispatch` request body —
 * `CreatePaymentIntentPayload` minus `originNodeId`, which the URL
 * supplies instead so a dispatcher can't point an order at a Node they
 * don't run. The response is an ordinary `PaymentIntent`,
 * `authorizationUrl` included: dispatch reuses the same Paystack
 * hosted-checkout flow a Consumer booking does.
 */
export type DispatchParcelPayload = Omit<CreatePaymentIntentPayload, "originNodeId">;
