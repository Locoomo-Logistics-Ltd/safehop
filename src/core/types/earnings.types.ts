/**
 * Earnings / revenue-split domain types — shared across Rider,
 * NodeOperator, and Admin. Every `completed` order's fee is
 * split three ways (rider / origin-Node / platform) per an
 * Admin-configured ratio, at the exact moment
 * `POST /handoffs/orders/:id/collect` succeeds — see docs/API.md's
 * "Earnings (revenue split)" section. Payout itself stays off-system
 * (bank transfer, cash, etc.); these types only describe who's owed
 * what and whether an Admin has settled it.
 */

export type RevenueSplitPartyType = "rider" | "node" | "platform";
export type PayoutStatus = "pending" | "paid";

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
// GET /admin/revenue-split/entries — three rows per completed order
// (rider, origin Node, platform).

export interface AdminRevenueSplitEntry {
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
