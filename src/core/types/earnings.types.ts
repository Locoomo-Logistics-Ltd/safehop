/**
 * Earnings / revenue-split domain types — shared across Rider,
 * NodeOperator, and Admin. Every `completed` order produces four
 * `revenue_split_entries` rows: rider / origin-Node / platform get an
 * Admin-configured percentage split of the delivery revenue, and
 * `destination_node` gets a separate flat fee
 * (`PricingRule.destinationFeeKobo`) paid entirely to the destination
 * Node — not part of the percentage split, so tuning the split ratio
 * never changes what a destination Node earns and vice versa. All at
 * the exact moment `POST /handoffs/orders/:id/collect` succeeds — see
 * docs/API.md's "Earnings (revenue split)" section. Payout itself
 * stays off-system (bank transfer, cash, etc.); these types only
 * describe who's owed what and whether an Admin has settled it.
 */

export type RevenueSplitPartyType = "rider" | "node" | "destination_node" | "platform";
export type PayoutStatus = "pending" | "paid";

// ── Payout accounts (Rider / NodeOperator) ──────────────────────
// `GET /payments/banks`, `PATCH /riders/me/payout-account`,
// `PATCH /node-operators/me/payout-account` — the bank account Admin
// disburses a Rider's or Node's earned revenue-split entries to.
// Verified against the real bank via Paystack at submission time; the
// account holder name is resolved server-side, never typed by the
// caller.

/** One row from `GET /payments/banks` — used to populate a bank picker. */
export interface BankOption {
  code: string;
  name: string;
}

/** `PATCH /riders/me/payout-account` / `PATCH /node-operators/me/payout-account` request body. */
export interface PayoutAccountPayload {
  bankCode: string;
  bankName: string;
  /** Exactly 10 digits (NUBAN). */
  accountNumber: string;
}

/**
 * The five payout fields present on both `RiderVerificationProfile`
 * and `NodeOperatorProfile` (onboarding/`me`/payout-account responses
 * all share this shape) — `payoutAccountName` is always whatever
 * Paystack resolved, never what the caller sent.
 */
export interface PayoutAccountFields {
  payoutAccountConfigured: boolean;
  payoutBankCode: string | null;
  payoutBankName: string | null;
  payoutAccountNumber: string | null;
  payoutAccountName: string | null;
}

/** `GET /earnings/mine` (Rider) and `GET /earnings/my-node` (NodeOperator) — same response shape. */
export interface MyRevenueSplitEntry {
  id: string;
  orderId: string;
  orderTrackingCode: string;
  partyType: RevenueSplitPartyType;
  amountKobo: number;
  payoutStatus: PayoutStatus;
  paidAt: string | null;
  createdAt: string;
}

// ── Admin: revenue-split ratio config ───────────────────────────
// POST/GET /admin/revenue-split — append-only, same pattern as
// admin/pricing: POST never edits an existing ratio, it adds a new
// one that becomes "current."

export interface CreateRevenueSplitRatioPayload {
  riderPercent: number;
  nodePercent: number;
  platformPercent: number;
}

export interface RevenueSplitRatio {
  id: string;
  riderPercent: number;
  nodePercent: number;
  platformPercent: number;
  effectiveFrom: string;
  createdByAdminId: string;
  createdByAdminEmail: string;
}

// ── Admin: revenue-split entries (payout-readiness report) ──────
// GET /admin/revenue-split/entries — four rows per completed order
// (rider, origin Node, destination Node, platform).

export interface AdminRevenueSplitEntry extends PayoutAccountFields {
  id: string;
  orderId: string;
  orderTrackingCode: string;
  partyType: RevenueSplitPartyType;
  partyId: string;
  /** The rider's email, the Node's name, or "Platform" — who to actually pay, no second lookup needed. */
  partyLabel: string;
  amountKobo: number;
  payoutStatus: PayoutStatus;
  paidAt: string | null;
  paidByAdminId: string | null;
  paidByAdminEmail: string | null;
  createdAt: string;
}

export interface AdminRevenueSplitEntryFilters {
  partyType?: RevenueSplitPartyType;
  payoutStatus?: PayoutStatus;
}

/** `PATCH /admin/revenue-split/entries/:id/mark-paid` response. */
export interface MarkEntryPaidResult {
  id: string;
  payoutStatus: "paid";
  paidAt: string;
  paidByAdminId: string;
  paidByAdminEmail: string;
}
