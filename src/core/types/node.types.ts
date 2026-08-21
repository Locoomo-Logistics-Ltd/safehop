/**
 * Node Operator domain types. A Node Operator manages one Node (Pickup
 * Station) — the parcel custody chain itself runs through
 * `core/types/handoff.types.ts`; this file covers the Node's own
 * profile, its Activity Log, and self-onboarding.
 */

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

// ── Node Operator self-onboarding ───────────────────────────────
// POST /node-operators/onboarding and GET /node-operators/me are
// real, confirmed routes per docs/API.md — the second, self-service
// step of a NodeOperator account's registration: sets up the Node
// they'll manage. Creates the Node in "pending" status; an Admin must
// approve it (PATCH /node-operators/:id/approve, Admin-only) before it
// appears in /nodes or is usable.

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

/** Raw Node shape as returned nested in the onboarding/`me` response — see docs/API.md. */
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
  createdAt: string;
}

/** Response shape for both POST /node-operators/onboarding and GET /node-operators/me. */
export interface NodeOperatorProfile {
  profileId: string;
  node: NodeOperatorNode;
}
