
import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
import { ApiError } from "@/core/api/errors";
import type { PaginatedList } from "@/core/api/types";
import type {
  BankOption,
  CollectParcelPayload,
  CollectionCodeResendResult,
  ConfirmHandoffPayload,
  HandoffOrderPreview,
  HandoffOrderSummary,
  MyRevenueSplitEntry,
  NodeOperatorOnboardingPayload,
  NodeOperatorProfile,
  NodeOrderSummary,
  PayoutAccountPayload,
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
 * and receiver collection. `onboardNode` / `getMyNodeOperatorProfile`
 * wire the self-service Node setup routes (`POST /node-operators/onboarding`,
 * `GET /node-operators/me`) — both real, confirmed per docs/API.md.
 * `getMyNodeEarnings` (`GET /earnings/my-node`) is this Node's own
 * revenue-split entries — real, confirmed per docs/API.md, only present
 * for orders where this Node was the *origin*.
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

  /** Real, confirmed route — self-service Node setup, the second step of NodeOperator registration. */
  async onboardNode(payload: NodeOperatorOnboardingPayload): Promise<NodeOperatorProfile> {
    return httpClient.post<NodeOperatorProfile>(ENDPOINTS.nodeOperators.onboarding, payload);
  },

  /** Real, confirmed route — the operator's own profile + Node, including its approval status. */
  async getMyNodeOperatorProfile(): Promise<NodeOperatorProfile> {
    return httpClient.get<NodeOperatorProfile>(ENDPOINTS.nodeOperators.me);
  },

  // ── Payout account ───────────────────────────────────────────────
  // Real, confirmed routes per docs/API.md — the bank account Admin
  // disburses this Node's earned revenue-split entries to.

  /** Paystack's full bank list, for the bank picker ahead of `setPayoutAccount`. Not paginated. */
  async getPayoutBanks(): Promise<BankOption[]> {
    return httpClient.get<BankOption[]>(ENDPOINTS.payments.banks);
  },

  /**
   * Sets (or replaces) this Node's payout bank account. Verified
   * against Paystack server-side at submission time —
   * `payoutAccountName` on the response is whatever Paystack resolved,
   * never what was sent. `400 BANK_ACCOUNT_VERIFICATION_FAILED` means
   * Paystack couldn't resolve that account number at that bank;
   * nothing is saved and any previously-verified account is untouched.
   */
  async setPayoutAccount(payload: PayoutAccountPayload): Promise<NodeOperatorProfile> {
    return httpClient.patch<NodeOperatorProfile>(ENDPOINTS.nodeOperators.payoutAccount, payload);
  },

  /**
   * Real, confirmed route — this Node's revenue-split entries. Only
   * appears for orders where this Node was the *origin* (the full Node
   * share always goes to the origin Node, never split with the
   * destination). Requested at the max page size, same convention as
   * `getMyNodeOrders` below, since no screen built on this has
   * pagination controls yet.
   */
  async getMyNodeEarnings(): Promise<MyRevenueSplitEntry[]> {
    const raw = await httpClient.get<PaginatedList<MyRevenueSplitEntry>>(
      `${ENDPOINTS.earnings.myNode}?limit=100`
    );
    return raw.items;
  },

  // ── Handoffs: the Node operator's side ──────────────────────────
  // Real, confirmed routes per docs/API.md (2026-08-14). Every one is
  // ownership-scoped to the operator's own Node and answers
  // `404 NOT_FOUND` — not `403` — when it isn't, so a 404 here never
  // means "wrong role."

  /**
   * Previews a consumer's parcel from a scanned/typed tracking code,
   * before confirming receipt. Scoped to orders whose `originNodeId` is
   * this operator's Node.
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
   * Every order that's ever touched this Node, either as origin or
   * destination, current and past, newest first — `myRole` on each item
   * says which side. Real, confirmed route per docs/API.md (2026-08-17).
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
