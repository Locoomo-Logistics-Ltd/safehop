import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
import { ApiError } from "@/core/api/errors";
import type { PaginatedList } from "@/core/api/types";

import { formatDate } from "@/lib/format";

import type {
  AdminDashboardStats,
  AdminDispute,
  AdminDisputeMetrics,
  AdminNodeRecord,
  AdminNodeStatus,
  AdminOrderDetail,
  AdminOrderListItem,
  AdminAnalyticsSummary,
  AdminRevenueSplitEntry,
  AdminRevenueSplitEntryFilters,
  AdminTeamMember,
  AdminOrderSummary,
  CreatePricingRulePayload,
  CreateRevenueSplitRatioPayload,
  InvitedStaffMember,
  InviteStaffPayload,
  MarkEntryPaidResult,
  NetworkStatusSummary,
  OnboardNodePayload,
  OrdersTrendPoint,
  PendingNodeOperator,
  PendingRider,
  PricingRule,
  RevenueSplitRatio,
  RiderPerformanceSummary,
  SuperAdminOverview,
  TopNodePerformance,
  UpdateNodePayload,
} from "@/core/types";

/** GET/POST/PATCH /nodes response items → the shape the Node Network screen renders. */
function mapNodeRecord(node: AdminNodeRecord): AdminNodeStatus {
  return {
    id: node.id,
    name: node.name,
    area: `${node.city}, ${node.state}`,
    address: node.address,
    country: node.country,
    onboardingType: node.onboardingType,
    status: node.status,
    capacity: node.capacity,
    operatingHoursLabel: node.operatingHours ?? "Hours not set",
    createdAtLabel: formatDate(node.createdAt),
    location: { lat: node.latitude, lng: node.longitude },
  };
}

/**
 * Admin service — the business-logic surface for the Admin role.
 *
 * `docs/API.md` is the source of truth for what's real here — it does
 * NOT match `core/api/endpoints.ts` 1:1. Two categories below:
 *
 * 1. **Confirmed real, wired to the documented route**:
 *    - `getNodeStatuses` / `getNodeDetail` → `GET /nodes`, `GET /nodes/:id`
 *    - `onboardPartnerNode` → `POST /nodes` (Node Network's "Add Node" form)
 *    - `updateNode` → `PATCH /nodes/:id` (Node Network's "Manage" panel —
 *      currently only exercises the `status` field, to approve/suspend/
 *      reactivate a Node; the payload type carries every field the real
 *      route accepts even though no screen edits the others yet)
 *    - `inviteStaff` → `POST /users/invite` (Team Management's "Invite
 *      Member" form). Note `role` here is the real backend enum
 *      (`node_operator`/`rider`/`admin`) — nothing to do with the
 *      fictional `AdminTeamRole` (`ops_manager`/`node_manager`/etc.)
 *      used by the still-`NOT_IMPLEMENTED` team list below.
 *    - `getPendingNodeOperators` / `approveNodeOperator` →
 *      `GET /node-operators/pending`, `PATCH /node-operators/:id/approve`
 *      (Approvals screen's "Node Operators" tab). Added 2026-08-12 —
 *      previously the single biggest functional gap in the app, per
 *      `docs/HANDOFF.md`: a self-registered NodeOperator who completed
 *      onboarding had no path to ever become `active`.
 *    - `getPendingRiders` / `approveRider` → `GET /riders/pending`,
 *      `PATCH /riders/:id/approve` (Approvals screen's "Riders" tab).
 *      Added 2026-08-12, same gap as above, Rider side.
 *    - `createPricingRule` / `getPricingRules` → `POST /admin/pricing`,
 *      `GET /admin/pricing` (Pricing screen). Added 2026-08-12.
 *      Append-only per `docs/API.md` — `createPricingRule` never edits
 *      an existing rule, it adds a new one that becomes "current."
 *    - `createRevenueSplitRatio` / `getRevenueSplitRatios` /
 *      `getRevenueSplitEntries` / `markRevenueSplitEntryPaid` →
 *      `POST/GET /admin/revenue-split`, `GET .../entries`,
 *      `PATCH .../entries/:id/mark-paid` (Revenue Split screen). Added
 *      2026-08-20, replacing an earlier "Rider Earnings" screen that
 *      was wired to `GET /admin/rider-earnings` — that endpoint never
 *      appeared in `docs/API.md` and has been removed. Distinct from
 *      the still-`NOT_IMPLEMENTED` `getRiderPerformance` leaderboard
 *      below, which has no real route.
 *
 * Every method the Admin UI needs beyond the above has **no backend
 * route at all** per `API.md` (Super Admin elevation included — there's
 * no `super_admin` concept in the role enum, and no route resembling
 * one anywhere in the doc; the elevation form this file used to wire to
 * a guessed `corporate-ops/staff/elevate-superadmin` route was removed
 * for the same reason):
 *   - Dashboard summary stats (active deliveries / online riders /
 *     completed today / open disputes)
 *   - Network-wide recent-orders feed for the dashboard
 *   - Network status summary (nodes online/offline) for the dashboard map card
 *   - Admin-scoped, filterable order list + single order detail
 *     (`GET /orders` exists but is consumer-scoped to the caller's own
 *     orders per `orders.service.ts` — there is no admin "all orders,
 *     any customer" listing or filter/search/pagination support)
 *   - Team management: list/suspend/role-change (invite is real, see above)
 *   - Dispute Center (list/detail/resolve, metrics)
 *   - Analytics & Performance (revenue/order trends, top nodes, rider
 *     leaderboard)
 *
 * All of the above throw `ApiError({ code: "NOT_IMPLEMENTED" })` below
 * so the gap is visible rather than silently faking numbers — same
 * pattern as `rider.service.ts`. Wiring each one is a small job once
 * the corresponding route exists; the screens already call these
 * methods through TanStack Query hooks, so only this file needs to
 * change.
 */
const realAdminService = {
  // ── Dashboard (no backend route) ──────────────────────────────
  async getDashboardStats(): Promise<AdminDashboardStats> {
    throw new ApiError({
      message: "No admin dashboard stats endpoint exists yet.",
      code: "NOT_IMPLEMENTED",
    });
  },

  async getRecentOrders(): Promise<AdminOrderSummary[]> {
    throw new ApiError({
      message: "No network-wide recent orders endpoint exists yet.",
      code: "NOT_IMPLEMENTED",
    });
  },

  async getNetworkStatusSummary(): Promise<NetworkStatusSummary> {
    throw new ApiError({
      message: "No network status summary endpoint exists yet.",
      code: "NOT_IMPLEMENTED",
    });
  },

  // ── Orders (no admin-scoped list/detail route) ────────────────
  async getOrders(): Promise<AdminOrderListItem[]> {
    throw new ApiError({
      message: "No admin-scoped order list endpoint exists yet (GET /orders is consumer-scoped).",
      code: "NOT_IMPLEMENTED",
    });
  },

  async getOrderDetail(orderId: string): Promise<AdminOrderDetail> {
    void orderId;
    throw new ApiError({
      message: "No admin order detail endpoint exists yet.",
      code: "NOT_IMPLEMENTED",
    });
  },

  // ── Nodes ────────────────────────────────────────────────────────
  // Real, confirmed routes (docs/API.md) — GET /nodes returns every
  // Node regardless of status when called as an Admin (non-Admins are
  // limited to `active` only). Requested at the max page size since
  // the screen has no pagination controls yet.
  async getNodeStatuses(): Promise<AdminNodeStatus[]> {
    const raw = await httpClient.get<PaginatedList<AdminNodeRecord>>(
      `${ENDPOINTS.adminNodes.list}?limit=100`
    );
    return raw.items.map(mapNodeRecord);
  },

  /** Wired to the real GET /nodes/:id, expands inline on Node Network's "View Details" button. */
  async getNodeDetail(nodeId: string): Promise<AdminNodeStatus> {
    const raw = await httpClient.get<AdminNodeRecord>(ENDPOINTS.adminNodes.detail(nodeId));
    return mapNodeRecord(raw);
  },

  // ── Team (no endpoints) ─────────────────────────────────────────
  async getTeamMembers(): Promise<AdminTeamMember[]> {
    throw new ApiError({
      message: "No team management endpoint exists yet.",
      code: "NOT_IMPLEMENTED",
    });
  },

  /** Real, confirmed route — invites a node_operator/rider/admin account (Team Management's "Invite Member" form). */
  async inviteStaff(payload: InviteStaffPayload): Promise<InvitedStaffMember> {
    return httpClient.post<InvitedStaffMember>(ENDPOINTS.users.invite, payload);
  },

  // ── Disputes (no endpoints) ─────────────────────────────────────
  async getDisputes(): Promise<AdminDispute[]> {
    throw new ApiError({
      message: "No dispute center endpoint exists yet.",
      code: "NOT_IMPLEMENTED",
    });
  },

  async getDisputeMetrics(): Promise<AdminDisputeMetrics> {
    throw new ApiError({
      message: "No dispute metrics endpoint exists yet.",
      code: "NOT_IMPLEMENTED",
    });
  },

  async resolveDispute(disputeId: string): Promise<void> {
    void disputeId;
    throw new ApiError({
      message: "No dispute resolution endpoint exists yet.",
      code: "NOT_IMPLEMENTED",
    });
  },

  // ── Super Admin ──────────────────────────────────────────────
  async getSuperAdminOverview(): Promise<SuperAdminOverview> {
    throw new ApiError({
      message: "No super admin overview endpoint exists yet.",
      code: "NOT_IMPLEMENTED",
    });
  },

  /** Real, confirmed route — creates a Node immediately `active` (Admin authorship is the trust gate per docs/API.md). */
  async onboardPartnerNode(payload: OnboardNodePayload): Promise<AdminNodeStatus> {
    const raw = await httpClient.post<AdminNodeRecord>(ENDPOINTS.adminNodes.create, payload);
    return mapNodeRecord(raw);
  },

  /** Real, confirmed route — approves/suspends/edits a Node. No delete endpoint exists; status transitions are the only way to retire one. */
  async updateNode(nodeId: string, payload: UpdateNodePayload): Promise<AdminNodeStatus> {
    const raw = await httpClient.patch<AdminNodeRecord>(ENDPOINTS.adminNodes.detail(nodeId), payload);
    return mapNodeRecord(raw);
  },

  // ── Approvals ────────────────────────────────────────────────────
  // Real, confirmed routes. Requested at the max page size since
  // neither queue has pagination controls yet — same convention as
  // getNodeStatuses above.
  async getPendingNodeOperators(): Promise<PendingNodeOperator[]> {
    const raw = await httpClient.get<PaginatedList<PendingNodeOperator>>(
      `${ENDPOINTS.nodeOperators.pending}?limit=100`
    );
    return raw.items;
  },

  /** No request body — flips the User's status and the Node's status to `active` together, in one transaction. */
  async approveNodeOperator(profileId: string): Promise<PendingNodeOperator> {
    return httpClient.patch<PendingNodeOperator>(ENDPOINTS.nodeOperators.approve(profileId));
  },

  async getPendingRiders(): Promise<PendingRider[]> {
    const raw = await httpClient.get<PaginatedList<PendingRider>>(`${ENDPOINTS.riders.pending}?limit=100`);
    return raw.items;
  },

  /** No request body — flips the User's status and the RiderProfile's status to `active` together, in one transaction. */
  async approveRider(profileId: string): Promise<PendingRider> {
    return httpClient.patch<PendingRider>(ENDPOINTS.riders.approve(profileId));
  },

  // ── Pricing ──────────────────────────────────────────────────────
  /** Real, confirmed route — append-only, this never edits an existing rule. */
  async createPricingRule(payload: CreatePricingRulePayload): Promise<PricingRule> {
    return httpClient.post<PricingRule>(ENDPOINTS.adminPricing.create, payload);
  },

  /** Real, confirmed route — rate history, newest first. */
  async getPricingRules(): Promise<PricingRule[]> {
    const raw = await httpClient.get<PaginatedList<PricingRule>>(`${ENDPOINTS.adminPricing.list}?limit=100`);
    return raw.items;
  },

  // ── Revenue split ────────────────────────────────────────────────
  // Real, confirmed routes per docs/API.md. Every `completed` order's
  // fee is split rider/origin-Node/platform per the ratio these set,
  // recorded as one entry per party — not a payout flow: the actual
  // transfer stays off-system (bank, cash, etc.); this is what an
  // Admin reads before running one, and marks paid after.

  /** Sets the split ratio for every order completed from now on — append-only, never edits a prior ratio. */
  async createRevenueSplitRatio(payload: CreateRevenueSplitRatioPayload): Promise<RevenueSplitRatio> {
    return httpClient.post<RevenueSplitRatio>(ENDPOINTS.adminRevenueSplit.create, payload);
  },

  /** Ratio history, newest first. */
  async getRevenueSplitRatios(): Promise<RevenueSplitRatio[]> {
    const raw = await httpClient.get<PaginatedList<RevenueSplitRatio>>(
      `${ENDPOINTS.adminRevenueSplit.list}?limit=100`
    );
    return raw.items;
  },

  /** Every revenue-split entry across every completed order, newest first — three rows per order (rider, origin Node, platform). */
  async getRevenueSplitEntries(filters?: AdminRevenueSplitEntryFilters): Promise<AdminRevenueSplitEntry[]> {
    const query = new URLSearchParams({ limit: "100" });
    if (filters?.partyType) query.set("partyType", filters.partyType);
    if (filters?.payoutStatus) query.set("payoutStatus", filters.payoutStatus);

    const raw = await httpClient.get<PaginatedList<AdminRevenueSplitEntry>>(
      `${ENDPOINTS.adminRevenueSplit.entries}?${query.toString()}`
    );
    return raw.items;
  },

  /** Records an entry as settled off-system. No request body. Idempotent — marking an already-paid entry again just returns its current state. */
  async markRevenueSplitEntryPaid(entryId: string): Promise<MarkEntryPaidResult> {
    return httpClient.patch<MarkEntryPaidResult>(ENDPOINTS.adminRevenueSplit.markEntryPaid(entryId));
  },

  // ── Analytics (no endpoints) ────────────────────────────────────
  async getAnalyticsSummary(): Promise<AdminAnalyticsSummary> {
    throw new ApiError({
      message: "No analytics summary endpoint exists yet.",
      code: "NOT_IMPLEMENTED",
    });
  },

  async getTopNodes(): Promise<TopNodePerformance[]> {
    throw new ApiError({
      message: "No top-nodes analytics endpoint exists yet.",
      code: "NOT_IMPLEMENTED",
    });
  },

  async getRiderPerformance(): Promise<RiderPerformanceSummary[]> {
    throw new ApiError({
      message: "No rider performance analytics endpoint exists yet.",
      code: "NOT_IMPLEMENTED",
    });
  },

  async getOrdersTrend(): Promise<OrdersTrendPoint[]> {
    throw new ApiError({
      message: "No orders-placed-vs-completed trend endpoint exists yet.",
      code: "NOT_IMPLEMENTED",
    });
  },
};

export const adminService = realAdminService;
