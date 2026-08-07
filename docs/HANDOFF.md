# HANDOFF.md

> Always describes the *current* project state. Overwrite this file's
> contents each session (unlike `IMPLEMENTATION_LOG.md`, which is
> append-only).

## Current objective

**Latest session (2026-08-07, most recent — Rider Verification gating
pass):** a prior session (see the "Rider-scoped session" note below)
had already built `/rider/verification` end-to-end and pointed the
post-login redirect straight at it, but nothing actually *enforced*
"a Rider can't use Rider features until verified" beyond that one-time
redirect — a Rider could type `/rider/home` or `/rider/jobs` into the
URL bar directly regardless of `GET /riders/me`'s `data.status`. This
session closed that gap, but **not** with a blanket route-group block
— per explicit product direction, Home/Earnings/Profile stay freely
browsable for an unverified Rider (a dismissible reminder nudges them
on Home instead), and only **Jobs** — the one screen where
verification actually matters, since accepting a job unverified isn't
a real option — hard-blocks with a message and a link back to
`/rider/verification`. Rider's post-login redirect changed from
`/rider/verification` to `/rider/home` accordingly. Full detail in
`docs/IMPLEMENTATION_LOG.md`'s matching 2026-08-07 entry.

**Previous session (2026-08-07):** replaced the Rider and NodeOperator
authentication/onboarding flow — previously calling five undocumented
routes never confirmed against `docs/API.md` — with the real,
documented flow: `POST /auth/register` (role: `rider` / `node_operator`)
→ `POST /auth/login` → role-based redirect into the already-built
onboarding screens (`/rider/verification`, `/vendor/node-setup`). Full
detail in the "Rider + NodeOperator Authentication session" note below
and `docs/IMPLEMENTATION_LOG.md`'s matching entry.

Previous sessions (still true, unrelated to this one): integrated the
Admin UI with the real backend API, built the invitee-facing Invite
Acceptance flow (`/accept-invite`), and wired `PATCH /nodes/:id`
behind Node Network's "Manage" button so an Admin can approve a
pending Node or suspend/reactivate one.

**Vendor-scoped session (2026-08-07, later still):** a separate pass
scoped strictly to Vendor/Node features (no Rider/Admin/Auth changes)
integrated the two ❌ `Node Operators` rows from
`docs/API_INTEGRATION_STATUS.md` that are Vendor-facing:
`POST /node-operators/onboarding` and `GET /node-operators/me`. See
the dated entry under "Current progress" below for details. The other
two `Node Operators` rows (`GET /node-operators/pending`,
`PATCH /node-operators/:id/approve`) are Admin-only and were
deliberately left untouched — out of this session's scope.

**Rider-scoped session (2026-08-07, later still):** a separate pass
scoped strictly to Rider features (no Vendor/Node/Admin/Auth changes)
integrated the three ❌ `Riders` rows from
`docs/API_INTEGRATION_STATUS.md`: `GET /riders/verification/upload-signature`,
`POST /riders/onboarding`, `GET /riders/me` — the structurally
identical self-onboarding-and-wait pattern the Vendor session above
solved for Node Operators, applied to Rider KYC verification. See the
dated entry under "Current progress" below. The other two `Riders`
rows (`GET /riders/pending`, `PATCH /riders/:id/approve`) are
Admin-only and were deliberately left untouched — out of this
session's scope.

**Rider + NodeOperator Authentication session (2026-08-07, later
still — this session's focus):** the previous two sessions above both
explicitly deferred Rider/Vendor *auth* (login/register) as
out-of-scope, noting it still ran through undocumented routes
(`/auth/rider/register`, `/auth/rider/login`, `/auth/node-staff/*`).
This session closed that gap: Rider and NodeOperator now
self-register via the real, documented `POST /auth/register` (role
field) and log in via the real `POST /auth/login`, exactly like
Consumer — no more dedicated undocumented endpoints. This closes
standing item #4 on the "Remaining work" list below in full (Rider
self-registration + KYC onboarding UI) and its NodeOperator
equivalent. See the dated entry under "Current progress" below for
the full file list; `docs/IMPLEMENTATION_LOG.md`'s matching
2026-08-07 entry has the deepest detail, including the root-cause
analysis (`UserRole` never actually matched the backend's role enum)
and a login/register bug fix that was blocking this work.

## Current understanding

- Same layered architecture as every other role:
  `app/(admin)/**/page.tsx` (routes only) →
  `modules/admin/components/**` (screens) → `modules/admin/hooks/*`
  (TanStack Query) → `core/api/services/admin.service.ts` /
  `auth.service.ts` → `httpClient`.
- **`docs/API.md` and the frontend's `core/api/endpoints.ts` used to
  describe two different backend contracts for the Admin surface.**
  A previous session marked three routes "wired for real" that don't
  appear anywhere in `API.md`: `corporateOps.provisionStaff`,
  `corporateOps.elevateSuperAdmin`, `adminNodes.onboardPartner`. Node
  onboarding and staff invites are now both corrected (→ real
  `POST /nodes` and `POST /users/invite` respectively) — **only
  `elevateSuperAdmin` is still wired to an unconfirmed route**, treat
  it as not-working until corrected (or confirmed to have no real
  equivalent — see below). `API.md`'s actual, confirmed Admin surface:
  `POST /auth/login` (role-agnostic), `POST /nodes`, `GET /nodes`,
  `GET /nodes/:id`, `PATCH /nodes/:id`, `GET/PATCH /node-operators/...`,
  `GET/PATCH /riders/...`, and `POST /users/invite`. See
  `docs/API_INTEGRATION_STATUS.md` for the live, endpoint-by-endpoint
  status — that's the file to check first, this section just narrates
  it.
- **`AdminTeamRole` (`super_admin`/`ops_manager`/`node_manager`/
  `support_agent`) is a fictional taxonomy with no backend list
  endpoint to check it against — don't confuse it with `InvitableRole`
  (`node_operator`/`rider`/`admin`), which is the real backend's role
  enum and is what `POST /users/invite` actually accepts.** They live
  in the same file (`admin.types.ts`) but represent different things;
  Team Management's role *filter* dropdown still uses the fictional
  one (harmless — the list it filters is empty, `NOT_IMPLEMENTED`),
  while the *invite form*'s role picker correctly uses the real one.
- **Admin accounts are always backend-provisioned, never
  self-registered, and never reachable from `/role-select`** — this
  was confirmed with the project owner explicitly. `/admin-login` is a
  standalone URL (same pattern as `/rider-login`), not linked from
  anywhere in the public onboarding flow. Don't add an admin option to
  `role-select` — it's deliberately still commented out in
  `modules/user/constants/roles.ts`.
- **Auth is now fully unified across Consumer, Rider, and NodeOperator
  (2026-08-07).** All three self-register via `POST /auth/register`
  (`role: "consumer" | "rider" | "node_operator"`, `CreateAccountScreen`
  reading `?role=`) and log in via the same `POST /auth/login`
  (`LoginScreen`) — Admin still logs in separately via `/admin-login` →
  `loginAdmin` (unchanged, backend-provisioned only). `UserRole`
  (`core/types/user.types.ts`) was corrected to the real backend enum
  (`"consumer" | "node_operator" | "rider" | "admin"` — it previously
  had `"user"`/`"vendor"`, which never matched anything the backend
  actually returns). Post-login redirect branches on `session.user.role`:
  Consumer → `/dashboard`, NodeOperator → `/vendor/node-setup` (handles
  the form/pending/active states from the prior two sessions above).
  `/rider-login` and `/vendor-setup` (the old undocumented-flow
  screens) are deleted — Rider/NodeOperator logout now redirects to
  `/role-select` like every other role. `(rider)/layout.tsx` and
  `(vendor)/layout.tsx` now gate on `allowedRoles` (`["rider"]` /
  `["node_operator"]`), same pattern `(admin)/layout.tsx` already used.
  **Updated 2026-08-07 (gating pass): Rider → `/rider/home`**, not
  `/rider/verification` — see "Rider Verification / KYC onboarding"
  further down for why (Home/Earnings/Profile stay browsable
  pre-approval by product decision; only Jobs is gated on verification
  status).
- **`/accept-invite` is now implemented, real, and public** (no
  `AuthGuard` — same as `/login`/`/reset-password`, none of the
  top-level `src/app/*` routes are behind a route-group layout).
  `AcceptInviteScreen` is modeled directly on `ResetPasswordScreen`
  (token-from-query-string, one password field, terminal
  success-then-manual-redirect-to-login state), with a required
  Terms/Privacy consent checkbox borrowed from `CreateAccountScreen`'s
  pattern — `InviteConfirmPayload` is the one confirm-payload shape in
  this codebase that needs `consentAccepted` (the inviting Admin can't
  accept ToS on the invitee's behalf per `API.md`). See
  `IMPLEMENTATION_LOG.md`'s 2026-08-07 entry for the full file list.

## Current progress

- [x] Read `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `API.md`, this
      file, and the live source before writing any code
- [x] Produced the Feature → Endpoint → Status audit table (see
      `IMPLEMENTATION_LOG.md`) and confirmed the discrepancy above
      with the project owner before proceeding
- [x] Implemented Admin login end-to-end:
      `authService.loginAdmin()` (reuses the real, role-agnostic
      `POST /auth/login`, rejects+revokes on a non-admin role match),
      `AuthGuard`'s new `allowedRoles` prop, `(admin)/layout.tsx` now
      gated to `role: "admin"` only, `/admin-login` route + screen +
      hook.
- [x] Wired Node Network to real data: `GET /nodes` (list, via
      `adminService.getNodeStatuses`) and `GET /nodes/:id` (detail,
      via `adminService.getNodeDetail`, expands inline on each node
      card's "View Details" button — every wired endpoint has a real
      screen driving it, no screenless integrations). Required
      correcting `AdminNodeStatus`'s fields to match what the backend
      actually returns (no online/offline telemetry, no per-node order
      count, capacity is a raw max not a live percentage).
- [x] Wired Node Network's "Add Node" form to the real `POST /nodes`
      — the previous version only collected name/address/contactPhone,
      none of which matches the real required body, so it would have
      400'd on every submit. Form now collects
      name/address/city/state/latitude/longitude/capacity
      (operatingHours optional), matching `API.md` exactly.
- [x] Built Team Management's "Invite Member" form from scratch (the
      button had no form behind it at all before) and wired it to the
      real `POST /users/invite`, replacing `provisionStaff`'s
      unconfirmed `/corporate-ops/staff/provision`. Role picker is
      scoped to the real invitable roles (`node_operator`/`rider`/
      `admin`) — deliberately not the fictional `AdminTeamRole` the
      rest of this screen still uses (see "Current understanding").
- [x] Created `docs/API_INTEGRATION_STATUS.md` — a living checklist of
      every endpoint `docs/API.md` documents and whether the frontend
      correctly calls it. **Update this file every time an endpoint's
      status changes** — the project owner asked for this to stay
      current, not be a one-time snapshot.
- [x] `npx tsc --noEmit`, `npx eslint`, `npm run build` all pass with
      the new code included

**2026-08-07 session:**
- [x] Read `docs/API.md`'s `POST /auth/invite/confirm` section and the
      existing `ResetPasswordScreen`/`ForgotPasswordScreen` flow before
      writing any code, per instructions.
- [x] Built the `/accept-invite` page end-to-end: reads `token` from
      the query string, "Set Password" form (Password, Confirm
      Password, required Terms & Privacy Policy consent checkbox),
      calls `authService.confirmInvite` → real
      `POST /auth/invite/confirm`, success state redirects to
      `/login`. Handles `400 VALIDATION_FAILED` (via
      `getFriendlyError`'s existing `error.details` rendering),
      `401 INVALID_INVITE_TOKEN` (new dedicated "this invite link no
      longer works" state, plus a new `getFriendlyError` case), and
      `429 RATE_LIMITED` (already generic).
- [x] Updated `docs/API_INTEGRATION_STATUS.md` — moved
      `POST /auth/invite/confirm` from ❌ to ✅.
- [x] `npx tsc --noEmit`, `npx eslint`, `npm run build` all pass.
      Dev-server `curl` smoke test confirmed both the form state
      (`?token=...`) and the missing-token state render their expected
      copy.

**2026-08-07 (later — Admin-facing copy pass):**
- [x] Reworded every `NOT_IMPLEMENTED`-backed empty state that was
      leaking internal language at the Admin — endpoint names, "no
      backend endpoint yet," literal `docs/HANDOFF.md` pointers — into
      plain product copy (e.g. "Orders will appear here once customers
      start placing them"). No behavior changed, only the strings an
      Admin can actually see. Full file list in
      `IMPLEMENTATION_LOG.md`'s matching entry.
- [x] `npx tsc --noEmit` clean. Copy-only change, no new lint/build
      surface.

**2026-08-07 (later — PATCH /nodes/:id):**
- [x] Wired Node Network's previously-decorative "Manage" button to
      the real `PATCH /nodes/:id`: `adminService.updateNode(nodeId,
      payload)`, a new `useManageNode` hook, and an inline status-
      change panel on each `NodeStatusCard` (status dropdown +
      "Save," disabled when unchanged). Only the `status` field is
      exercised — the real route also accepts name/address/city/
      state/country/latitude/longitude/capacity/operatingHours, and
      `UpdateNodePayload` models all of them, but no screen edits
      those yet (approve/suspend/reactivate was the concrete ask).
- [x] `npx tsc --noEmit`, `npx eslint`, `npm run build` all pass
      (`/admin/nodes` bundle grew ~0.5kB for the new panel).
      **Not performed**: browser verification against a live backend
      — same caveat as every other Node Network action so far.

**2026-08-07 (later still — Rider + NodeOperator Authentication):**
- [x] Read `docs/API.md`, `docs/ARCHITECTURE.md`, `docs/PROJECT_CONTEXT.md`,
      this file, and `docs/API_INTEGRATION_STATUS.md` before writing
      any code, per instructions. Confirmed the exact undocumented
      routes in use (`endpoints.ts`) and that the real onboarding
      endpoints (`riders.*`, `nodeOperators.*`) were already correctly
      wired from the two prior sessions above — only the
      register/login entry point needed replacing.
- [x] Corrected `UserRole` (`core/types/user.types.ts`) from
      `"user" | "rider" | "vendor" | "admin"` to the real backend enum
      `"consumer" | "node_operator" | "rider" | "admin"` — the root
      cause of why Rider/NodeOperator couldn't previously use the real
      `/auth/register` (there was no correct `role` value to send).
      Added optional `role` to `RegisterConsumerPayload`. Removed
      `RegisterRiderPayload`/`LoginRiderPayload`/`RiderOnboardingPayload`/
      `LoginNodeStaffPayload`/`FirstLoginResetPayload`.
- [x] Removed the five undocumented routes from `core/api/endpoints.ts`
      (`auth.riderRegister`, `auth.riderLogin`, `auth.nodeStaffProvision`,
      `auth.nodeStaffLogin`, `auth.nodeStaffFirstLoginReset`) and the
      undocumented `identity.riderOnboarding`. Removed the matching
      dead methods from `auth.service.ts`
      (`registerRider`/`loginRider`/`loginNodeStaff`/`firstLoginReset`/
      `submitRiderOnboarding`).
- [x] `RoleSelectScreen` → Rider/NodeOperator options now push to
      `/create-account?role=rider` / `?role=node_operator`.
      `CreateAccountScreen` reads `?role=` (via `useSearchParams`,
      already `<Suspense>`-wrapped by the page) and includes it in the
      register payload — same fields for all three roles, matching
      `API.md` (no per-role registration fields exist; the two roles'
      real differentiation is in their post-login onboarding step).
- [x] **Bug fix**: `useAuth()`'s `registerMutation` was calling
      `setSession()` on a successful registration, as if register
      logged the user in. `API.md` is explicit that it doesn't (no
      cookies are set) — this was creating a client-side session with
      no matching server-side cookie. Fixed to just toast + redirect
      to `/login`.
- [x] **Bug fix**: `CreateAccountScreen`'s password strength meter
      (uppercase/lowercase/number/special-char) contradicted `API.md`'s
      explicit "don't build this, it'll reject valid passwords"
      guidance — replaced with the length-only check (≥12 chars)
      `ResetPasswordScreen` already used correctly. Flagged as
      priority-4 in `docs/API_INTEGRATION_STATUS.md` before this
      session; fixed here since this screen now also gates
      Rider/NodeOperator registration.
- [x] `useAuth()`'s `loginMutation` now redirects by
      `session.user.role` instead of hardcoding `/dashboard` — Rider →
      `/rider/verification`, NodeOperator → `/vendor/node-setup`,
      Consumer/Admin fallback → `/dashboard`.
- [x] Deleted the now-unreachable undocumented-flow screens/hooks/routes:
      `src/app/rider-login/`, `src/app/vendor-setup/`,
      `src/modules/rider/components/auth/` (`RiderLoginScreen.tsx`),
      `src/modules/rider/hooks/use-rider-login.ts`,
      `src/modules/vendor/components/setup/` (`VendorSetupScreen.tsx`),
      `src/modules/vendor/hooks/use-vendor-login.ts`. Removed the
      matching dead `ROUTES.riderLogin`/`ROUTES.vendorSetup` entries.
      `useRiderAuth`'s logout now redirects to `/role-select` (was the
      now-deleted `/rider-login`).
- [x] Added `allowedRoles={["rider"]}` / `allowedRoles={["node_operator"]}`
      to `(rider)/layout.tsx` / `(vendor)/layout.tsx` (previously
      unrestricted to any authenticated session) — same `AuthGuard`
      pattern `(admin)/layout.tsx` already used.
- [x] Added missing `getFriendlyError` cases directly relevant to this
      flow: `ACCOUNT_SUSPENDED` (login), `RIDER_ALREADY_ONBOARDED` /
      `NODE_OPERATOR_ALREADY_ONBOARDED` (re-submitting onboarding),
      `INTERNAL_ERROR` (the real 500 code — the switch only had the
      never-returned `INTERNAL_SERVER_ERROR` spelling).
- [x] Updated `docs/API_INTEGRATION_STATUS.md` — `/auth/register` and
      `/auth/login` rows moved to fully ✅, the "Rider and Vendor auth
      do not go through documented endpoints" inconsistency marked
      resolved, summary counts updated (15 ✅ / 4 🟡 / 4 ❌).
- [x] `npx tsc --noEmit`, `npx eslint src`, `npm run build` all pass
      (after clearing a stale `.next/types` cache referencing the
      deleted routes). Dev-server smoke test: `/rider-login` and
      `/vendor-setup` confirmed `404`; `/role-select`,
      `/create-account`, `/create-account?role=rider`,
      `/create-account?role=node_operator`, `/login` all `200`; each
      `?role=` variant's distinct heading confirmed via `curl` + grep.
- [ ] **Not performed**: end-to-end verification against a live
      backend (register → login → role-redirect → onboarding-screen
      round trip) — no real account was available this session, same
      standing caveat as every other real-route integration in this
      file without a live session to test against.

## Remaining work

**From previous sessions** (unchanged, not touched this session —
still open):
1. Resolve doc/code drift in root-level docs (`README.md`,
   `API_INTEGRATION.md` bearer-token claim, mock/real API claim).
2. Backend response-shape verification for `mapSessionResponse` /
   `mapFareResponse` / `mapInventoryResponse` /
   `mapNotificationToActivity`.
3. Payment SDK integration (`deliveryService.pay()` is a no-op).
4. ~~Rider self-registration + KYC onboarding UI.~~ **Done** (2026-08-07,
   Rider-scoped session). ~~Rider auth redirect isn't gated on
   verification status yet.~~ **Also done** (2026-08-07, gating pass)
   — see "Rider Verification / KYC onboarding" under "Remaining work"
   below for the final shape (Jobs blocks outright, Home/Earnings/
   Profile stay browsable with a dismissible reminder).
5. Remove `src/core/mocks/` — deliberately deferred until the project
   is feature-complete.
6. Minor cleanup: stray `tsconfig.json` include entry,
   `console.log`/`console.error` in `ForgotPasswordScreen.tsx`.

**Admin backend integration** (ongoing):
7. **Admin login, all of Node Network (list/detail/create/manage),
   and Team Management's invite are done — every one has a real
   screen driving it, by policy (no screenless integrations).** Next
   candidates:
   - `updateNode`/"Manage" only sends `status`. The real
     `PATCH /nodes/:id` also accepts name/address/city/state/country/
     latitude/longitude/capacity/operatingHours (`UpdateNodePayload`
     already models all of them) — extending the "Manage" panel into
     a full edit form is a natural follow-up if the design calls for
     it, not currently required.
   - `elevateSuperAdmin` (Super Admin screen) is still wired to the
     unconfirmed `/corporate-ops/staff/elevate-superadmin` — `API.md`
     has no `super_admin` role concept, so there may genuinely be no
     real equivalent to correct it to. Worth confirming with backend
     before spending more time on it.
   - `GET /node-operators/pending` + `PATCH /node-operators/:id/approve`
     and `GET /riders/pending` + `PATCH /riders/:id/approve` are real,
     confirmed routes with **no screen in the current 8-frame design**
     — worth flagging to whoever owns the design, since they're
     genuine Admin actions (approving new Nodes/Riders) that the UI
     doesn't currently surface anywhere.
   - `GET /nodes/nearby` (used by the User role's node-selection
     screen, not Admin) sends `radiusInMeters` but `API.md` requires
     `radiusKm` — flagged in `API_INTEGRATION_STATUS.md`, not fixed
     yet, out of this session's Admin scope but worth a look since
     it'll likely 400 against the live backend as-is.
8. **No backend route exists at all** (confirmed against `API.md`,
   not just `endpoints.ts`) for: Dashboard summary stats, network-wide
   recent orders, network status/telemetry, admin-scoped order
   list/detail, Dispute Center (anything), Analytics (anything), and
   "elevate to super admin" (API.md's role enum has no `super_admin`
   concept — only `consumer` / `node_operator` / `rider` / `admin`).
   Leave all of these `NOT_IMPLEMENTED`; don't invent shapes for them.
9. **Visual/browser verification still hasn't been done** for any
   Admin screen, including the new login screen — Claude in Chrome
   wasn't used this session either. Do a browser pass (log in as a
   real admin, confirm the redirect and role-gate behavior, click
   through at least Node Network and Team Management) before treating
   any of this as production-ready.

**Vendor Node Setup** (2026-08-07, later still — this session's
focus, done, but not browser-verified):
12. Built `/vendor/node-setup` end-to-end: `GET /node-operators/me`
    on mount (three real outcomes — `404 NOT_FOUND` → onboarding form,
    `node.status: "pending"` → waiting-for-approval state,
    `node.status: "active"` → approved confirmation linking to
    `/vendor/home`), and `POST /node-operators/onboarding` on submit
    (fields identical to Admin's `POST /nodes` form minus
    `onboardingType`, which the backend forces to `portal`). Reachable
    via a new "Node Setup" row on `VendorProfileScreen` — no
    screenless integration.
13. ~~Deliberately did **not** touch Vendor auth~~ **Resolved
    2026-08-07** (Authentication session, see above): NodeOperator now
    logs in via the real `POST /auth/login` and is routed straight to
    `/vendor/node-setup` on every login (not `/vendor/home`) — so a
    `pending` Node is now unavoidably surfaced, closing the gap this
    item used to describe. `VendorNodeSetupScreen`'s `active` state
    still links to `/vendor/home` as one extra click rather than
    auto-redirecting past it — acceptable per the task's flow spec
    (post-login → onboarding/approval-status screen), but worth
    revisiting if product wants "already-approved" NodeOperators to
    skip straight to the dashboard on login instead.
14. Not exercised against a live backend — same caveat as every other
    real-route integration in this file without a live session to
    test against.

**Rider Verification / KYC onboarding** (2026-08-07, later still —
Rider-scoped session's focus, done, but not browser-verified):
15. Built `/rider/verification` end-to-end, inside the `(rider)` route
    group (nav chrome + the group's existing `AuthGuard`, same
    placement decision the Vendor session made for
    `/vendor/node-setup`): `GET /riders/me` on mount (three real
    outcomes — `404 NOT_FOUND` → verification form, `status: "pending"`
    → under-review state showing the uploaded document's signed
    `viewUrl`, `status: "active"` → verified confirmation linking to
    `/rider/home`), then on submit: `GET
    /riders/verification/upload-signature` → direct-to-Cloudinary
    upload (file bytes never touch this API, per `API.md`) → `POST
    /riders/onboarding` with the resulting `public_id`. Reachable via
    a new status-aware "Verification" row on `RiderProfileScreen` — no
    screenless integration.
16. ~~Deliberately did **not** touch Rider auth~~ **Resolved
    2026-08-07** (Authentication session, see above): Rider logs in via
    the real `POST /auth/login`. ~~Routed straight to
    `/rider/verification` on every login~~ **Changed again, 2026-08-07
    (gating pass)**: Rider now lands on `/rider/home` instead — see
    item 18 below for the full reasoning. `RiderVerificationScreen`'s
    `active` state still links to `/rider/home` rather than
    auto-redirecting, same "extra click after approval" tradeoff noted
    for NodeOperator above (item 13).
17. Not exercised against a live backend — same caveat as every other
    real-route integration in this file without a live session to
    test against. In particular, `RiderVerificationDocument.viewUrl`
    (the signed Cloudinary URL `GET /riders/me` returns) has not been
    confirmed to actually render/download in a browser.

**Rider Verification gating** (2026-08-07, later still — this
session's focus, done, but not browser-verified):
18. Closed the gap item 16 above used to describe: nothing previously
    stopped an unverified Rider from navigating straight to
    `/rider/home` or `/rider/jobs` by URL — only the post-login
    redirect touched `/riders/me`'s `data.status`, one time. Per
    explicit product direction, the fix is **not** a blanket
    route-group block:
    - `RiderHomeScreen` (post-login landing page now) reads
      `GET /riders/me` via `useRiderVerification()` and shows a
      dismissible `VerificationReminderSheet` (new component,
      `src/modules/rider/components/verification/`) when
      `data.status !== "active"` — "Verify Now" links to
      `/rider/verification`, "Maybe Later" dismisses (persisted to
      `sessionStorage` for the tab session, reappears on a fresh one).
      Earnings (`/rider/deliveries`) and Profile are untouched — both
      already browsable, Profile already surfaces the verification
      status row from the prior session.
    - `JobOfferScreen` (`/rider/jobs`) is the one screen actually
      hard-gated: checks `useRiderVerification()` before rendering any
      job-board content; anything other than `data.status === "active"`
      renders an `EmptyState` ("Verification required") with a button
      to `/rider/verification` instead.
    - `useAuth()`'s Rider post-login redirect changed from
      `/rider/verification` to `/rider/home` to match (see item 16).
    - Added `getFriendlyError` cases for `UNAUTHENTICATED` and
      `FORBIDDEN` in `core/api/errors.ts` (previously fell through to
      the generic default message) — both explicitly required error
      codes for the verification submission flow.
19. `npx tsc --noEmit`, `npx eslint src/modules/rider
    src/modules/user/hooks/use-auth.ts src/core/api/errors.ts`, and
    `npm run build` all pass (build required clearing a stale `.next`
    cache first, unrelated to this session's changes — same class of
    issue a prior session hit and noted). Dev-server `curl` smoke test:
    `/rider/home`, `/rider/jobs`, `/rider/verification`,
    `/rider/profile` all return `200`.
20. **Not performed**: interactive browser verification of the actual
    gating behavor — no live Rider account/session was available this
    session (same standing caveat as items 14/17 above). The `curl`
    smoke test only confirms the routes compile and render; `AuthGuard`
    blanks them client-side without a session cookie, so it doesn't
    exercise the verification-status branches (reminder
    dismiss/reappear, Jobs block → verify → submit → pending →
    admin-approves → Jobs unblocks) themselves. Do a real browser pass
    with a Rider account before treating this as production-ready.

**Invite Acceptance flow** (done, but not
browser-verified):
10. `/accept-invite` is implemented and passes typecheck/lint/build
    plus a dev-server `curl` smoke test, but has **not** been exercised
    end-to-end against a live backend — no real invite token was
    available this session. Before treating it as production-ready:
    request a real invite via Team Management's "Invite Member" form,
    follow the emailed link, and confirm the `401 INVALID_INVITE_TOKEN`
    state (try it twice — the token is single-use) and the success →
    login round trip both behave as `API.md` documents.
11. No screen currently links to `/accept-invite` from within the
    app (by design — it's only ever reached via the emailed link, same
    as `/reset-password`), so there's nothing to click through from
    `/role-select` or `/login` to find it manually during testing;
    navigate directly to the URL with a token from the invite email.

## Missing API requirements (Admin module)

See `docs/API_INTEGRATION_STATUS.md` for the live table. Short version:
`Dashboard`, `Order List/Detail`, `Dispute Center`, and `Analytics`
have zero backend support in `API.md`. `Node Network` (list/detail/
create/manage) and `Team Management`'s invite are now fully on real
routes. `Super Admin`'s elevation is the last "wired but unconfirmed"
one left — `API.md` has no `super_admin` concept at all, so it may
have no real equivalent.

## Potential risks

- **The `AuthGuard` role gap is now closed for `/admin/*`** — a
  non-admin session (or none) is redirected to `/login`, and
  `authService.loginAdmin` rejects+revokes a login attempt from a
  non-admin account. This has not been verified in a real browser
  against a live backend session yet (see #9 above) — treat it as
  implemented, not as verified.
- Super Admin's elevation form still points at an endpoint unconfirmed
  against `API.md` (`elevateSuperAdmin`) — clicking it will hit the
  live backend if a session cookie is present, and will most likely
  4xx rather than succeed. That's expected (fail-loud, not silent).
  Node Network's forms and Team Management's invite no longer have
  this problem.
- Carried over, still true: fragile session trust model (no
  `/auth/me`, no auto-refresh-on-401), reachable `NOT_IMPLEMENTED`
  throws in several Vendor/Rider screens, no real payment collection.
- **`/accept-invite` is implemented but not verified against a live
  backend response** (see "Remaining work" #10) — the
  `401 INVALID_INVITE_TOKEN` branch and the success path are both
  built strictly from `API.md`'s documented contract, not confirmed
  against a real server response yet.
- Node Network's "Manage" panel (`PATCH /nodes/:id`) is likewise built
  strictly from `API.md`'s documented contract and hasn't been
  exercised against a live backend — same caveat as every other Node
  Network action.
- `/rider/verification` is built strictly from `API.md`'s documented
  contract (including the direct-to-Cloudinary upload step) and hasn't
  been exercised against a live backend or a real Cloudinary account —
  same caveat as `/vendor/node-setup`.
- **The Rider verification gate (2026-08-07, gating pass) hasn't been
  exercised in a real browser against a live backend either** — the
  reminder sheet's show/dismiss/reappear behavior and the Jobs screen's
  block/unblock transition are both built strictly from `GET
  /riders/me`'s documented `data.status` values (`404` / `"pending"` /
  `"active"`), same "not live-verified" caveat as everything else in
  this section. If the live backend ever returns a `status` value
  outside those three, `JobOfferScreen`'s gate treats anything
  non-`"active"` as blocked (fail-closed) — confirm that's the desired
  behavior once a real backend session is available.
- **Rider/NodeOperator auth (register + login) is built strictly from
  `docs/API.md`'s documented contract and hasn't been exercised
  end-to-end against a live backend** — no real Rider/NodeOperator
  account was registered and logged in this session. The
  register → login → role-redirect → onboarding-screen round trip is
  a reasonable inference from the doc but unverified live.
- **`AuthGuard`'s new `allowedRoles={["rider"]}` / `["node_operator"]`
  gates on `(rider)/layout.tsx` / `(vendor)/layout.tsx`** are only as
  correct as the backend's actual `role` string — if the live backend
  ever returns something other than exactly `"rider"` / `"node_operator"`
  (case, spelling), every Rider/NodeOperator gets redirected to
  `/login` immediately after a successful login. Worth confirming
  against a real registration response before treating this as
  verified.

## Important files

| File | Why it matters |
|---|---|
| `docs/API.md` | Source of truth for the real backend contract — read this before trusting `core/api/endpoints.ts` for anything Admin-related |
| `src/core/api/services/admin.service.ts` | Read this first for any Admin data question — its header comment lists real vs. `NOT_IMPLEMENTED`; only `elevateSuperAdmin` is still unconfirmed |
| `src/core/api/services/auth.service.ts` | `loginAdmin` — the one Admin auth method that exists, added this session |
| `src/components/layout/AuthGuard.tsx` | Now supports `allowedRoles`; `(admin)/layout.tsx` is the only current caller that passes it |
| `src/modules/admin/components/auth/AdminLoginScreen.tsx`, `src/app/admin-login/page.tsx` | New this session — the only way into `/admin/*` |
| `docs/API_INTEGRATION_STATUS.md` | Living checklist of every `API.md` endpoint's real integration status — check/update this whenever you touch any endpoint, Admin or otherwise |
| `src/core/types/admin.types.ts` | Node types (`AdminNodeRecord`/`AdminNodeStatus`/`NodeLifecycleStatus`) now match the real backend; everything else here is still provisional |
| `docs/design/admin_UI.png` | Source design — a single low-resolution 8-frame sprite sheet; doesn't include node-operator/rider approval queues (see "Remaining work" #7) |
| `src/modules/user/components/auth/AcceptInviteScreen.tsx`, `src/app/accept-invite/page.tsx` | New this session — the invitee-facing half of `POST /users/invite`; modeled on `ResetPasswordScreen` |
| `src/modules/user/components/auth/ResetPasswordScreen.tsx` | The template `AcceptInviteScreen` was built from — read this first if extending either one, they should stay in sync stylistically |
| `src/core/api/services/vendor.service.ts` | Vendor's data layer — `onboardNode`/`getMyNodeOperatorProfile` (new, real routes) live alongside the existing inventory/scan/release methods; header comment lists the real API gaps |
| `src/modules/vendor/hooks/use-vendor-node-setup.ts`, `src/modules/vendor/components/node-setup/VendorNodeSetupScreen.tsx`, `src/app/(vendor)/vendor/node-setup/page.tsx` | New this session — Vendor's self-service Node onboarding + approval-status screen |
| `src/core/api/services/rider.service.ts` | Rider's data layer — `getVerificationUploadSignature`/`uploadVerificationDocument`/`submitVerification`/`getVerificationProfile` (new, real routes) live alongside the existing job-board/manifest/scan methods; header comment lists the real API gaps (availability, earnings, job history, profile) |
| `src/modules/rider/hooks/use-rider-verification.ts`, `src/modules/rider/components/verification/RiderVerificationScreen.tsx`, `src/app/(rider)/rider/verification/page.tsx` | Rider's self-service KYC verification + approval-status screen, modeled directly on `VendorNodeSetupScreen`/`useVendorNodeSetup` (same three-state shape: form / pending / approved) |
| `src/modules/rider/components/verification/VerificationReminderSheet.tsx` | New 2026-08-07 (gating pass) — dismissible bottom-sheet nudge shown on `RiderHomeScreen` for an unverified Rider, modeled on `ManualCodeEntrySheet`'s overlay pattern |
| `src/modules/rider/components/dashboard/RiderHomeScreen.tsx` | New 2026-08-07: reads `useRiderVerification()` and renders `VerificationReminderSheet` when not yet `active`; this is now the Rider's post-login landing page |
| `src/modules/rider/components/job-offer/JobOfferScreen.tsx` | New 2026-08-07: the one Rider screen that hard-blocks on verification status — reads `useRiderVerification()` before rendering job-board content |
| `src/core/types/user.types.ts` | 2026-08-07: `UserRole` corrected to the real backend enum — read this before trusting any `role` comparison elsewhere in the codebase against the old `"user"`/`"vendor"` values |
| `src/modules/user/hooks/use-auth.ts` | 2026-08-07: the one hook driving Consumer + Rider + NodeOperator register/login; `loginMutation`'s role-redirect map is the thing to edit if a new role or a new post-login destination is ever needed |
| `src/modules/user/components/auth/CreateAccountScreen.tsx` | 2026-08-07: now shared by all three self-registerable roles via `?role=`; `ROLE_COPY` is the place to add per-role heading/subheading copy |
| `src/modules/user/components/auth/RoleSelectScreen.tsx`, `src/modules/user/constants/roles.ts` | 2026-08-07: `ROLE_OPTIONS`' `role` values now match the real backend enum and route into `/create-account?role=` |

## Context another AI engineer needs before continuing

- Everything from previous sessions' equivalent sections still applies
  (mock/real API switch is dead, no bearer-token attachment, Serwist
  not hand-rolled PWA, stale API base URL in `.env.example` — see
  `PROJECT_CONTEXT.md`'s discrepancy list).
- **Before wiring any more Admin endpoints, check the route against
  `docs/API.md` directly** — don't assume an entry already present in
  `core/api/endpoints.ts` is real just because it compiles and has a
  plausible-looking name. The original audit found three that weren't;
  only `corporateOps.elevateSuperAdmin` is still unconfirmed.
- **`session.user.role` is now trustworthy — it wasn't before
  2026-08-07.** `UserRole` previously declared `"user"`/`"vendor"` as
  two of its four values, but the real backend has only ever returned
  `"consumer"`/`"node_operator"` for those two roles (confirmed
  against `docs/API.md`'s `POST /auth/register` body) — so any code
  comparing `user.role === "vendor"` (or `"user"`) was comparing
  against a value the backend would never actually send. This was a
  silent bug, not a crash, since almost nothing compared against those
  two literals before this session (only `AuthGuard.allowedRoles`,
  newly used by `(rider)`/`(vendor)` layouts, and `RoleSelectScreen`'s
  local UI state). If you see `"user"` or `"vendor"` used as a
  `UserRole` value anywhere going forward, that's a regression — the
  real values are `"consumer"` and `"node_operator"`.
- **Policy: no screenless integrations.** Every service method wired
  to a real endpoint must have an actual UI trigger calling it in the
  same pass — not a method that compiles correctly but nothing in the
  app calls. If the screen doesn't have a form/button for it yet,
  build one (inline card, same pattern as `OnboardNodeForm`/
  `InviteMemberForm` — no modal primitive exists in `components/ui`),
  don't leave it wired-but-uncalled "for later."
- If you're wiring a new Admin endpoint: change only `admin.service.ts`
  (or `auth.service.ts` for anything auth-shaped) — replace the
  specific method's `throw new ApiError(...)` with a real `httpClient`
  call, add any missing route string to `endpoints.ts`, and update
  `admin.types.ts` + add a mapping function if the response shape
  differs. Nothing in `modules/admin/hooks/*` or the screens themselves
  should need to change — unless the existing type had fields the real
  backend can't fill in honestly (see the Node Network entry in
  `IMPLEMENTATION_LOG.md` for why that one *did* touch the screens).
- **Update `docs/API_INTEGRATION_STATUS.md` every time an endpoint's
  status changes** — it's meant to stay accurate, not be a one-time
  snapshot. Move the row from ❌/⚠️ to ✅ (or add a new row if you
  find something this file missed) as part of the same change, not as
  a separate follow-up.
- **Keep engineering-only language out of anything the Admin user can
  see.** This file, `API_INTEGRATION_STATUS.md`, and code comments are
  the right place to say "no backend route yet" and name the missing
  endpoint — an `EmptyState`'s `description`, or any other on-screen
  copy, is not. Write that copy as if explaining the empty/unavailable
  state to the Admin, not to the next engineer. (A full pass to fix
  the empty states that got this wrong happened this session — see
  `IMPLEMENTATION_LOG.md`'s "Admin-facing copy pass" entry — don't
  reintroduce the pattern when adding new `NOT_IMPLEMENTED`-backed
  screens.)
