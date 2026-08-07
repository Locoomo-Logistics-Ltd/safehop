/**
 * Admin domain types.
 *
 * NONE of these shapes are confirmed against a live backend contract —
 * there is no admin-facing API surface yet beyond the two
 * `corporateOps` routes noted in `admin.service.ts`. These types exist
 * to give the Admin UI something concrete to render against; treat
 * every field here as provisional until a real endpoint is wired and
 * the shape is verified, same convention as `mapSessionResponse` /
 * `mapFareResponse` elsewhere in this codebase.
 */

import type { DeliveryStatus, GeoPoint, TrackingEvent } from "./delivery.types";

// ── Dashboard ────────────────────────────────────────────────────

export interface AdminDashboardStats {
  activeDeliveries: number;
  activeDeliveriesDeltaLabel: string; // e.g. "+12% this week"
  onlineRiders: number;
  onlineRidersLabel: string; // e.g. "3 idle • 12 en route"
  completedToday: number;
  completedTodayLabel: string; // e.g. "On track for daily target"
  openDisputes: number;
  openDisputesLabel: string; // e.g. "Requires attention"
}

export interface AdminOrderSummary {
  id: string;
  trackingCode: string;
  originLabel: string;
  destinationLabel: string;
  status: DeliveryStatus;
  updatedAtLabel: string; // pre-formatted relative time, e.g. "2 min ago"
}

export interface NetworkStatusSummary {
  nodesOnline: number;
  nodesTotal: number;
  lastSyncedLabel: string;
}

// ── Orders ───────────────────────────────────────────────────────

export interface AdminOrderFilters {
  search: string;
  status: DeliveryStatus | "all";
  nodeId: string | "all";
}

export interface AdminOrderListItem {
  id: string;
  trackingCode: string;
  customerName: string;
  originLabel: string;
  destinationLabel: string;
  status: DeliveryStatus;
  amount: number;
  createdAtLabel: string;
}

export interface AdminOrderDetail extends AdminOrderListItem {
  customerEmail: string;
  customerPhone: string;
  assignedRiderName: string | null;
  originNodeName: string;
  paymentMethodLabel: string;
  paymentReference: string;
  /** Reuses the same shape the User module's own tracking screen renders via `TrackingTimeline`. */
  timeline: TrackingEvent[];
}

// ── Nodes ────────────────────────────────────────────────────────
// GET/PATCH/POST /nodes and /nodes/:id are real, confirmed routes
// (see docs/API.md) — these shapes are no longer guesses, unlike the
// rest of this file. There is no online/offline telemetry or
// per-node order count from the backend; `status` is the Node's
// lifecycle state (approval/suspension), not a live connectivity
// signal, and `capacity` is the self-reported max, not current
// occupancy.

export type NodeLifecycleStatus = "pending" | "active" | "inactive" | "suspended";

/** Raw Node shape exactly as returned by GET/POST/PATCH /nodes(/:id) — see docs/API.md. */
export interface AdminNodeRecord {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string; // e.g. "Lagos" — a Nigerian state, not a lifecycle/network status
  country: string;
  latitude: number;
  longitude: number;
  capacity: number;
  status: NodeLifecycleStatus;
  onboardingType: string;
  operatingHours: string | null;
  createdAt: string;
}

export interface AdminNodeStatus {
  id: string;
  name: string;
  area: string; // pre-formatted "{city}, {state}"
  address: string;
  country: string;
  onboardingType: string;
  status: NodeLifecycleStatus;
  capacity: number;
  operatingHoursLabel: string;
  createdAtLabel: string;
  location: GeoPoint;
}

/** POST /nodes request body — Admin creates a Node directly, immediately `active`. `country`/`onboardingType` are left to the server's defaults ("Nigeria" / "field_recruited") rather than collected in the form. */
export interface OnboardNodePayload {
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  capacity: number;
  operatingHours?: string;
}

/** PATCH /nodes/:id request body — every field optional per docs/API.md. This is also how an Admin approves a pending Node (`{status: "active"}`) or retires one (`inactive`/`suspended`) — there's no delete endpoint, only status transitions. The "Manage" panel only ever sends `status` today; the other fields are here because the real route accepts them, not because any screen uses them yet. */
export interface UpdateNodePayload {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  operatingHours?: string;
  status?: NodeLifecycleStatus;
}

// ── Team ─────────────────────────────────────────────────────────
// `AdminTeamRole`/`AdminTeamMember` below are still provisional — no
// `GET` list endpoint exists to check this taxonomy against (see
// docs/API.md). The real backend's role enum for an invited account
// is much smaller — `InvitableRole` below — and is what actually
// drives `POST /users/invite`; don't confuse the two.

export type AdminTeamRole = "super_admin" | "ops_manager" | "node_manager" | "support_agent";
export type AdminTeamStatus = "active" | "invited" | "suspended";

export interface AdminTeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminTeamRole;
  status: AdminTeamStatus;
  assignedNodeLabel: string | null;
  lastActiveLabel: string;
}

/** The real backend's role enum for an invited account — see `POST /users/invite` in docs/API.md. `consumer` is rejected there (self-registration only). */
export type InvitableRole = "node_operator" | "rider" | "admin";

/** POST /users/invite request body — real, confirmed route (Admin-only). */
export interface InviteStaffPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: InvitableRole;
}

/** POST /users/invite response body (`UserResponseDto`, status is always "invited" on creation). */
export interface InvitedStaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: InvitableRole;
  status: "invited";
  createdAt: string;
}

// ── Disputes ─────────────────────────────────────────────────────

export type DisputePriority = "low" | "medium" | "high";
export type DisputeStatus = "open" | "investigating" | "resolved";

export interface AdminDisputeMetrics {
  avgResolutionTimeLabel: string; // e.g. "2.4h"
  resolvedRatePct: number; // e.g. 84
  totalRefunded: number; // NGN
}

export interface AdminDispute {
  id: string;
  orderTrackingCode: string;
  raisedByName: string;
  category: string;
  priority: DisputePriority;
  status: DisputeStatus;
  createdAtLabel: string;
  description: string;
}

// ── Super Admin / Team Provisioning ─────────────────────────────

export interface SuperAdminOverview {
  totalStaff: number;
  pendingElevationRequests: number;
}

/** Shape guessed from the route name — unverified, see admin.service.ts header. */
export interface ElevateSuperAdminPayload {
  userId: string;
}

// ── Analytics ────────────────────────────────────────────────────

export interface AdminAnalyticsSummary {
  totalOrders: number;
  totalRevenue: number;
  avgDeliveryTimeLabel: string; // e.g. "34.2 min"
  growthPctLabel: string; // e.g. "+2.8% vs last month"
}

export interface TopNodePerformance {
  nodeId: string;
  nodeName: string;
  ordersCount: number;
  revenue: number;
}

export interface RiderPerformanceSummary {
  riderId: string;
  riderName: string;
  deliveries: number;
  ratingLabel: string; // e.g. "4.9"
}

export interface OrdersTrendPoint {
  label: string; // e.g. "Mon", "Wk 1"
  placed: number;
  completed: number;
}
