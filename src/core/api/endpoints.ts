
export const ENDPOINTS = {
  // ── Authentication Module ─────────────────────────────────────
  auth: {
    // Shared self-registration for Consumer, Rider, and NodeOperator —
    // POST /auth/register, differing only in the `role` field. Real,
    // confirmed route per docs/API.md.
    consumerRegister: "/auth/register",
    // Shared login for every role (Consumer, Rider, NodeOperator,
    // Admin) — POST /auth/login is role-agnostic per docs/API.md.
    consumerLogin: "/auth/login",
    // Signup or login with Google — one endpoint, both outcomes,
    // distinguished server-side by whether the verified Google account
    // is already linked to a user. Real, confirmed route per docs/API.md.
    google: "/auth/google",

    // Session (shared across all roles)
    sessionRefresh: "/auth/refresh",
    sessionLogout: "/auth/logout",
    passwordResetRequest: "/auth/password-reset/request",
    passwordResetConfirm: "/auth/password-reset/confirm",
    verifyEmail: "/auth/verify-email",
    inviteConfirm: "/auth/invite/confirm",
  },

  // ── Users Module ───────────────────────────────────────────────
  users: {
    // Real, confirmed route per docs/API.md — Admin-only, invites a
    // node_operator/rider/admin account (never `consumer`).
    invite: "/users/invite",
    // Real, confirmed routes per docs/API.md — any authenticated role.
    // GET returns the caller's own account; PATCH sets `phone`, the one
    // field registration (password or Google) never collects.
    me: "/users/me",
  },

  // ── Nodes Infrastructure Module ───────────────────────────────
  nodes: {
    nearby: "/nodes/nearby", // ?latitude&longitude&radiusInMeters
  },

  // ── Node Operators (self-service onboarding, multi-Node) ────────
  // Real, confirmed routes per docs/API.md. Requires an authenticated
  // NodeOperator session.
  //
  // **One operator runs many Nodes** (docs/API.md, 2026-09-02). The
  // singular `GET /node-operators/me` this group used to carry is gone
  // — `myNodes` below replaces it, returning an array (empty, not 404,
  // when onboarding hasn't happened) with a `roleAtNode` on each item.
  // `payoutAccount` and `staffInvite` became per-Node path-param routes
  // for the same reason.
  nodeOperators: {
    /** The *first* Node only. A 2nd/3rd goes to `nodes` below — this answers `409 NODE_OPERATOR_ALREADY_ONBOARDED` once onboarded. */
    onboarding: "/node-operators/onboarding",
    /** Adds a 2nd, 3rd, … Node to an already-onboarded account. Same request/response shape as `onboarding`. `400 NODE_OPERATOR_NOT_ONBOARDED` if the first one was never completed. */
    nodes: "/node-operators/nodes",
    /** Every Node this account OWNS, each tagged `roleAtNode`. Empty array — never 404 — when not onboarded. Replaced the singular `/node-operators/me`. Confirmed `403 FORBIDDEN` for a `node_staff` session on the live backend (2026-09-08) despite the response shape's own `roleAtNode: "staff"` value implying otherwise — never call this for staff, see `nodeService.getMyNodes`. */
    myNodes: "/node-operators/me/nodes",
    // Sets/replaces one Node's payout bank account — real, confirmed
    // route per docs/API.md. Per-Node, not per-account: set it
    // separately for every Node you run. Owner membership only.
    // Verified against Paystack at submission time; requires a
    // `bankCode` from `payments.banks` below.
    payoutAccount: (nodeId: string) => `/node-operators/nodes/${nodeId}/payout-account`,
    /** Provisions a `node_staff` account at this Node — owner-only, and the Node must already be `active` (`403 NODE_NOT_ACTIVE`). Same invite-email/`POST /auth/invite/confirm` mechanism as `users.invite`. */
    staffInvite: (nodeId: string) => `/node-operators/nodes/${nodeId}/staff/invite`,
    /** This Node's currently-active staff — owner-only. The only way to recover a staff member's `userId` after the invite response, which `staffRemove` needs. Removed staff aren't listed. Not paginated. */
    staff: (nodeId: string) => `/node-operators/nodes/${nodeId}/staff`,
    /** Revokes one staff member's access to this Node — owner-only, `204` with no body. Soft (the membership flips to `removed`); doesn't touch their account or their other Nodes. `:userId` is a User id, not a membership id. */
    staffRemove: (nodeId: string, userId: string) =>
      `/node-operators/nodes/${nodeId}/staff/${userId}`,
    /**
     * Toggles whether this Node is publicly discoverable — owner-only,
     * and the Node must already be `active` (`403 NODE_NOT_ACTIVE`).
     *
     * **Not a deactivation.** `isPubliclyVisible: false` hides the Node
     * from `GET /nodes`/`/nodes/nearby` for non-Admins and blocks a
     * Consumer targeting it in `POST /payments/intents` (as origin *or*
     * destination, `404`). Everything else keeps working: handoffs,
     * earnings, staff, and receiving parcels another operator
     * dispatches to it. Genuine deactivation is `status: inactive` via
     * the Admin-only `PATCH /nodes/:id`.
     */
    visibility: (nodeId: string) => `/node-operators/nodes/${nodeId}/visibility`,
    /**
     * Places an order with this Node as the origin, on behalf of the
     * operator's own business — no Consumer involved. NodeOperator
     * **or** NodeStaff with a membership here (operational work, not
     * owner-gated), Node must be `active`.
     *
     * Same body as `payments.intents` minus `originNodeId` (the URL
     * supplies it, so a dispatcher can never point an order at a Node
     * they don't run) and the same response, `authorizationUrl`
     * included. The destination may be any `active` Node regardless of
     * its own `isPubliclyVisible` — dispatching to a partner's private
     * station is legitimate.
     */
    dispatch: (nodeId: string) => `/node-operators/nodes/${nodeId}/dispatch`,
    // Admin-only review queue — real, confirmed routes per docs/API.md.
    // Queues *Nodes*, not operators: an already-active operator's 2nd
    // Node still needs its own review, and `approve` takes the
    // membership's `profileId`, approving that one Node.
    pending: "/node-operators/pending",
    approve: (profileId: string) => `/node-operators/${profileId}/approve`,
  },

  // ── Admin Nodes / Franchise Network (onboarding, admin-only) ──
  adminNodes: {
    // Real routes per docs/API.md — the plain Nodes resource, Admin-scoped usage.
    create: "/nodes",
    list: "/nodes",
    detail: (id: string) => `/nodes/${id}`,
  },
  // ── Orders Engine ──────────────────────────────────────────────
  // Both real, documented routes (`GET /orders`, `GET /orders/:id`),
  // consumer-scoped to the caller's own orders. Real order *placement*
  // is `payments.intents` below, not an orders route.
  // (`calculateFare`/`book` were removed 2026-08-21 and
  // `scanHandoff`/`scanCollection` 2026-08-15 — all four undocumented
  // and callerless; the handoffs group below supersedes the latter two.)
  orders: {
    list: "/orders",
    detail: (id: string) => `/orders/${id}`,
  },

  // ── Handoffs Module (custody chain: drop-off → rider → arrival) ─
  // Real, confirmed routes per docs/API.md (2026-08-14). These are the
  // documented replacement for `riderOps.jobBoard`/`acceptJob`/
  // `scanPickup`/`scanDropoff` and `orders.scanHandoff` below/above,
  // none of which appear in API.md. Custody transfers on a 6-digit code
  // the rider reads to the Node operator — there's no `qrNonce` and no
  // GPS in this contract (only `availableOrders` takes coordinates, and
  // only to sort that one response). Don't wire new code to the older
  // routes; see core/types/handoff.types.ts for the full lifecycle.
  handoffs: {
    /** Rider (active). Query: latitude, longitude (required), page, limit. */
    availableOrders: "/handoffs/available-orders",
    /** Rider (active). Race-safe claim; capped at 3 concurrent deliveries. */
    accept: (orderId: string) => `/handoffs/orders/${orderId}/accept`,
    /** Rider. Every order you've ever been assigned, current and past, newest first. Query: page, limit. Real, confirmed per docs/API.md (2026-08-17) — closes the gap store/rider-jobs.store.ts used to paper over. */
    myOrders: "/handoffs/my-orders",
    /** NodeOperator or NodeStaff. Every order that's touched **any** Node you have a membership at, as origin or destination, current and past, newest first — `myRole` on each item says which side. Query: page, limit. Real, confirmed per docs/API.md (2026-08-17; widened to all your Nodes + NodeStaff 2026-09-02) — closes the gap store/node-outgoing.store.ts and store/node-parcels.store.ts used to paper over. */
    myNodeOrders: "/handoffs/my-node/orders",
    /** NodeOperator or NodeStaff. Scoped to orders whose originNodeId is one of your Nodes. */
    byTrackingCode: (code: string) =>
      `/handoffs/orders/by-tracking-code/${encodeURIComponent(code)}`,
    /** NodeOperator or NodeStaff (origin). Idempotent: awaiting_drop_off → parcel_received_at_origin. */
    dropOff: (orderId: string) => `/handoffs/orders/${orderId}/drop-off`,
    /** Rider (assigned to this order). Issues a 6-digit code that expires in 5 minutes. */
    requestCode: (orderId: string) => `/handoffs/orders/${orderId}/request-code`,
    /** NodeOperator or NodeStaff, membership-scoped to the side matching `type`. Idempotent on a re-used code. */
    confirmHandoff: (orderId: string) => `/handoffs/orders/${orderId}/confirm-handoff`,
    /** NodeOperator or NodeStaff (destination). Idempotent: arrived_at_destination → ready_for_collection, and emails the receiver their collection code. */
    intake: (orderId: string) => `/handoffs/orders/${orderId}/intake`,
    /** NodeOperator or NodeStaff (destination). Mints + re-emails a fresh collection code, superseding the prior one. Rate-limited 5/min — it sends real email. */
    collectionCodeResend: (orderId: string) =>
      `/handoffs/orders/${orderId}/collection-code/resend`,
    /** NodeOperator or NodeStaff (destination). Final step: ready_for_collection → completed. */
    collect: (orderId: string) => `/handoffs/orders/${orderId}/collect`,
  },

  // `riderOps.*` (job-board, accept-job, manifest, scan-pickup,
  // scan-dropoff) was removed 2026-08-15 — undocumented, superseded by
  // the `handoffs` group above, and no longer called by any code.

  // ── Riders (KYC verification / onboarding) ──────────────────────
  // Real, confirmed routes per docs/API.md. Requires an authenticated
  // Rider session. Distinct from `riderOps` above, which is the
  // already-approved Rider's live job-board/manifest data.
  riders: {
    uploadSignature: "/riders/verification/upload-signature",
    onboarding: "/riders/onboarding",
    me: "/riders/me",
    // Sets/replaces the rider's payout bank account — real, confirmed
    // route per docs/API.md. Verified against Paystack at submission
    // time; requires a `bankCode` from `payments.banks` below.
    payoutAccount: "/riders/me/payout-account",
    // Admin-only review queue — real, confirmed routes per docs/API.md.
    pending: "/riders/pending",
    approve: (profileId: string) => `/riders/${profileId}/approve`,
  },

  // ── Payments ─────────────────────────────────────────────────────
  // Real, confirmed, frontend-facing routes per docs/API.md.
  // (`POST /payments/webhooks/paystack` is deliberately absent — it's
  // server-to-server only, Paystack calls it directly, this app never
  // does. A `webhook(provider)` constant that didn't match it was
  // removed 2026-08-21; it was never called.)
  payments: {
    intents: "/payments/intents",
    intentDetail: (id: string) => `/payments/intents/${id}`,
    // Paystack's full bank list — Rider/NodeOperator session required.
    // Deliberately not paginated per docs/API.md; a whole reference
    // list meant to back one dropdown/search, not a growing resource.
    banks: "/payments/banks",
  },

  // ── Admin Pricing ────────────────────────────────────────────────
  // Real, confirmed routes per docs/API.md. Append-only — POST never
  // edits an existing rule, it adds a new one that becomes "current."
  adminPricing: {
    create: "/admin/pricing",
    list: "/admin/pricing",
  },

  // ── Earnings (revenue split) ────────────────────────────────────
  // Real, confirmed routes per docs/API.md. Every `completed` order's
  // fee is split rider/origin-Node/platform per the Admin-configured
  // ratio below, at the moment `handoffs.collect` succeeds.
  earnings: {
    /** Rider's own revenue-split entries, newest first. Paginated. */
    mine: "/earnings/mine",
    /** NodeOperator's own Node's revenue-split entries (origin-Node orders only), newest first. Paginated. */
    myNode: "/earnings/my-node",
  },
  adminRevenueSplit: {
    /** Admin. Sets the split ratio for every order completed from now on — append-only. */
    create: "/admin/revenue-split",
    /** Admin. Ratio history, newest first. Paginated. */
    list: "/admin/revenue-split",
    /** Admin. Every revenue-split entry across every completed order, newest first. Paginated. Query: partyType, payoutStatus. */
    entries: "/admin/revenue-split/entries",
    /** Admin. Records an entry as settled off-system. Idempotent. */
    markEntryPaid: (entryId: string) => `/admin/revenue-split/entries/${entryId}/mark-paid`,
  },

  // ── Admin diagnostics ────────────────────────────────────────────
  // Real, confirmed route per docs/API.md. Read-only reconciliation
  // report comparing the stored rider/Node capacity counters against
  // freshly-computed expected values.
  adminDiagnostics: {
    capacityAudit: "/admin/capacity-audit",
  },
} as const;
