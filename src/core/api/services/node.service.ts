
import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
import { ApiError } from "@/core/api/errors";
import type { PaginatedList } from "@/core/api/types";
import type {
  BankOption,
  CollectParcelPayload,
  CollectionCodeResendResult,
  ConfirmHandoffPayload,
  DispatchParcelPayload,
  HandoffOrderPreview,
  HandoffOrderSummary,
  MyRevenueSplitEntry,
  NodeMembership,
  NodeOperatorNode,
  NodeOperatorOnboardingPayload,
  NodeOrderSummary,
  NodeStaffInvitePayload,
  NodeStaffMember,
  NodeVisibilityPayload,
  PaymentIntent,
  PayoutAccountPayload,
  User,
} from "@/core/types";

/**
 * Node service — the business-logic surface for the Node Operator role
 * (the person who owns/runs one Node, a Pickup Station — formerly
 * previously labeled "Vendor" in this codebase; renamed throughout to match the
 * real backend role, `node_operator`).
 *
 * A dedicated Activity Log has no endpoint of its own, and doesn't
 * need one: `ActivityScreen` sources it from `getMyNodeOrders()`
 * (`GET /handoffs/my-node/orders`) — real order data, mapped into the
 * `ActivityLogEntry` shape its list items render. An older
 * `listActivity()` that read the undocumented
 * `GET /notifications/user/{userId}` lost its last caller 2026-08-17
 * and was **deleted 2026-08-21** in the pre-production cleanup, along
 * with the whole `notifications.*` endpoint group — none of it appears
 * in docs/API.md.
 *
 * The whole parcel custody chain runs through the `handoffs` methods at
 * the bottom of this file — consumer drop-off, rider pickup/arrival,
 * and receiver collection. `onboardNode` / `addNode` / `getMyNodes`
 * wire the self-service Node setup routes (`POST
 * /node-operators/onboarding`, `POST /node-operators/nodes`, `GET
 * /node-operators/me/nodes`) — all real, confirmed per docs/API.md.
 * `getMyNodeEarnings` (`GET /earnings/my-node`) is the operator's Nodes'
 * revenue-split entries — real, confirmed per docs/API.md.
 *
 * **Multi-Node (2026-09-02).** `getMyNodeOperatorProfile()` is gone
 * along with the singular `GET /node-operators/me` route it called —
 * one account now has many Node memberships, so `getMyNodes()` returns
 * an array (empty, never 404, when onboarding hasn't happened) and
 * `setPayoutAccount`/`inviteNodeStaff` take the `nodeId` they act on.
 * If you're looking for the old single-profile call, the array's
 * currently-selected entry is what replaced it — see
 * `modules/node/hooks/use-my-nodes.ts`.
 *
 * (The undocumented `/nodes/operator/inventory` endpoint this file used
 * to fall back to — via a since-removed `listParcels()`/
 * `mapInventoryResponse()` backing the dead Flag Issue screen — is gone
 * entirely; it isn't in docs/API.md and 404s on the deployed backend.)
 */

const realNodeService = {
  async setPin(): Promise<{ success: true }> {
    // No PIN concept in the real API — NodeOperator auth is the same
    // POST /auth/register (role: "node_operator") + POST /auth/login
    // every role shares, handled entirely by
    // authService.registerConsumer / loginConsumer instead.
    throw new ApiError({ message: "Use authService.registerConsumer / loginConsumer instead.", code: "NOT_IMPLEMENTED" });
  },

  /**
   * Real, confirmed route — self-service setup of the operator's
   * **first** Node, the second step of NodeOperator registration.
   * Answers `409 NODE_OPERATOR_ALREADY_ONBOARDED` once that's done;
   * every Node after the first goes through `addNode` below instead.
   */
  async onboardNode(payload: NodeOperatorOnboardingPayload): Promise<NodeMembership> {
    return httpClient.post<NodeMembership>(ENDPOINTS.nodeOperators.onboarding, payload);
  },

  /**
   * Real, confirmed route — adds a 2nd, 3rd, … Node to an account
   * that's already completed `onboardNode`, with no second
   * registration or login. Identical body and response; the new Node
   * lands `pending` with its own Admin-approval gate, exactly like the
   * first one did. `400 NODE_OPERATOR_NOT_ONBOARDED` if `onboardNode`
   * was never called — the two aren't interchangeable, which is why
   * `useNodeSetup` picks between them on the current list being empty.
   */
  async addNode(payload: NodeOperatorOnboardingPayload): Promise<NodeMembership> {
    return httpClient.post<NodeMembership>(ENDPOINTS.nodeOperators.nodes, payload);
  },

  /**
   * Every Node this account **owns** a membership at, each tagged
   * `roleAtNode` and carrying that Node's own approval status and
   * payout fields.
   *
   * **NodeOperator-only in practice, despite the schema's own
   * `roleAtNode: "staff"` value implying otherwise** — confirmed
   * against the live backend 2026-09-08: a `node_staff` session gets a
   * plain `403 FORBIDDEN` here, not the staff-tagged rows the response
   * shape's own field suggests it should return. Treat docs/API.md's
   * literal "Requires an authenticated NodeOperator session" as
   * accurate, not as loose module wording — this route is one place it
   * genuinely isn't. Never call this for a `node_staff` session; see
   * `modules/node/hooks/use-my-nodes.ts` for the fallback that
   * reconstructs a staff session's station(s) from
   * `getMyNodeOrders()` + `getNodeById()` instead, both of which are
   * confirmed open to NodeStaff.
   *
   * Returns `[]`, not `404`, when an owner hasn't onboarded yet —
   * callers check for an empty array rather than trapping an error
   * code, which is the one behavioural difference from the singular
   * route this replaced.
   */
  async getMyNodes(): Promise<NodeMembership[]> {
    return httpClient.get<NodeMembership[]>(ENDPOINTS.nodeOperators.myNodes);
  },

  /**
   * One Node's full record — `GET /nodes/:id`, open to **any**
   * authenticated role per docs/API.md (unlike `getMyNodes` above,
   * which live-tested `403 FORBIDDEN` for a `node_staff` session on
   * 2026-09-08 despite that route's own `roleAtNode` field having a
   * `"staff"` value — the schema implies staff support the deployed
   * backend doesn't actually grant yet; see `use-my-nodes.ts` for how
   * that gap is worked around).
   *
   * This is what lets a staff session get real Node details —
   * capacity, status, `isPubliclyVisible`, operating hours — for a
   * station whose id it already knows (from `GET
   * /handoffs/my-node/orders`, which the docs *do* confirm staff can
   * call). `NodeOperatorNode`'s fields already match this route's
   * response 1:1, so no mapping function is needed the way
   * `nodesService.getById` needs one for its narrower Consumer-facing
   * `PickupNode` shape.
   */
  async getNodeById(nodeId: string): Promise<NodeOperatorNode> {
    return httpClient.get<NodeOperatorNode>(ENDPOINTS.adminNodes.detail(nodeId));
  },

  // ── Payout account ───────────────────────────────────────────────
  // Real, confirmed routes per docs/API.md — the bank account Admin
  // disburses this Node's earned revenue-split entries to.

  /** Paystack's full bank list, for the bank picker ahead of `setPayoutAccount`. Not paginated. */
  async getPayoutBanks(): Promise<BankOption[]> {
    return httpClient.get<BankOption[]>(ENDPOINTS.payments.banks);
  },

  /**
   * Sets (or replaces) **one Node's** payout bank account. Payout
   * accounts are per-Node, not shared across every Node the operator
   * runs, and only an `owner` membership may set one — a `staff`
   * member gets the same `404 NOT_FOUND` a non-member does, since
   * whether the Node exists at all isn't revealed.
   *
   * Verified against Paystack server-side at submission time —
   * `payoutAccountName` on the response is whatever Paystack resolved,
   * never what was sent. `400 BANK_ACCOUNT_VERIFICATION_FAILED` means
   * Paystack couldn't resolve that account number at that bank;
   * nothing is saved and any previously-verified account is untouched.
   */
  async setPayoutAccount(
    nodeId: string,
    payload: PayoutAccountPayload
  ): Promise<NodeMembership> {
    return httpClient.patch<NodeMembership>(
      ENDPOINTS.nodeOperators.payoutAccount(nodeId),
      payload
    );
  },

  /**
   * Provisions a `node_staff` account at one of the operator's Nodes —
   * owner-only, and the Node must already be Admin-approved
   * (`403 NODE_NOT_ACTIVE` otherwise: there's nothing for staff to
   * work at yet).
   *
   * Goes through the exact same mechanism as an Admin's
   * `POST /users/invite` — an email with an `/accept-invite?token=`
   * link, confirmed via the unchanged `POST /auth/invite/confirm` — so
   * `AcceptInviteScreen` needs no changes to handle these. The invitee
   * can then work this Node's counter (scan, drop-off, confirm-handoff,
   * intake, collect) but never its payout account, staff list, or
   * earnings.
   */
  async inviteNodeStaff(nodeId: string, payload: NodeStaffInvitePayload): Promise<User> {
    return httpClient.post<User>(ENDPOINTS.nodeOperators.staffInvite(nodeId), payload);
  },

  /**
   * This Node's currently-active staff — owner-only, not paginated.
   * Removed staff aren't returned, and the owner never appears in
   * their own roster.
   *
   * This is the **only** way to recover a staff member's `userId` after
   * the one-time invite response, and that id is what `removeNodeStaff`
   * takes — so a remove action must always be fed from this list, never
   * from an id held elsewhere.
   */
  async getNodeStaff(nodeId: string): Promise<NodeStaffMember[]> {
    return httpClient.get<NodeStaffMember[]>(ENDPOINTS.nodeOperators.staff(nodeId));
  },

  /**
   * Revokes one staff member's access to this Node — owner-only,
   * `204` with no body.
   *
   * A soft removal: the membership flips to `removed`, the person's
   * account is untouched, and any *other* Node they're staff at keeps
   * working. Takes effect on their next request — there's no session to
   * separately revoke, so someone mid-scan finishes that request and is
   * locked out from the following one.
   *
   * `404 NOT_FOUND` covers "not your Node" and "no active membership
   * there," already-removed included, so a double-tap surfaces as
   * not-found rather than an error worth alarming the owner about.
   * `400 CANNOT_REMOVE_OWNER_MEMBERSHIP` is unreachable from a roster
   * built on `getNodeStaff` (it never lists owners).
   */
  async removeNodeStaff(nodeId: string, userId: string): Promise<void> {
    await httpClient.delete<void>(ENDPOINTS.nodeOperators.staffRemove(nodeId, userId));
  },

  /**
   * Turns this Node's public drop-offs on or off — owner-only, and the
   * Node must already be `active` (`403 NODE_NOT_ACTIVE`).
   *
   * **Not a deactivation**, despite how it reads. `false` hides the
   * Node from `GET /nodes`/`/nodes/nearby` for non-Admins and makes a
   * Consumer-initiated `POST /payments/intents` naming it — as origin
   * or destination — answer `404`. It keeps running handoffs, keeps
   * earning, keeps its staff, and can still both dispatch its own
   * parcels and receive ones dispatched to it by another operator.
   * Only an Admin can genuinely take a Node offline
   * (`status: inactive`, via `PATCH /nodes/:id`).
   *
   * Not retroactive: orders already placed against this Node are
   * untouched, the same way a Node filling up doesn't cancel bookings
   * already made.
   */
  async setNodeVisibility(nodeId: string, isPubliclyVisible: boolean): Promise<NodeMembership> {
    return httpClient.patch<NodeMembership>(ENDPOINTS.nodeOperators.visibility(nodeId), {
      isPubliclyVisible,
    } satisfies NodeVisibilityPayload);
  },

  /**
   * Places an order with this Node as the origin, on the operator's own
   * behalf — the counterpart that keeps a Node useful once its owner
   * has switched public drop-offs off.
   *
   * NodeOperator **or** NodeStaff with a membership here — this is
   * operational counter work, not owner-only. The Node must be
   * `active`. `originNodeId` isn't in the payload at all: the URL
   * supplies it, so a dispatcher structurally can't point an order at a
   * Node they don't run.
   *
   * Underneath it's the same flow as a Consumer's
   * `POST /payments/intents` — same fee calculation, same ~15-minute
   * capacity reservation, same Paystack hosted checkout — so the
   * response is an ordinary `PaymentIntent` and the caller redirects to
   * `authorizationUrl` exactly as Checkout does. The destination may be
   * any `active` Node regardless of *its* `isPubliclyVisible`;
   * dispatching to a partner's private station is legitimate.
   */
  async dispatchParcel(nodeId: string, payload: DispatchParcelPayload): Promise<PaymentIntent> {
    return httpClient.post<PaymentIntent>(ENDPOINTS.nodeOperators.dispatch(nodeId), payload);
  },

  /**
   * Real, confirmed route — the operator's Nodes' revenue-split
   * entries, across both roles a Node plays: a `node` row where it was
   * the *origin* (the percentage share) and a `destination_node` row
   * where it was the *destination* (the flat destination fee). Each
   * item's `partyType` says which.
   *
   * Not filterable by Node — the response carries no node id, so a
   * multi-Node operator sees one combined ledger. Requested at the max
   * page size, same convention as `getMyNodeOrders` below, since no
   * screen built on this has pagination controls yet.
   */
  async getMyNodeEarnings(): Promise<MyRevenueSplitEntry[]> {
    const raw = await httpClient.get<PaginatedList<MyRevenueSplitEntry>>(
      `${ENDPOINTS.earnings.myNode}?limit=100`
    );
    return raw.items;
  },

  // ── Handoffs: the counter's side ────────────────────────────────
  // Real, confirmed routes per docs/API.md (2026-08-14). Every one is
  // membership-scoped to the Nodes the caller belongs to and answers
  // `404 NOT_FOUND` — not `403` — when it isn't, so a 404 here never
  // means "wrong role."
  //
  // As of 2026-09-02 all of these accept a **NodeStaff** session as
  // well as a NodeOperator one (working a counter was never owner-only
  // work), and scope to *any* Node the caller is a member of rather
  // than one. That's why nothing here takes a `nodeId`: the server
  // resolves it from the order plus the caller's memberships. Client-
  // side per-Node filtering happens in `use-my-node-orders.ts`, off
  // each order's own `myRole` + origin/destination ids.

  /**
   * Previews a consumer's parcel from a scanned/typed tracking code,
   * before confirming receipt. Scoped to orders whose `originNodeId` is
   * one of the caller's Nodes.
   *
   * This does NOT change any state — it's a read. Confirming receipt is
   * the separate `confirmDropOff()` below,
   * which is what lets the operator eyeball the parcel against the
   * description first.
   */
  async lookupOrderByTrackingCode(trackingCode: string): Promise<HandoffOrderPreview> {
    return httpClient.get<HandoffOrderPreview>(
      ENDPOINTS.handoffs.byTrackingCode(trackingCode)
    );
  },

  /**
   * Every order that's ever touched **any** Node the caller is a member
   * of, either as origin or destination, current and past, newest first
   * — `myRole` on each item says which side. Real, confirmed route per
   * docs/API.md (2026-08-17; widened to all your Nodes 2026-09-02).
   *
   * This is what resolves the order uuid `confirm-handoff` needs for
   * both `rider_pickup` and `rider_arrival`, and what the awaiting-
   * collection/collect screens use to find a parcel by id. Requested at
   * the max page size, same convention as `getPendingRiders`/
   * `getPricingRules` elsewhere, since no screen built on this has
   * pagination controls yet.
   */
  async getMyNodeOrders(): Promise<NodeOrderSummary[]> {
    const raw = await httpClient.get<PaginatedList<NodeOrderSummary>>(
      `${ENDPOINTS.handoffs.myNodeOrders}?limit=100`
    );
    return raw.items;
  },

  /**
   * Confirms the consumer physically handed the parcel over —
   * `awaiting_drop_off → parcel_received_at_origin`, which is what puts
   * the order on the rider job board.
   *
   * Idempotent: a second call for the same order returns the same
   * success, so a double-tap or a retry after a flaky connection is
   * safe. `409 ILLEGAL_ORDER_TRANSITION` means the order was never at
   * `awaiting_drop_off` to begin with.
   */
  async confirmDropOff(orderId: string): Promise<HandoffOrderSummary> {
    return httpClient.post<HandoffOrderSummary>(ENDPOINTS.handoffs.dropOff(orderId));
  },

  /**
   * Confirms a rider handoff from the 6-digit code the rider states.
   * `rider_pickup` must come from the *origin* Node's operator and
   * moves the order to `in_transit`; `rider_arrival` must come from the
   * *destination* Node's operator and moves it to
   * `arrived_at_destination`. Calling from the wrong side is
   * `404 NOT_FOUND`.
   *
   * Idempotent on a retried confirm with an already-used code. Wrong
   * codes are `401 INVALID_HANDOFF_CODE` — identical for wrong,
   * expired, used, and locked-out, by design. Five wrong guesses lock
   * that code out permanently (the rider requests a new one; they
   * aren't blocked), and the route is separately rate-limited at
   * 10/min → `429 RATE_LIMITED`.
   */
  async confirmRiderHandoff(
    orderId: string,
    payload: ConfirmHandoffPayload
  ): Promise<HandoffOrderSummary> {
    return httpClient.post<HandoffOrderSummary>(
      ENDPOINTS.handoffs.confirmHandoff(orderId),
      payload
    );
  },

  // ── Handoffs: the destination Node's collection flow ────────────
  // Real, confirmed routes per docs/API.md (2026-08-15). All three are
  // scoped to the *destination* Node.

  /**
   * Destination-side equivalent of drop-off: confirms the parcel is
   * physically on the operator's counter, `arrived_at_destination →
   * ready_for_collection`. In the same step the server mints a 6-digit
   * collection code and **emails it to the receiver** — the operator
   * never sees it, which is why there's no code in this response.
   *
   * Idempotent, so a double-tap is safe. `409
   * ILLEGAL_ORDER_TRANSITION` means the rider handoff
   * (`confirm-handoff`, `rider_arrival`) hasn't happened yet.
   */
  async confirmIntake(orderId: string): Promise<HandoffOrderSummary> {
    return httpClient.post<HandoffOrderSummary>(ENDPOINTS.handoffs.intake(orderId));
  },

  /**
   * Re-mints and re-emails the receiver's collection code, superseding
   * any prior one — for when the receiver is at the counter saying they
   * never got the email, or their code aged out of its 1-hour TTL.
   *
   * Rate-limited at 5/min because each call sends real email, so don't
   * wire this to anything automatic. Returns only `expiresAt`; the code
   * itself never enters an API response. `409
   * ORDER_NOT_READY_FOR_COLLECTION` means intake hasn't run (nothing to
   * resend) or the order is already collected.
   */
  async resendCollectionCode(orderId: string): Promise<CollectionCodeResendResult> {
    return httpClient.post<CollectionCodeResendResult>(
      ENDPOINTS.handoffs.collectionCodeResend(orderId)
    );
  },

  /**
   * Final step: the receiver reads the emailed code to the operator,
   * `ready_for_collection → completed`.
   *
   * `identityConfirmed` is an attestation, not a gate — per
   * docs/API.md it's recorded on the order's event log but a `false`
   * still completes the collection, because proxy pickup is normal.
   * Pass through whatever the operator actually answered.
   *
   * Idempotent on a retried call with an already-used code. Wrong codes
   * are `401 INVALID_HANDOFF_CODE` — identical for wrong, expired,
   * used, and locked-out, same as the rider codes. Five wrong guesses
   * lock that code out permanently; `resendCollectionCode` recovers it.
   */
  async collectParcel(
    orderId: string,
    payload: CollectParcelPayload
  ): Promise<HandoffOrderSummary> {
    return httpClient.post<HandoffOrderSummary>(
      ENDPOINTS.handoffs.collect(orderId),
      payload
    );
  },
};

export const nodeService = realNodeService;
