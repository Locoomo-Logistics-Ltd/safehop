

export const ROUTES = {
  // Auth
  roleSelect: "/role-select",
  createAccount: "/create-account",
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  acceptInvite: "/accept-invite",
  terms: "/terms",
  privacy: "/privacy",

  // User
  dashboard: "/dashboard",
  newDelivery: "/delivery/new",
  selectNodes: "/delivery/select-nodes",
  deliveryMethod: "/delivery/method",
  checkout: "/checkout",
  /** Where Paystack redirects after checkout, per docs/API.md's `POST /payments/intents` — polls the intent, then forwards to orderSuccess once an Order exists. */
  paymentCallback: "/orders/payment-callback",
  orderSuccess: (id: string) => `/delivery/${id}/success`,
  track: (id: string) => `/delivery/${id}/track`,
  trackList: "/track",
  profile: "/profile",

  // Node Operator (manages one Node — a Pickup Station)
  nodeHome: "/node/home",
  nodeScan: "/node-scan",
  nodeActivity: "/node/activity",
  nodeProfile: "/node/profile",
  /** This Node's revenue-split entries (origin-Node orders only) — `GET /earnings/my-node`. Reached from Profile. */
  nodeEarnings: "/node/earnings",
  nodeSetup: "/node/setup",
  /** Consumer drop-off preview + confirm — `GET /handoffs/orders/by-tracking-code/:code` then `POST .../drop-off`. Reached from the scanner or manual code entry. */
  nodeDropOff: (trackingCode: string) => `/node/drop-off/${trackingCode}`,
  /** Details page for one Awaiting Pickup / Awaiting Arrival order — full order info + the rider's 6-digit code entry, `POST /handoffs/orders/:id/confirm-handoff` (`type` inferred from the order's own `myRole`). Reached from Home's Awaiting Pickup/Awaiting Arrival tabs. Added 2026-08-17 when the standalone Inventory screen was retired — its Pickup/Incoming tabs moved here. */
  nodeHandoffDetail: (orderId: string) => `/node/handoff/${orderId}`,
  /** Receiver collection: complete collection info, the check-in/"Send" action (`POST .../intake`) when the parcel hasn't been checked in yet, or code entry + identity attestation (`POST .../collect`) once it has. Reached from Home's Ready for Collection tab. */
  nodeCollect: (orderId: string) => `/node/awaiting-collection/${orderId}/collect`,

  // Rider
  riderHome: "/rider/home",
  /** The job board — `GET /handoffs/available-orders`. */
  riderAvailableJobs: "/rider/available-jobs",
  /** Rider's own accepted deliveries — `GET /handoffs/my-orders`, filtered to non-terminal statuses. */
  riderActiveDeliveries: "/rider/active-deliveries",
  /** Where the rider requests + shows the 6-digit handoff code for one delivery. */
  riderHandoff: (orderId: string) => `/rider/active-deliveries/${orderId}/handoff`,
  riderVerification: "/rider/verification",
  riderDeliveries: "/rider/deliveries",
  riderProfile: "/rider/profile",

  // Admin
  adminLogin: "/admin-login",
  adminDashboard: "/admin/dashboard",
  adminOrders: "/admin/orders",
  adminOrderDetail: (id: string) => `/admin/orders/${id}`,
  adminNodes: "/admin/nodes",
  adminTeam: "/admin/team",
  adminApprovals: "/admin/approvals",
  adminPricing: "/admin/pricing",
  adminDisputes: "/admin/disputes",
  adminAnalytics: "/admin/analytics",
  /** Split-ratio config + payout-readiness entries — `POST/GET /admin/revenue-split`, `GET .../entries`, `PATCH .../mark-paid`. Replaces the old `/admin/rider-earnings` screen (undocumented endpoint, removed) next to "Analytics" (its closest thematic neighbour). */
  adminRevenueSplit: "/admin/revenue-split",
  /** Read-only reconciliation report — `GET /admin/capacity-audit`. Compares stored rider/Node capacity counters against expected values. */
  adminCapacityAudit: "/admin/capacity-audit",
  adminSettings: "/admin/settings",
  adminProfile: "/admin/profile",
} as const;

export const QUERY_KEYS = {
  session: ["session"] as const,
  nodes: ["nodes"] as const,
  node: (id: string) => ["nodes", id] as const,
  deliveries: ["deliveries"] as const,
  delivery: (id: string) => ["deliveries", id] as const,
  paymentIntent: (id: string) => ["payment-intent", id] as const,
  /** `GET /payments/banks` — Paystack's bank list, shared by the Rider and NodeOperator payout-account forms. Static reference data, same result regardless of which role fetches it. */
  payoutBanks: ["payments", "banks"] as const,

  nodeOperatorProfile: ["node", "operator-profile"] as const,
  nodeParcels: ["node", "parcels"] as const,
  nodeActivity: ["node", "activity"] as const,
  /** `GET /handoffs/my-node/orders` — every order that's touched this Node, either side. Source for the rider-handoff pick-lists and the awaiting-collection screen alike; invalidate this after any handoff/intake/collect mutation. */
  nodeMyOrders: ["node", "my-node-orders"] as const,
  /** `GET /earnings/my-node` — this Node's revenue-split entries (origin-Node orders only). */
  nodeEarnings: ["node", "earnings"] as const,

  riderAvailability: ["rider", "availability"] as const,
  /** `GET /earnings/mine` — the rider's own revenue-split entries, reduced client-side into today/total stats. */
  riderEarnings: ["rider", "earnings"] as const,
  riderVerification: ["rider", "verification"] as const,
  /** `GET /earnings/mine`'s raw entry list — distinct from `riderEarnings` above (same endpoint, different query fn/shape: reduced summary vs. raw entries). */
  riderEarningsEntries: ["rider", "earnings-entries"] as const,
  /** `GET /handoffs/my-orders` — every order this rider has ever been assigned. Source for the active-deliveries list; invalidate after accept/request-code (404). */
  riderMyOrders: ["rider", "my-orders"] as const,

  // Handoffs module. `availableOrders` is keyed on the coordinates it
  // was sorted against and the page — a different position is a
  // genuinely different result set, not a stale one to reuse.
  /** Prefix for every position/page variant below — invalidate this to refetch the board wholesale (e.g. after an accept). */
  riderAvailableOrdersRoot: ["rider", "available-orders"] as const,
  riderAvailableOrders: (latitude: number, longitude: number, page: number) =>
    ["rider", "available-orders", latitude, longitude, page] as const,
  nodeHandoffOrder: (trackingCode: string) =>
    ["node", "handoff-order", trackingCode] as const,

  adminDashboardStats: ["admin", "dashboard-stats"] as const,
  adminRecentOrders: ["admin", "recent-orders"] as const,
  adminNetworkStatus: ["admin", "network-status"] as const,
  adminOrders: ["admin", "orders"] as const,
  adminOrderDetail: (id: string) => ["admin", "orders", id] as const,
  adminNodes: ["admin", "nodes"] as const,
  adminNodeDetail: (id: string) => ["admin", "nodes", id] as const,
  adminTeam: ["admin", "team"] as const,
  adminNodeOperatorsPending: ["admin", "node-operators-pending"] as const,
  adminRidersPending: ["admin", "riders-pending"] as const,
  adminPricingRules: ["admin", "pricing-rules"] as const,
  adminDisputes: ["admin", "disputes"] as const,
  adminDisputeMetrics: ["admin", "dispute-metrics"] as const,
  adminSuperAdminOverview: ["admin", "super-admin-overview"] as const,
  adminAnalyticsSummary: ["admin", "analytics-summary"] as const,
  adminTopNodes: ["admin", "top-nodes"] as const,
  adminRiderPerformance: ["admin", "rider-performance"] as const,
  adminOrdersTrend: ["admin", "orders-trend"] as const,
  adminRevenueSplitRatios: ["admin", "revenue-split-ratios"] as const,
  adminRevenueSplitEntries: ["admin", "revenue-split-entries"] as const,
  adminCapacityAudit: ["admin", "capacity-audit"] as const,
};

/** Business rules shared between UI validation and quote calculation */
export const PARCEL_RULES = {
  maxValueForDropAndPick: 100_000, // NGN — above this, recommend Express
} as const;

export const CURRENCY = {
  code: "NGN",
  symbol: "₦",
} as const;

export const STORAGE_KEYS = {
  /** Set right before redirecting to Paystack (`authorizationUrl`) — docs/API.md doesn't guarantee the intent id comes back on the `/orders/payment-callback` query string, so the callback screen reads it from here instead. */
  pendingPaymentIntentId: "locoomo_pending_payment_intent_id",
  /** The persisted-session localStorage key — shared between `auth.service.ts` (writes it) and `core/api/client.ts`'s 401 → refresh → retry interceptor (clears it on a hard sign-out), which can't import `authService` directly (would be a circular import back into `client.ts`). */
  session: "locoomo_session",
} as const;
