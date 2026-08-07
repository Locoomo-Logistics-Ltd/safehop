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
  AdminTeamMember,
  AdminOrderSummary,
  ElevateSuperAdminPayload,
  InvitedStaffMember,
  InviteStaffPayload,
  NetworkStatusSummary,
  OnboardNodePayload,
  OrdersTrendPoint,
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
 *
 * 2. **Wired, but to a route that does NOT appear anywhere in
 *    `docs/API.md`** — a previous pass guessed this from the route
 *    name alone before `API.md` existed as a reference. It still
 *    compiles and will fire a real request, but treat it as
 *    unconfirmed, not as a working integration, until corrected:
 *    - `elevateSuperAdmin` → wired to `corporateOps.elevateSuperAdmin`
 *      (`POST /corporate-ops/staff/elevate-superadmin`); `API.md` has
 *      no `super_admin` concept at all (role enum is only
 *      `consumer`/`node_operator`/`rider`/`admin`), so there may be no
 *      real equivalent.
 *
 * Every other method the Admin UI needs has **no backend route at
 * all** per `API.md`:
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

  /** Guessed shape — see this file's header. Real route exists. */
  async elevateSuperAdmin(payload: ElevateSuperAdminPayload): Promise<void> {
    await httpClient.post<void>(ENDPOINTS.corporateOps.elevateSuperAdmin, payload);
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
