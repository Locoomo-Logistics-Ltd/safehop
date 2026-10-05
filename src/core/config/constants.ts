

export const ROUTES = {
  // Auth
  roleSelect: "/role-select",
  createAccount: "/create-account",
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  acceptInvite: "/accept-invite",
  /** Shown post-login (password or Google) whenever `phone` is still `null` — `PATCH /users/me`. See docs/API.md. */
  completeProfile: "/complete-profile",
  /** Where the emailed verification link lands — `?token=...`, `POST /auth/verify-email`. Informational only per docs/API.md; nothing is gated on it. */
  verifyEmail: "/verify-email",
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

  // Node Operator (runs one *or more* Nodes — Pickup Stations)
  nodeHome: "/node/home",
  nodeScan: "/node-scan",
  nodeActivity: "/node/activity",
  nodeProfile: "/node/profile",
  /** This operator's Nodes' revenue-split entries — `GET /earnings/my-node`. One combined ledger: the endpoint returns no node id, so it can't be split per Node. Owner-only (a NodeStaff session gets 403), hence hidden from staff's nav. */
  nodeEarnings: "/node/earnings",
  /**
   * "My Nodes" — an owner's stations list (`GET
   * /node-operators/me/nodes`), on its own page as of 2026-09-21.
   *
   * This list used to render inline inside Node Profile; it moved here
   * and Profile now links to it. Sits next to the `/node/nodes/:id`
   * detail and `/node/nodes/new` routes it already shares a path with,
   * and tapping a station here opens that detail page.
   */
  nodeNodes: "/node/nodes",
  /** Station setup + status (`MyNodesScreen`) — where auth-routing sends a brand-new operator to create their first Node, and where the dashboard's empty/pending states and the Node switcher link. Unchanged. */
  nodeSetup: "/node/setup",
  /** One Node's detail: approval status, its own payout account, and its staff invites — all three per-Node and owner-only. `PATCH /node-operators/nodes/:nodeId/payout-account`, `POST /node-operators/nodes/:nodeId/staff/invite`. */
  nodeDetail: (nodeId: string) => `/node/nodes/${nodeId}`,
  /** Add a 2nd, 3rd, … Node — `POST /node-operators/nodes`. Same form as first-Node onboarding, different endpoint (see `nodeService.addNode`). */
  nodeAddNode: "/node/nodes/new",
  /** Send a parcel from one of your own stations — `POST /node-operators/nodes/:nodeId/dispatch`. Open to NodeOperator *and* NodeStaff (operational work); origin is the active station, so it isn't in the URL. */
  nodeDispatch: "/node/dispatch",
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

  /** `GET /node-operators/me/nodes` — every Node this account OWNS. Replaced `nodeOperatorProfile` (the singular `GET /node-operators/me`, route removed 2026-09-02); invalidate after onboarding, adding a Node, or setting a payout account. Owner-only — confirmed `403` for `node_staff` 2026-09-08; never fetched for a staff session, see `use-my-nodes.ts`. */
  nodeOperatorNodes: ["node", "my-nodes"] as const,
  /** `GET /nodes/:id` — one Node's full record, open to any authenticated role. Used to enrich the node id(s) a `node_staff` session discovers from `nodeMyOrders` into real station details (capacity, status, visibility) — see `use-my-nodes.ts`. */
  nodeStationDetail: (nodeId: string) => ["node", "station-detail", nodeId] as const,
  /** `GET /node-operators/nodes/:nodeId/staff` — one Node's active staff roster. Per-Node, so keyed on the id; invalidate after an invite (the invitee appears once they accept) or a removal. */
  nodeStaff: (nodeId: string) => ["node", "staff", nodeId] as const,
  nodeParcels: ["node", "parcels"] as const,
  nodeActivity: ["node", "activity"] as const,
  /** `GET /handoffs/my-node/orders` — every order that's touched this Node, either side. Source for the rider-handoff pick-lists and the awaiting-collection screen alike; invalidate this after any handoff/intake/collect mutation. */
  nodeMyOrders: ["node", "my-node-orders"] as const,
  /** `GET /earnings/my-node` — this operator's Nodes' revenue-split entries, both origin (`node`) and destination (`destination_node`) rows. */
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
  /** Which of a multi-Node operator's Nodes the counter screens are currently scoped to — `store/active-node.store.ts`. A convenience, not state anything depends on: an unset, stale, or foreign id just falls back to the first active Node. */
  activeNodeId: "locoomo_active_node_id",
  /** Set alongside `pendingPaymentIntentId` when the checkout being sent to Paystack is a Node dispatch, not a Consumer booking. `/orders/payment-callback` reads it to pick its branch — a dispatching operator can't poll `GET /payments/intents/:id` (Consumer-only), so that screen must not try. Cleared on arrival. */
  pendingDispatch: "locoomo_pending_dispatch",
} as const;
