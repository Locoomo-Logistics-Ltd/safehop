# IMPLEMENTATION_LOG.md

> Append-only. Never overwrite or delete previous entries — add a new
> entry per work session, newest at the bottom.

---

## 2026-08-06

**Feature**: Repository analysis & documentation setup (no application
code changed).

**Files changed**:
- Created `docs/PROJECT_CONTEXT.md`
- Created `docs/ARCHITECTURE.md`
- Created `docs/DECISIONS.md`
- Created `docs/IMPLEMENTATION_LOG.md` (this file)
- Created `docs/HANDOFF.md`

**Summary**: First full-repository analysis pass. Read `package.json`,
`next.config.ts`, `tsconfig.json`, all of `src/core/` (api client,
errors, types, endpoints, env, constants, all five services), all
three Zustand stores, the auth providers/guards, `use-auth.ts` /
`use-session-bootstrap.ts` / `use-vendor-login.ts` /
`use-fare-quote.ts`, representative screens (`ForgotPasswordScreen`),
schemas, nav config, `globals.css` design tokens, and the existing
root-level docs (`README.md`, `API_INTEGRATION.md`,
`FRONTEND_API_INTEGRATION_MAP.md`, `.env.example`). No files under
`src/` were modified — this was documentation-only, per explicit
instruction.

**Important notes for future engineers**:
- The existing root-level docs (`README.md`, `API_INTEGRATION.md`,
  `FRONTEND_API_INTEGRATION_MAP.md`) are detailed and mostly accurate
  — read them, don't just rely on the `docs/` folder. The `docs/`
  files here point out where they've drifted from the current code
  (mock/real API switch is dead, no bearer-token attachment exists,
  PWA is Serwist-based not hand-rolled, API base URL differs from
  `.env.example`) — see `PROJECT_CONTEXT.md`'s "Things future AI
  engineers must know" section for the full list before trusting any
  of those three docs at face value on those specific points.
- `AGENTS.md` (repo root) instructs reading
  `node_modules/next/dist/docs/` before writing code. That path does
  not exist in this project as installed. Don't block on it.
- Nothing in this session changed behavior, dependencies, or app code.
  The next session should start from `HANDOFF.md`.

---

## 2026-08-06 (later same day)

**Feature**: Admin module UI — the full 8-screen `admin_UI.png` design
reference (Dashboard, Order List & Filter, Order Details, Node
Network, Team Management, Dispute Center, Super Admin, Analytics &
Performance). UI structure only; the vast majority of this data has
no backend endpoint yet (see "Missing API requirements" in
`HANDOFF.md`) — this was a deliberate, explicit instruction, not an
oversight.

**Files created**:
- `src/app/(admin)/layout.tsx` + one `page.tsx` per section under
  `src/app/(admin)/admin/{dashboard,orders,orders/[id],nodes,team,
  disputes,settings,analytics}` and `admin/page.tsx` (redirects to
  dashboard, mirrors root `/`)
- `src/modules/admin/components/{dashboard,orders,nodes,team,
  disputes,settings,analytics,shared}/*` — one screen + supporting
  components per section, `shared/StatCard.tsx` and
  `shared/AdminSelect.tsx` reused across screens
- `src/modules/admin/hooks/*` — one `useQuery`/`useMutation` hook per
  screen/action, same shape as every other role's hooks
- `src/core/api/services/admin.service.ts` — new service; see its own
  header comment for the full list of methods that throw
  `NOT_IMPLEMENTED` vs. the three real endpoints wired
- `src/core/types/admin.types.ts` — new domain types for every screen
  (explicitly marked provisional/unconfirmed in its header comment)
- `src/components/layout/{AdminSidebar,AdminTopBar,AdminShell}.tsx` —
  dark/orange-accented shell distinct from the shared `Sidebar`
  (see "Design decisions" below)

**Files changed**:
- `src/core/types/index.ts` — barrel-export `admin.types.ts`
- `src/core/api/services/index.ts` — barrel-export `adminService`
- `src/core/config/constants.ts` — `ROUTES.admin*` + `QUERY_KEYS.admin*`
- `src/components/layout/nav-config.ts` — `ADMIN_NAV_ITEMS` +
  `ADMIN_SETTINGS_NAV_ITEM`
- `src/components/layout/index.ts` — export the three new Admin shell
  components
- `src/components/icons/index.tsx` — added `UsersIcon`, `BarChartIcon`,
  `SettingsIcon`, `RefreshCcwIcon`, `FilterIcon`, `ChevronDownIcon`,
  `DownloadIcon` (none of these existed; everything else reuses the
  existing icon set)
- `src/app/globals.css` — added `--admin-accent`/`-dark`/`-bg` tokens
  (orange) plus their `@theme inline` mapping, scoped to `admin-*` so
  they don't touch the User/Vendor/Rider `--brand-blue` surfaces

**Design decisions**:
1. **Dedicated `AdminSidebar`/`AdminTopBar`/`AdminShell` instead of
   reusing `Sidebar`/`AppShell`.** The design reference uses a dark
   navy sidebar + orange accent, structurally different from every
   other role's light sidebar + blue accent (plus a pinned Settings
   item and no `primaryAction` CTA slot). Threading a theme prop
   through the shared components would have added more complexity
   than a parallel, purpose-built pair. Mobile still falls back to the
   shared `BottomNav` (with its existing blue accent — a known, minor,
   accepted cosmetic mismatch) so mobile nav parity isn't lost.
2. **Reused wherever the shapes actually matched**: `RouteRail` and
   `TrackingTimeline` (Order Details — literally the same
   `TrackingEvent[]` shape the User module's tracking screen uses),
   `ProgressSteps` (Dispute Center's case-status indicator),
   `StatusBadge` (order status pills — `DeliveryStatus` already
   covers what the design needs), `Card`/`Button`/`Input`/`EmptyState`
   everywhere. No new component was built where an existing one fit.
3. **Two new components did need to exist**: `AdminSelect` (no
   `Select` primitive exists anywhere in `components/ui`; kept scoped
   to `modules/admin` rather than promoted speculatively) and
   `StatCard` (reused by Dashboard, Disputes, Super Admin, Analytics —
   the one genuinely new reusable primitive this work introduced).
4. **The Analytics trend chart is a hand-rolled inline SVG**, not a
   charting library — none was installed and adding one for a single
   chart wasn't justified. Built following the `dataviz` skill's
   procedure: form (dual-line, one axis), a 2-series palette
   (`--admin-accent` orange / `--brand-blue`) validated with
   `validate_palette.js` (passes CVD/normal-vision separation; the
   orange line's contrast-vs-surface WARN is offset with a legend +
   direct end-labels per the tool's own guidance), 2px lines, ≥8px
   end-dots with a surface ring, a hover crosshair+tooltip.
5. **Three real, working API integrations were wired** (not just
   stubs) because their routes already existed in
   `core/api/endpoints.ts`: `corporateOps.provisionStaff`,
   `corporateOps.elevateSuperAdmin` (Super Admin screen's elevation
   form), and `adminNodes.onboardPartner` (Node Network's "Add Node"
   inline form). Their request/response shapes are **guessed from the
   route name only** — flagged in both `admin.service.ts` and on-screen
   — same caveat pattern the codebase already uses for
   `mapSessionResponse`/`mapFareResponse`.
6. **Every other data need has no backend route** — dashboard stats,
   network-wide recent orders, network status, admin-scoped order
   list/detail, node status list, team list, dispute list/metrics,
   analytics summary/trend/top-nodes/rider-performance. Each throws
   `ApiError({code:"NOT_IMPLEMENTED"})` from `admin.service.ts` with a
   comment on the specific gap; each screen falls back to loading →
   `EmptyState` with a pointer to `HANDOFF.md`, the same convention
   already used for Rider's earnings/history/profile gaps.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint
src` (clean, whole repo), `npm run build` (succeeds, all 8 new routes
present in the route table). **Not performed**: visual/browser
testing — Claude in Chrome wasn't connected in this session, so the
screens were never rendered and clicked through. Whoever picks this
up next should do that pass before treating any screen as
production-ready, especially the two real-endpoint forms (Node
onboarding, Super Admin elevation) and the `AuthGuard` role gap noted
in `HANDOFF.md`.

**Important notes for future engineers**:
- Read `admin.service.ts`'s header comment first — it's the single
  source of truth for which of the ~20 admin data needs are real vs.
  `NOT_IMPLEMENTED`, and is kept in sync with the "Missing API
  requirements" list in `HANDOFF.md`.
- `docs/design/admin_UI.png` is a single sprite sheet of 8 frames at
  very low native resolution (each frame ~224×400px) — text was
  reconstructed from context/structure, not reliably OCR'd. Treat
  exact copy (button labels, column header wording) as best-effort,
  not pixel-verified against the source.
- `AuthGuard` does not check `role` — see the gap called out in
  `src/app/(admin)/layout.tsx`'s own comment and in `HANDOFF.md`.

---

## 2026-08-06 (later — Admin API integration audit + admin login)

**Feature**: Admin/backend API integration audit, then the first
integration: a real Admin login flow with a route-level role gate.

**Audit performed first** (no code changed until it was complete, per
explicit instruction): re-read `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`,
`API.md`, `HANDOFF.md`, then `admin.service.ts`, `admin.types.ts`,
`endpoints.ts`, `auth.service.ts`, `AuthGuard.tsx`, `(admin)/layout.tsx`,
and `constants.ts` directly. Produced a Feature → Endpoint → Status
table (shared with the project owner before writing any code).

**Critical finding from the audit**: the three routes the previous
session marked "wired for real" — `corporateOps.provisionStaff`,
`corporateOps.elevateSuperAdmin`, `adminNodes.onboardPartner` — do
**not appear anywhere in `docs/API.md`**. Per the explicit rule that
`API.md` is the source of truth, these are unconfirmed/likely stale
route guesses, not real integrations, even though they compile and
would fire a real request. `API.md` documents a different, real Admin
surface instead: `POST /auth/login` (role-agnostic — the same route
already used by `loginConsumer`), `POST /nodes`, `GET /nodes`,
`GET /nodes/:id`, `PATCH /nodes/:id`, `GET/PATCH /node-operators/...`,
`GET/PATCH /riders/...`, and `POST /users/invite`. None of these were
wired anywhere before this session. This does **not** get fixed in
this pass — flagging it here and in `HANDOFF.md` so whoever wires
Node Network / Team Management next corrects the endpoint, not just
the payload shape.

**This session's endpoint (chosen by the project owner from the audit
table)**: Admin login. Reasoning given: admin accounts are always
backend-provisioned (never self-registered, never reachable from
`/role-select`), so the only thing missing was a way for an admin,
given credentials, to actually authenticate — and closing the
route-level role gap flagged in the prior session's `HANDOFF.md`
(item #9) depended on having a real admin session to test against.

**Files changed**:
- `src/core/types/user.types.ts` — added `LoginAdminPayload`
  (`{email, password}`), mirroring the existing per-role payload
  convention.
- `src/core/api/services/auth.service.ts` — added
  `loginAdmin(payload)`. Calls the same `ENDPOINTS.auth.consumerLogin`
  route `loginConsumer` uses, since `POST /auth/login` is genuinely
  role-agnostic per `API.md` — no new backend route needed. After a
  successful call, checks `raw.role === "admin"`; on mismatch, fires
  `POST /auth/logout` to revoke the cookies the backend just issued
  and throws `ApiError({code:"INVALID_CREDENTIALS"})` instead of
  persisting a non-admin session. This check is frontend-only (not
  in `API.md`) but necessary: the admin login screen is a separate,
  unguarded URL, so without it a non-admin account could authenticate
  there and get real session cookies before the role gate ever runs.
- `src/components/layout/AuthGuard.tsx` — added an optional
  `allowedRoles?: UserRole[]` prop. When set, a session whose role
  isn't in the list is treated the same as no session (redirect to
  `/login`). Omitting the prop preserves the exact previous behavior,
  so `(user)`, `(vendor)`, `(rider)` layouts are unaffected.
- `src/app/(admin)/layout.tsx` — passes `allowedRoles={["admin"]}`;
  removed the now-resolved "IMPORTANT GAP" comment about the missing
  role check.
- `src/core/config/constants.ts` — added `ROUTES.adminLogin =
  "/admin-login"`.
- `src/components/layout/AdminSidebar.tsx` — logout now redirects to
  `ROUTES.adminLogin` instead of `ROUTES.roleSelect` (admin was never
  reachable from role-select, so sending a logged-out admin back
  there was a dead end).
- `src/modules/admin/hooks/use-admin-auth.ts` — new, login-only
  (`useMutation` wrapping `authService.loginAdmin`), same
  success/error/toast/redirect shape as `modules/user/hooks/use-auth.ts`'s
  `loginMutation`.
- `src/modules/admin/components/auth/AdminLoginScreen.tsx` + `index.ts`
  — new, a simplified copy of the Consumer `LoginScreen` (email +
  password, show/hide toggle, `ErrorAlert` via `getFriendlyError`) with
  no "sign up" link, since admin has no self-registration.
- `src/app/admin-login/page.tsx` — new route, outside every route
  group (same pattern as `/rider-login`, `/login`) — reachable only by
  direct URL, per the project owner's explicit instruction not to
  surface Admin on `/role-select`.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint`
on all changed/new files (clean), `npm run build` (clean after
clearing a stale `.next` cache — succeeds, `/admin-login` present in
the route table, all existing `/admin/*` routes still build). **Not
performed**: browser/visual testing — this pass was API-layer only,
and Claude in Chrome wasn't used this session. Log in as a real admin
account in an actual browser before treating this flow as
production-ready.

**Remaining Admin API work** (unchanged targets from the audit table,
next candidates in priority order): correct `onboardPartnerNode` to
call the real `POST /nodes` instead of the unconfirmed
`/admin/nodes/onboard-partner`; correct `provisionStaff`/wire the
decorative "Invite Member" button to the real `POST /users/invite`;
wire `GET /nodes` + `GET /nodes/:id` for the Node Network screen.
Dashboard, Order List/Detail, Dispute Center, Super Admin elevation,
and Analytics still have no backend route at all per `API.md` — leave
those as `NOT_IMPLEMENTED`.

**New this session**: created `docs/API_INTEGRATION_STATUS.md`, a
living checklist of every endpoint `API.md` documents and its real
integration status — the project owner asked for this to be kept
up to date going forward, not just written once.

---

## 2026-08-06 (later still — Node Network: wire GET /nodes + GET /nodes/:id)

**Feature**: Second Admin endpoint from the audit (project owner's
choice): wire the Node Network screen to real data via `GET /nodes`
and `GET /nodes/:id`, both confirmed, real routes per `API.md`.

**The type mismatch this required fixing**: the previous session's
`AdminNodeStatus` type was built around fields the real backend
doesn't provide — `state: "online"|"offline"|"degraded"` (no
connectivity telemetry exists), `capacityPct` (no live occupancy, only
a self-reported max `capacity` integer), and `ordersToday` (no
per-node order count endpoint). Wiring the real endpoint honestly
meant fixing the type to match what `GET /nodes` actually returns, not
just swapping the data source underneath the old shape — the old
shape had no honest way to be filled in from the real response.
Per the standing instruction not to invent backend behavior, fabricated
placeholder values (e.g. `ordersToday: 0` for every node) were
rejected in favor of showing only fields the API actually returns.

**Files changed**:
- `src/core/api/types.ts` — added `PaginatedList<T>` (`{items, page,
  limit, total}`), matching `API.md`'s "Pagination" section; every
  future Admin list endpoint (node-operators/pending, riders/pending)
  will reuse this same shape.
- `src/core/api/endpoints.ts` — added `adminNodes.list` (`/nodes`) and
  `adminNodes.detail(id)` (`/nodes/:id`).
- `src/core/types/admin.types.ts` — replaced `NodeNetworkState`
  (`online`/`offline`/`degraded`, unused now, removed) with
  `NodeLifecycleStatus` (`pending`/`active`/`inactive`/`suspended` —
  the Node's real lifecycle field per `API.md`). Added
  `AdminNodeRecord` (the raw wire shape: id/name/address/city/state/
  country/latitude/longitude/capacity/status/onboardingType/
  operatingHours/createdAt). Redefined `AdminNodeStatus` (the
  UI-ready shape) to drop `capacityPct`/`ordersToday`/`state` in favor
  of `capacity` (raw number), `status` (`NodeLifecycleStatus`),
  `operatingHoursLabel`, and `area` (pre-formatted `"{city}, {state}"`).
- `src/core/api/services/admin.service.ts` — added a private
  `mapNodeRecord()` mapper; implemented `getNodeStatuses()` (calls
  `GET /nodes?limit=100`, maps `.items`) and a new `getNodeDetail(id)`
  (calls `GET /nodes/:id`) — the latter has no UI call site yet, same
  documented gap as `provisionStaff`. Rewrote the file's header
  comment to separate "confirmed real" from "wired to an unconfirmed
  route" from "no backend route at all," rather than lumping all three
  "wired" methods together as before.
- `src/modules/admin/components/nodes/NodeStatusCard.tsx`,
  `NodeNetworkMap.tsx`, `NodeNetworkScreen.tsx` — swapped every
  reference to the removed `state`/`capacityPct`/`ordersToday` fields
  for `status`/`capacity`/`operatingHoursLabel`. The "Active Nodes"
  cards and list table now show real capacity counts and operating
  hours instead of a fabricated percentage and order count; the status
  pill/map marker colors now reflect the Node's real
  pending/active/inactive/suspended lifecycle instead of a fictional
  online/offline state. No layout/structure changes — same cards, same
  table, same map, just honest field content.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint`
on every changed file (clean), `npm run build` (clean after clearing
`.next`). **Not performed**: browser testing against a live backend —
in particular, whether the real `GET /nodes` response shape actually
matches `AdminNodeRecord` as documented in `API.md` has not been
confirmed against a live response.

**Also created**: `docs/API_INTEGRATION_STATUS.md` (see this file's
previous entry) — reflects both this session's Node Network work and
the pre-existing state of every other `API.md` endpoint.

**Remaining Admin API work**: correct `onboardPartnerNode` to
`POST /nodes`; correct `provisionStaff` to `POST /users/invite` and
wire Team Management's "Invite Member" button to it. Everything else
per the previous entry is unchanged.

---

## 2026-08-06 (later still — Node onboarding fix + close the screenless-integration gap)

**Feature**: Third Admin endpoint pass. Two things, both requested by
the project owner: (1) correct `onboardPartnerNode` to the real
`POST /nodes` (the next item on the audit list), and (2) go back and
give `getNodeDetail` — wired last session but with no screen calling
it — an actual UI trigger, per the explicit instruction that no
integration should be screenless going forward.

**Why the "Add Node" form needed more than an endpoint swap**: the
old form only collected `name`/`address`/`contactPhone`. `POST /nodes`
requires `name`, `address`, `city`, `state`, `latitude`, `longitude`,
`capacity` — none of which is `contactPhone`, and four of which
(`city`/`state`/`latitude`/`longitude`) weren't collected at all.
Swapping just the URL would have made every submission 400. Expanding
the form's fields to match the real required body was necessary for
the integration to actually function, not a redesign — same category
of fix as the field-honesty correction to `AdminNodeStatus` two
sessions ago.

**Files changed**:
- `src/core/api/endpoints.ts` — replaced `adminNodes.onboardPartner`
  with `adminNodes.create` (`"/nodes"`, same path as `list`, POST vs.
  GET).
- `src/core/types/admin.types.ts` — added `OnboardNodePayload`
  (name/address/city/state/latitude/longitude/capacity, operatingHours
  optional — `country`/`onboardingType` left to the server's
  defaults). Extended `AdminNodeStatus` with `address`, `country`,
  `onboardingType`, `createdAtLabel` — these were already present in
  `AdminNodeRecord` (the raw wire shape) but previously trimmed out;
  carrying them through is what makes the detail expansion (below)
  show anything beyond what the summary card already has.
- `src/core/api/services/admin.service.ts` — `onboardPartnerNode` now
  posts to `adminNodes.create` and returns the mapped `AdminNodeStatus`
  (was `Promise<void>` against the wrong route). `mapNodeRecord` now
  fills the four new fields, using `formatDate()` (`src/lib/format.ts`
  — already existed, not new) for `createdAtLabel`. Updated the file's
  header comment: `onboardPartnerNode` moved from "wired to an
  unconfirmed route" to "confirmed real."
- `src/modules/admin/components/nodes/OnboardNodeForm.tsx` — rebuilt
  the field list to match the real payload (8 inputs: name, address,
  city, state, capacity, operating hours, latitude, longitude).
  Same inline-card pattern as before, no modal introduced.
- `src/modules/admin/hooks/use-onboard-node.ts` — typed against
  `OnboardNodePayload` instead of an untyped inline object; success
  copy changed from "submitted for onboarding" to "created" since the
  real route makes the Node `active` immediately, no review step.
- `src/modules/admin/hooks/use-admin-node-detail.ts` — new. Thin
  `useQuery` wrapper around `adminService.getNodeDetail`, gated by an
  `enabled` flag so it only fires once a card's details are expanded.
- `src/core/config/constants.ts` — added `QUERY_KEYS.adminNodeDetail(id)`.
- `src/modules/admin/components/nodes/NodeStatusCard.tsx` — the
  previously-decorative "View Details" button now toggles an inline
  expansion (address/country/onboarding type/created date) backed by
  the new hook. No new route, no modal — an accordion within the
  existing card, matching the "no dialog primitive, don't introduce
  one for a single use" precedent already set by `OnboardNodeForm`.
  "Manage" is intentionally still decorative — its natural target is
  `PATCH /nodes/:id`, which has no UI at all yet (see below), so
  wiring "Manage" now would itself be a screenless/half-built
  integration.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint`
on every changed file (clean), `npm run build` (clean, `/admin/nodes`
bundle grew ~0.4kB reflecting the new expansion code, no other route
affected). **Not performed**: browser testing against a live backend
— whether `POST /nodes`'s real response shape matches `AdminNodeRecord`
has not been confirmed live, and neither has the detail expansion's
actual rendering.

**Policy going forward** (stated explicitly by the project owner this
session): every endpoint this project wires must have a real screen
driving it — no service method should sit wired-but-uncalled the way
`getNodeDetail` briefly did last session. Recorded in `HANDOFF.md`.

**Remaining Admin API work**: correct `provisionStaff` to
`POST /users/invite` and wire Team Management's "Invite Member" button
to it (needs an actual form built, not just an endpoint swap — no
form exists behind that button today). `PATCH /nodes/:id` has no UI
at all yet — Node Network's "Manage" button is its natural target,
but needs a real form/panel (approve/suspend/edit) before it can be
wired, per the no-screenless-integration policy. Dashboard, Order
List/Detail, Dispute Center, Super Admin elevation, and Analytics
still have no backend route at all per `API.md`.

---

## 2026-08-06 (later still — Team Management: build + wire "Invite Member")

**Feature**: Fourth Admin endpoint (project owner's choice): Team
Management's "Invite Member." Unlike the previous three, this button
had **no form behind it at all** — not even a wrong one — so this was
building new UI, not correcting existing fields.

**A role-taxonomy mismatch this surfaced**: `AdminTeamRole`
(`super_admin`/`ops_manager`/`node_manager`/`support_agent`) — used by
the Team list's role filter — has no relationship to the real
backend's role enum. `POST /users/invite` only accepts
`node_operator`/`rider`/`admin` (`consumer` is rejected — self-
registration only). These are genuinely different concepts: one is a
fictional internal staff taxonomy with no list endpoint to check it
against, the other is the actual account type an invited user gets.
Reusing `AdminTeamRole` for the invite form's role picker would have
been wrong — it doesn't correspond to anything `POST /users/invite`
accepts. Added a separate `InvitableRole` type instead of overloading
the existing one.

**Files changed**:
- `src/core/api/endpoints.ts` — removed `corporateOps.provisionStaff`
  (dead, unconfirmed route, nothing referenced it anymore after this
  change); added a new `users: { invite: "/users/invite" }` group,
  named after `API.md`'s own "Users Module" framing.
- `src/core/types/admin.types.ts` — added `InvitableRole`
  (`"node_operator" | "rider" | "admin"`), `InviteStaffPayload`
  (firstName/lastName/email/phone/role), and `InvitedStaffMember` (the
  `POST /users/invite` response — `UserResponseDto` with
  `status: "invited"`). Removed `ProvisionStaffPayload` (superseded).
  Added a comment on `AdminTeamRole` explicitly pointing at
  `InvitableRole` so the two aren't confused again.
- `src/core/api/services/admin.service.ts` — renamed `provisionStaff`
  → `inviteStaff` (the old name implied instant-active accounts with
  temp passwords, matching the wrong guessed endpoint's semantics; the
  real route is genuinely an invite-by-email flow, so the name needed
  to change with the fix, not just the URL). Now posts to
  `ENDPOINTS.users.invite` and returns the real `InvitedStaffMember`
  (was `Promise<void>` against the wrong route). Updated the file's
  header comment accordingly — only `elevateSuperAdmin` remains in the
  "wired but unconfirmed" category now.
- `src/modules/admin/hooks/use-invite-staff.ts` — new. `useMutation`
  wrapping `adminService.inviteStaff`, success toast reads the
  invitee's name back from the real response, invalidates
  `QUERY_KEYS.adminTeam` (currently a no-op since the list endpoint
  doesn't exist, but consistent with every other mutation in this
  module).
- `src/modules/admin/components/team/InviteMemberForm.tsx` — new.
  First name / last name / email / phone / role (`AdminSelect`,
  scoped to the three real invitable roles). Same inline-card pattern
  as `OnboardNodeForm` — no modal introduced.
- `src/modules/admin/components/team/TeamManagementScreen.tsx` — the
  "Invite Member" button now toggles `InviteMemberForm` inline, same
  `showX`/`onClose` pattern `NodeNetworkScreen` already uses for
  `OnboardNodeForm`.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint`
on every changed file (clean), `npm run build` (clean, `/admin/team`
bundle grew ~0.7kB reflecting the new form). Confirmed no remaining
source references to `provisionStaff`/`ProvisionStaffPayload`
anywhere in `src/`. **Not performed**: browser testing against a live
backend — whether the real `POST /users/invite` response shape
matches `InvitedStaffMember` as documented in `API.md` has not been
confirmed live.

**Remaining Admin API work**: `PATCH /nodes/:id` (Node Network's
"Manage" button, needs a form built first, same situation Team
Management's invite was in before this session); `elevateSuperAdmin`
is the last "wired but unconfirmed" method — `API.md` has no
`super_admin` concept, so it may have no real equivalent, worth
confirming with backend rather than guessing further. Dashboard,
Order List/Detail, Dispute Center, and Analytics still have no
backend route at all per `API.md`.

---

## 2026-08-07

**Feature**: Admin Invite Acceptance flow — the invitee-facing half of
`POST /users/invite` (Team Management's "Invite Member" form, wired in
the previous session). `API.md`'s invite email links to
`{FRONTEND_URL}/accept-invite?token=...`; nothing served that route
before this session, so every invite sent so far led to a dead link.

**Files changed**:
- `src/core/api/endpoints.ts` — added `auth.inviteConfirm:
  "/auth/invite/confirm"`, same group as `passwordResetConfirm`/
  `verifyEmail`.
- `src/core/types/user.types.ts` — added `InviteConfirmPayload`
  (`token`/`password`/`passwordConfirmation`/`consentAccepted`),
  mirrors `PasswordResetConfirmPayload` plus the consent field the
  invite endpoint uniquely requires (the inviting Admin can't accept
  ToS/Privacy on the invitee's behalf per `API.md`).
- `src/core/api/services/auth.service.ts` — added
  `confirmInvite(payload)`, posts to `ENDPOINTS.auth.inviteConfirm`
  with `skipAuth: true` (public route), same shape as
  `confirmPasswordReset`.
- `src/modules/user/hooks/use-auth.ts` — added `confirmInviteMutation`
  and exposed `confirmInvite` / `isConfirmingInvite` /
  `confirmInviteError` / `isInviteConfirmed`, same `useMutation`
  pattern as the password-reset confirm mutation (no `onSuccess`
  redirect wired into the hook itself — the screen owns navigation via
  the success state, matching `ResetPasswordScreen`'s convention).
- `src/core/api/errors.ts` — added an `INVALID_INVITE_TOKEN` case to
  `getFriendlyError`, alongside the existing `INVALID_RESET_TOKEN`
  one. `VALIDATION_FAILED` (renders `error.details` field messages)
  and `RATE_LIMITED` were already generic, no change needed for those.
- `src/core/config/constants.ts` — added `ROUTES.acceptInvite:
  "/accept-invite"`.
- `src/modules/user/components/auth/AcceptInviteScreen.tsx` — new.
  Modeled directly on `ResetPasswordScreen`: reads `token` from
  `useSearchParams`, "Set Password" form (Password, Confirm Password,
  live-updating length/match checks), plus a required Terms & Privacy
  Policy consent checkbox (same inline `<input type="checkbox">`
  pattern `CreateAccountScreen` already uses — no dedicated checkbox
  primitive exists in `components/ui`). Submit button is disabled
  until both the password checks and consent are satisfied. Four
  render states: missing/empty token, `401 INVALID_INVITE_TOKEN`
  (dedicated "this invite link no longer works" screen, checked via
  `isApiError(confirmInviteError)` before falling through to the
  generic `ErrorAlert`), success (redirects to `/login` via a button,
  not an automatic redirect — same UX as `ResetPasswordScreen`), and
  the default form state.
- `src/modules/user/components/auth/index.ts` — exported
  `AcceptInviteScreen`.
- `src/app/accept-invite/page.tsx` — new. Thin route wrapper,
  `Suspense`-wrapped around the screen (required for
  `useSearchParams()` in the App Router, same as `/reset-password`'s
  page).
- `docs/API_INTEGRATION_STATUS.md` — moved `POST /auth/invite/confirm`
  from ❌ to ✅, updated the summary counts (10/23 integrated).

**Design decisions**:
- Followed `ResetPasswordScreen` rather than `CreateAccountScreen` as
  the primary template, since both `/accept-invite` and
  `/reset-password` share the same shape: a lone token-bearing link,
  one password (no first/last name/email/phone to collect — those
  were already set by the inviting Admin), and a terminal
  success-then-redirect-to-login state. Only the consent checkbox was
  borrowed from `CreateAccountScreen`, since it's the one field
  `PasswordResetConfirmPayload` doesn't have but `InviteConfirmPayload`
  does.
- Did not build a dedicated success toast/notification — matched
  `ResetPasswordScreen`'s convention of an in-page success state with
  a manual "Return to Login" button rather than an automatic
  `router.push`, since the user needs to actually re-authenticate with
  the password they just set (no session is created by this endpoint).
- No password composition rules (uppercase/number/special char)
  enforced client-side, per `API.md`'s explicit guidance that the
  backend only checks length (12–128) — same choice already made in
  `ResetPasswordScreen`, deliberately not copying
  `CreateAccountScreen`'s stricter (and backend-unenforced) checklist.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint`
on every changed/new file (clean), `npm run build` (clean; `/accept-invite`
appears in the route table). Started the dev server and `curl`'d both
`/accept-invite?token=...` (renders the Set Password form: Password,
Confirm Password, Terms of Service, Privacy Policy, Activate Account)
and `/accept-invite` with no token (renders the "Link is missing or
invalid" state). **Not performed**: an actual browser click-through of
a real invite token against a live backend (no Claude in Chrome
session available this pass) — the `401 INVALID_INVITE_TOKEN` and
success states are implemented per `API.md`'s documented contract but
haven't been exercised against a real response.

---

## 2026-08-07 (later — PATCH /nodes/:id: wire Node Network's "Manage" button)

**Feature**: Next item off the standing "Remaining work" list — Node
Network's "Manage" button, decorative since it was first added several
sessions ago, now calls the real `PATCH /nodes/:id`.

**Scope decision**: `PATCH /nodes/:id` accepts ten optional fields
(name/address/city/state/country/latitude/longitude/capacity/
operatingHours/status) per `API.md`. Building a full edit-everything
form wasn't the concrete ask and the design reference doesn't show
one — `API.md`'s own framing of this route is primarily as the
status-transition mechanism ("this is also how an Admin approves a
pending Node... or retires one... there is no delete endpoint, a Node
is never removed, only status-transitioned"). Scoped the UI to that:
a status dropdown + Save, disabled when unchanged. The payload type
(`UpdateNodePayload`) still models every field the real route accepts
— not a narrowed guess — so extending the panel into a full edit form
later is a type change, not a redesign.

**Files changed**:
- `src/core/types/admin.types.ts` — added `UpdateNodePayload` (all
  ten fields optional, matching `PATCH /nodes/:id` exactly).
- `src/core/api/services/admin.service.ts` — added `updateNode(nodeId,
  payload)`, PATCHes `ENDPOINTS.adminNodes.detail(nodeId)` (already
  existed, shared with `getNodeDetail`'s GET) and returns the mapped
  `AdminNodeStatus` via the existing `mapNodeRecord`. Updated the
  file's header comment to list `updateNode` under "confirmed real."
- `src/modules/admin/hooks/use-manage-node.ts` — new. `useMutation`
  wrapping `adminService.updateNode`, invalidates both the node list
  query and that specific node's detail query on success (so an
  expanded "View Details" panel doesn't show a stale status after a
  "Manage" save).
- `src/modules/admin/components/nodes/NodeStatusCard.tsx` — "Manage"
  now toggles an inline panel (reusing `AdminSelect`, same component
  Team Management's invite form uses for its role picker): a status
  dropdown defaulting to the node's current status, and a "Save"
  button disabled until a different status is picked. Same
  accordion-within-the-existing-card pattern as "View Details" —
  no modal, no new route.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint`
on every changed file (clean), `npm run build` (clean, `/admin/nodes`
bundle grew ~0.5kB). Updated `docs/API_INTEGRATION_STATUS.md` (11/23
now integrated) and `docs/HANDOFF.md`. **Not performed**: browser
testing against a live backend — whether the real `PATCH /nodes/:id`
response shape matches `AdminNodeRecord` as documented has not been
confirmed live, same standing caveat as every other Node Network
action.

**Remaining Admin API work**: `elevateSuperAdmin` is the last "wired
but unconfirmed" method — `API.md` has no `super_admin` concept, so
it may have no real equivalent; worth a backend conversation rather
than more guessing. `GET/PATCH /node-operators/...` and
`GET/PATCH /riders/...` (approval queues) are real, confirmed routes
with no screen in the current 8-frame design. Dashboard, Order
List/Detail, Dispute Center, and Analytics still have no backend
route at all per `API.md`.

---

## 2026-08-07 (later — Admin-facing copy pass)

**Feature**: Copy-only fix. Several `NOT_IMPLEMENTED`-backed empty
states were rendering internal engineering notes directly in the
Admin UI — endpoint names, phrases like "no backend endpoint yet,"
and literal pointers to `docs/HANDOFF.md`. That file is written for
engineers picking up the codebase, not for the Admin using the
product; a logged-in Admin has no reason to see a doc path or a route
name. No behavior changed — every affected empty state still triggers
on the same empty/missing-data condition as before, only the copy
shown to the Admin changed.

**Files changed** (all `description` props on an `EmptyState`, plus
two inline placeholder strings, reworded to plain product copy with
no endpoint/file/route references):
- `src/modules/admin/components/nodes/NodeNetworkScreen.tsx` (both
  the map-view sidebar and list-view empty states)
- `src/modules/admin/components/dashboard/RecentOrdersTable.tsx`
- `src/modules/admin/components/dashboard/NetworkStatusCard.tsx`
  (map placeholder copy + trimmed its dev-only header comment)
- `src/modules/admin/components/disputes/DisputeListTable.tsx`
- `src/modules/admin/components/team/TeamManagementScreen.tsx`
- `src/modules/admin/components/analytics/AnalyticsScreen.tsx`
- `src/modules/admin/components/analytics/RiderPerformanceCard.tsx`
- `src/modules/admin/components/analytics/TopNodesCard.tsx`
- `src/modules/admin/components/orders/OrderListTable.tsx`
- `src/modules/admin/components/orders/OrderDetailsScreen.tsx`
  (not-found empty state + the route-map placeholder line)

**Verification performed**: `npx tsc --noEmit` clean. No logic,
props, or data-fetching changed, so no lint/build re-run was needed
beyond the typecheck.

**Note for future sessions**: `docs/HANDOFF.md`,
`docs/API_INTEGRATION_STATUS.md`, and code comments are the correct
place for "no backend route yet" / endpoint-gap notes — keep writing
those there. Just don't let that language leak into anything an Admin
actually sees (`EmptyState` `description`s, placeholder copy, toasts,
etc.). When adding a new `NOT_IMPLEMENTED`-backed screen, write its
empty-state copy as if explaining it to the Admin, not to the next
engineer.

---

## 2026-08-07 (later still — Vendor Node Setup)

**Feature**: Integrated the two Vendor-facing `Node Operators` routes
from `docs/API.md` that `docs/API_INTEGRATION_STATUS.md` listed as ❌
not integrated: `POST /node-operators/onboarding` and
`GET /node-operators/me`. Scope was deliberately limited to
Vendor/Node — no Rider, Admin, or Authentication code was touched.
`GET /node-operators/pending` and `PATCH /node-operators/:id/approve`
are Admin-only and were left alone, same as the equivalent Rider
approval-queue routes.

**Files changed**:
- `src/core/api/endpoints.ts` — added `nodeOperators: { onboarding,
  me }`.
- `src/core/types/vendor.types.ts` — added
  `NodeOperatorOnboardingPayload`, `NodeOperatorNodeStatus`,
  `NodeOperatorNode`, `NodeOperatorProfile` (the `{profileId, node}`
  shape shared by both routes' responses per `docs/API.md`).
- `src/core/api/services/vendor.service.ts` — added `onboardNode`
  (POST) and `getMyNodeOperatorProfile` (GET); updated the file's
  header comment to note the addition.
- `src/core/config/constants.ts` — added `ROUTES.vendorNodeSetup`
  (`/vendor/node-setup`) and `QUERY_KEYS.vendorNodeOperatorProfile`.
- `src/modules/vendor/hooks/use-vendor-node-setup.ts` — new. Wraps
  the profile query (`retry: false`, since a `404 NOT_FOUND` is an
  expected "not onboarded yet" state, surfaced as `notOnboarded`
  rather than folded into `profileError`) and the onboarding
  mutation (writes the response straight into the query cache on
  success so the screen re-renders into the pending/approved state
  without a refetch).
- `src/modules/vendor/components/node-setup/VendorNodeSetupScreen.tsx`
  + `index.ts` — new. Three real states driven by `GET
  /node-operators/me`: onboarding form (fields identical to Admin's
  `OnboardNodeForm` minus `onboardingType`, which the backend forces
  to `portal`), waiting-for-approval (`node.status: "pending"`), and
  approved (`node.status: "active"`, links to `/vendor/home`). Plus
  loading and error states (`getFriendlyError` + the existing
  `ErrorAlert`).
- `src/app/(vendor)/vendor/node-setup/page.tsx` — new route, inside
  the `(vendor)` group so it's covered by the existing `AuthGuard`.
- `src/modules/vendor/components/profile/VendorProfileScreen.tsx` —
  added a "Node Setup" row linking to the new screen, so the
  integration has a real entry point (no screenless integrations).

**Deliberately not done**: the existing Vendor login flow
(`useVendorLogin`, `/vendor-setup`) still redirects straight to
`/vendor/home` after login/reset, regardless of Node onboarding/
approval status — gating that redirect on `GET /node-operators/me`
would touch Authentication, which was out of this session's scope by
instruction. `/vendor/node-setup` is reachable (via Vendor Profile)
but not yet enforced as a required step. Flagged in
`docs/HANDOFF.md` for whoever owns the Vendor auth flow next.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint`
on every changed/new file (clean), `npm run build` (clean;
`/vendor/node-setup` appears in the route table at 4.98 kB). Updated
`docs/API_INTEGRATION_STATUS.md` (Node Operators section, 2 rows
❌ → ✅) and `docs/HANDOFF.md`. **Not performed**: browser
verification against a live backend — no live NodeOperator session
was available this session, same standing caveat as every other real-
route integration in this log without one.

---

## 2026-08-07 (later still — Rider Verification / KYC onboarding)

**Feature**: Integrated the three Rider-facing routes from
`docs/API.md` that `docs/API_INTEGRATION_STATUS.md` listed as ❌ not
integrated: `GET /riders/verification/upload-signature`,
`POST /riders/onboarding`, `GET /riders/me`. This is the same "Rider
self-registration + KYC onboarding UI" item that's been sitting on
`HANDOFF.md`'s standing "Remaining work" list since the first session.
Scope was deliberately limited to Rider — no Vendor/Node, Admin, or
Authentication code was touched. `GET /riders/pending` and
`PATCH /riders/:id/approve` are Admin-only and were left alone, same
as the equivalent Node Operator approval-queue routes.

**Mid-session correction**: the route/screen was first built as a
standalone `/rider-onboarding` page outside any route group, with its
own `AuthGuard(allowedRoles=["rider"])` wrapper — modeled on
`/vendor-setup`. That was the wrong precedent: `/vendor-setup` is a
*pre*-login screen (no session exists yet), whereas this flow requires
an already-authenticated Rider session, same as the Vendor module's
`/vendor/node-setup` (built earlier this same day by a concurrent
session working the structurally identical problem: a self-onboarding
form gated by a `GET .../me` approval-status check). Relocated to
match that precedent — `/rider/verification` inside the `(rider)`
route group, relying on the group layout's existing `AuthGuard`
instead of a redundant custom one — and renamed
`RiderOnboardingScreen`/`useRiderOnboarding` to
`RiderVerificationScreen`/`useRiderVerification` to mirror
`VendorNodeSetupScreen`/`useVendorNodeSetup`'s naming. Also switched
`riderService.getVerificationProfile()` to let a `404 NOT_FOUND`
propagate as an `ApiError` (was catching it and returning `null`) so
the hook could detect "not started yet" via `isApiError` +
`error.code`, matching `useVendorNodeSetup`'s `notOnboarded` pattern
exactly rather than inventing a parallel convention.

**Files changed**:
- `src/core/types/rider.types.ts` — added `RiderVerificationDocumentType`
  (`"rating_screenshot"`, the one value `API.md` documents),
  `RiderVerificationStatus` (`"pending" | "active"`),
  `RiderUploadSignature`, `RiderVerificationDocument`,
  `RiderVerificationProfile`, `SubmitRiderVerificationPayload`.
- `src/core/api/endpoints.ts` — added `riders: { uploadSignature,
  onboarding, me }`, distinct from the existing `riderOps` group
  (already-approved Rider's live job-board/manifest data) and from
  `identity.riderOnboarding` (unrelated legacy/unconfirmed Auth-module
  route, untouched).
- `src/core/api/services/rider.service.ts` — added
  `getVerificationUploadSignature`, `uploadVerificationDocument`
  (direct-to-Cloudinary `fetch`, per `API.md`'s explicit "file bytes
  never pass through this API" instruction — not routed through
  `httpClient`, since it's a different origin/content-type entirely),
  `submitVerification`, `getVerificationProfile`.
- `src/core/api/errors.ts` — added an `INVALID_VERIFICATION_DOCUMENT`
  case to `getFriendlyError` (the Rider-onboarding-specific error code
  from `API.md`'s error table), alongside the existing token-based
  cases.
- `src/core/config/constants.ts` — added `ROUTES.riderVerification`
  (`/rider/verification`) and `QUERY_KEYS.riderVerification`.
- `src/modules/rider/hooks/use-rider-verification.ts` — new. Wraps the
  profile query (`retry: false`, `404` surfaced as `notStarted` rather
  than folded into `profileError`) and the submit mutation (signature
  → Cloudinary upload → onboarding submit, writes the response
  straight into the query cache on success).
- `src/modules/rider/components/verification/RiderVerificationScreen.tsx`
  + `index.ts` — new. Three real states driven by `GET /riders/me`:
  verification form (employer + document upload), under-review
  (`status: "pending"`, shows the uploaded document's signed
  `viewUrl`), and verified (`status: "active"`, links to Rider
  Dashboard). Plus loading and error states (`getFriendlyError` + the
  existing `ErrorAlert`). Modeled directly on `VendorNodeSetupScreen`.
- `src/app/(rider)/rider/verification/page.tsx` — new route, inside
  the `(rider)` group so it's covered by the existing `AuthGuard` and
  gets the standard Rider nav chrome.
- `src/modules/rider/components/profile/RiderProfileScreen.tsx` —
  added a "Verification" row (status-aware: checking/verified/under
  review/needs verification) linking to the new screen, so the
  integration has a real entry point (no screenless integrations).

**Deliberately not done**: the existing Rider login flow
(`useRiderLogin`, `/rider-login`) still redirects straight to
`/rider/home` after login, regardless of verification status —
gating that redirect on `GET /riders/me` would touch Authentication,
out of this session's scope by instruction (same call the Vendor
session made for the analogous `/vendor-setup` → `/vendor/home`
redirect). `/rider/verification` is reachable (via Rider Profile) but
not yet enforced as a required step before the job board. Flagged in
`docs/HANDOFF.md` for whoever owns the Rider auth flow next.

**Verification performed**: `npx tsc --noEmit` (clean after clearing a
stale `.next/types` cache left over from the mid-session route move),
`npx eslint` on every changed/new file (clean), `npm run build`
(clean; `/rider/verification` appears in the route table at 5.18 kB,
old `/rider-onboarding` confirmed gone). Dev-server smoke test:
`curl`'d `/rider/verification` and confirmed a `200` with the expected
`AuthGuard` loading-spinner markup (no session in this environment, so
the form/pending/verified states themselves weren't rendered).
**Not performed**: browser verification against a live backend — no
live Rider session was available this session, same standing caveat as
every other real-route integration in this log without one.

---

## 2026-08-07 (Rider + NodeOperator Authentication rewrite)

**Feature**: Replaced the Rider and NodeOperator (Vendor) auth flows —
which called five undocumented routes never confirmed against
`docs/API.md` (`/auth/rider/register`, `/auth/rider/login`,
`/auth/node-staff/provision`, `/auth/node-staff/login`,
`/auth/node-staff/first-login-reset`) — with the real, documented,
role-agnostic `POST /auth/register` / `POST /auth/login` every role
shares. Scope was strictly Rider + NodeOperator auth/onboarding per
instruction; Consumer auth, Admin auth/approval, and the already-real
onboarding endpoints (`/riders/onboarding`, `/node-operators/onboarding`,
built in prior sessions) were left alone except where role-based
redirect logic needed to reach them.

**Root cause of the drift**: `core/types/user.types.ts`'s `UserRole`
was `"user" | "rider" | "vendor" | "admin"` — two of those four values
(`"user"`, `"vendor"`) never matched the real backend's actual enum
(`"consumer" | "node_operator" | "rider" | "admin"`, confirmed against
`docs/API.md`'s `POST /auth/register` request body). That mismatch is
almost certainly *why* Rider/Vendor auth was built against invented
routes in the first place — with no correct `role` value to send, a
previous session had no way to use the real, shared `/auth/register`
for those two roles and built dedicated (fictional) endpoints instead.

**Files changed**:
- `src/core/types/user.types.ts` — `UserRole` corrected to
  `"consumer" | "node_operator" | "rider" | "admin"` (the real
  backend enum). Added optional `role` to `RegisterConsumerPayload`
  (now genuinely shared by all three self-registerable roles, not
  Consumer-only — kept the name to avoid an unnecessary rename ripple
  through `auth.service.ts`/`use-auth.ts`). Removed
  `RegisterRiderPayload`, `LoginRiderPayload`, `RiderOnboardingPayload`,
  `LoginNodeStaffPayload`, `FirstLoginResetPayload` — all modeled
  undocumented routes with no real backend equivalent.
- `src/core/api/endpoints.ts` — removed `auth.riderRegister`,
  `auth.riderLogin`, `auth.nodeStaffProvision`, `auth.nodeStaffLogin`,
  `auth.nodeStaffFirstLoginReset`, and `identity.riderOnboarding`
  (undocumented `/identity/rider/:userId/onboarding` — real Rider
  onboarding is `riders.onboarding`, i.e. `POST /riders/onboarding`,
  already wired in the prior Rider-scoped session). `identity.consumerOnboarding`
  is untouched (Consumer-scoped, out of this session's remit).
- `src/core/api/services/auth.service.ts` — removed `registerRider`,
  `loginRider`, `submitRiderOnboarding`, `loginNodeStaff`,
  `firstLoginReset` (all undocumented). Fixed `registerConsumer`'s
  mutation caller to stop treating registration as a login (see bug
  below) — the method itself was already correctly `POST /auth/register`.
- `src/modules/user/hooks/use-auth.ts` — **bug fix**: `registerMutation`
  previously called `setSession()`/`queryClient.setQueryData()` on a
  successful registration, as if the register response carried a
  session. Per `docs/API.md`: *"Registration does **not** log the user
  in — no session cookies are set."* The old code was fabricating a
  client-side session with no matching server-side cookie — any
  subsequent authenticated call would silently 401 while the UI
  believed it was logged in. Now only shows the success toast and
  routes to `/login`, matching the documented contract. Also: `loginMutation`
  now redirects by `session.user.role` (`consumer` → `/dashboard`,
  `rider` → `/rider/verification`, `node_operator` → `/vendor/node-setup`,
  `admin` → `/dashboard` as a safe fallback — Admin normally logs in via
  the separate `/admin-login` → `loginAdmin`, not this path) instead of
  hardcoding `/dashboard` for every role.
- `src/modules/user/components/auth/CreateAccountScreen.tsx` — now
  reads `?role=` (via `useSearchParams`, already wrapped in `<Suspense>`
  by `app/create-account/page.tsx`) and passes it through to
  `registerConsumer()`. Same fields for all three roles (matches
  `docs/API.md` — registration has no per-role fields; the two roles'
  actual differentiation happens post-login in their onboarding step),
  just role-specific heading/subheading copy. **Also fixed**: removed
  the client-side password strength meter (required uppercase +
  lowercase + number + special character) that directly contradicted
  `docs/API.md`'s explicit instruction — *"No composition rules beyond
  length... don't build a strength meter... it'd reject valid passwords
  this API accepts"* — replaced with the length-only check (≥12 chars)
  `ResetPasswordScreen` already used correctly. This was flagged as
  priority-4 in `docs/API_INTEGRATION_STATUS.md` before this session;
  fixing it here because this screen now also gates Rider/NodeOperator
  registration, so the bug's blast radius grew to include this
  session's scope.
- `src/modules/user/components/auth/RoleSelectScreen.tsx` — Rider and
  NodeOperator options now push to `/create-account?role=rider` /
  `/create-account?role=node_operator` instead of the retired
  `/rider-login` and `/vendor-setup` routes.
- `src/modules/user/constants/roles.ts` — `ROLE_OPTIONS` role values
  corrected to the real enum (`"consumer"`, `"node_operator"`); the
  Vendor option's label changed from "Vendor" to "Node Operator" to
  match the role it now actually submits.
- **Deleted** (undocumented-flow dead code, no longer reachable from
  anywhere): `src/app/rider-login/`, `src/app/vendor-setup/`,
  `src/modules/rider/components/auth/` (`RiderLoginScreen.tsx` +
  barrel), `src/modules/rider/hooks/use-rider-login.ts`,
  `src/modules/vendor/components/setup/` (`VendorSetupScreen.tsx`),
  `src/modules/vendor/hooks/use-vendor-login.ts`.
- `src/modules/rider/hooks/use-rider-auth.ts` — logout now redirects
  to `/role-select` (was `/rider-login`, which no longer exists) —
  matches the pattern `useVendorAuth`/`useAuth` (Consumer) already used.
- `src/core/config/constants.ts` — removed the now-dead `ROUTES.riderLogin`
  and `ROUTES.vendorSetup` entries.
- `src/app/(rider)/layout.tsx`, `src/app/(vendor)/layout.tsx` — added
  `allowedRoles={["rider"]}` / `allowedRoles={["node_operator"]}` to
  `AuthGuard` (previously unrestricted — any authenticated session
  could reach either shell). Same pattern `(admin)/layout.tsx` already
  used. This only became meaningful once `UserRole` was corrected —
  before the fix, a real `node_operator` session's role would never
  have matched the (wrong) `"vendor"` check anyway.
- `src/core/api/errors.ts` — `getFriendlyError` was missing cases for
  three real `docs/API.md` error codes that now surface directly in
  this session's flows: `ACCOUNT_SUSPENDED` (login), `RIDER_ALREADY_ONBOARDED`
  / `NODE_OPERATOR_ALREADY_ONBOARDED` (onboarding resubmission), and
  `INTERNAL_ERROR` (the real 500 code — the switch only had the
  never-actually-returned `INTERNAL_SERVER_ERROR`/`SERVER_ERROR`
  spellings). All three previously fell through to the generic "We hit
  a small delay" default.
- `src/core/api/services/rider.service.ts`, `vendor.service.ts` —
  updated stale comments/error messages that referenced the now-removed
  `authService.loginRider`/`loginNodeStaff`/`firstLoginReset`.

**Not changed** (deliberately out of scope): Consumer registration/login
mechanics beyond the shared bug fixes above; Admin login/approval
flow; the already-correct post-login onboarding endpoints themselves
(`GET/POST /riders/*`, `GET/POST /node-operators/*` — built and
verified correct in prior sessions, only their entry point changed);
`(user)/layout.tsx` was left without `allowedRoles` (adding Consumer
route-gating is Consumer-scoped, not this session's remit).

**Verification performed**: `npx tsc --noEmit` (clean, after clearing
a stale `.next/types` cache referencing the deleted `/rider-login` and
`/vendor-setup` routes), `npx eslint src` (clean), `npm run build`
(clean — `/rider-login` and `/vendor-setup` confirmed gone from the
route table, `/create-account` unchanged in size class). Dev-server
smoke test: confirmed `/rider-login` and `/vendor-setup` now 404,
`/role-select`/`/create-account`/`/create-account?role=rider`/
`/create-account?role=node_operator`/`/login` all 200, and that each
`?role=` variant renders its distinct heading server-side (`curl`'d
and grepped for "Create your Rider account" / "Create your Node
Operator account" / "Create an account").
**Not performed**: end-to-end verification against a live backend (no
real account was registered/logged in) — the registration → login →
role-based redirect → onboarding-screen round trip is built strictly
from `docs/API.md`'s documented contract, same standing caveat as
every other real-route integration in this log without a live
session to test against.

---

## 2026-08-07 (later still — Rider Verification gating pass)

**Feature**: A previous session had already built `/rider/verification`
end-to-end (upload-signature → direct-to-Cloudinary upload →
`POST /riders/onboarding` → `GET /riders/me`, three-state screen —
form/pending/active) and pointed the post-login redirect straight at
it. This session was scoped to close the one real gap left in that
work per the project owner's direction: **nothing actually enforced
"a Rider can't access Rider features until verified"** beyond the
one-time post-login redirect — a Rider could navigate to `/rider/home`
or `/rider/jobs` directly by URL regardless of `GET /riders/me`'s
`data.status`. Read `docs/API.md`, `docs/ARCHITECTURE.md`,
`docs/PROJECT_CONTEXT.md`, `docs/API_INTEGRATION_STATUS.md`, and
`docs/HANDOFF.md` before touching anything, per instructions. Auth
itself (register/login/session/cookies), Node/Vendor, and Admin
approval were explicitly out of scope and untouched.

**Product direction confirmed with the project owner before
implementing**: don't hard-block the whole Rider surface behind
verification — Home, Earnings, and Profile should stay freely
browsable for an unverified Rider so the app "feels usable" on first
login, with a dismissible reminder nudging them to verify. **Jobs is
the one screen that actually requires approval** (accepting a job as
an unverified Rider isn't a real option) and blocks outright with a
message + a link back to verification. This is a deliberate departure
from a blanket route-group gate.

**Files changed**:
- `src/modules/user/hooks/use-auth.ts` — Rider's post-login redirect
  changed from `ROUTES.riderVerification` to `ROUTES.riderHome`
  (Consumer/NodeOperator/Admin redirects unchanged).
- `src/modules/rider/components/dashboard/RiderHomeScreen.tsx` — reads
  `GET /riders/me` via `useRiderVerification()`; shows a dismissible
  `VerificationReminderSheet` when `data.status !== "active"`.
  Dismissal is written to `sessionStorage` (key
  `locoomo_rider_verification_reminder_dismissed`) so "Maybe Later"
  doesn't re-nag on every visit within the same browser tab session,
  but reappears on a fresh one.
- `src/modules/rider/components/job-offer/JobOfferScreen.tsx` — now
  checks `useRiderVerification()` before rendering job-board content;
  anything other than `data.status === "active"` (not started, or
  `pending`) renders an `EmptyState` — "Verification required" — with
  a button linking to `/rider/verification`, instead of the job offer
  UI.
- `src/modules/rider/components/verification/VerificationReminderSheet.tsx`
  (new) — bottom-sheet component for the Home reminder, modeled on the
  existing `ManualCodeEntrySheet` overlay pattern (`fixed inset-0`
  backdrop + `rounded-t-[24px]` sheet). Exported via
  `src/modules/rider/components/verification/index.ts`.
- `src/core/api/errors.ts` — added `getFriendlyError` cases for
  `UNAUTHENTICATED` and `FORBIDDEN` (previously fell through to the
  generic default message) — both explicitly called out as errors the
  verification submission flow must handle.

**Files reviewed, unchanged** (confirmed already correct against
`docs/API.md`, no edit needed): `rider.service.ts`
(`getVerificationUploadSignature` / `uploadVerificationDocument` /
`submitVerification` / `getVerificationProfile`),
`use-rider-verification.ts`, `RiderVerificationScreen.tsx`,
`rider.types.ts`, `endpoints.ts`'s `riders.*` block,
`(rider)/layout.tsx`'s `AuthGuard allowedRoles={["rider"]}`,
`RiderProfileScreen.tsx`'s verification status row.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint
src/modules/rider src/modules/user/hooks/use-auth.ts
src/core/api/errors.ts` (clean, after fixing a `react-hooks/set-state-in-effect`
violation by moving the `sessionStorage` read into `useState`'s lazy
initializer instead of an effect), `npm run build` (clean after
clearing a stale `.next` cache — `/rider/home`, `/rider/jobs`,
`/rider/verification`, `/rider/profile` all present in the route
table). Dev-server `curl` smoke test: `/`, `/rider/home`,
`/rider/jobs`, `/rider/verification`, `/rider/profile`, `/login` all
return `200`.

**Not performed**: interactive browser verification of the actual
gating behavior (reminder sheet dismiss/reappear, Jobs block →
"Complete Verification" → verification screen → submit → pending →
admin-approves → Jobs unblocks) — no live Rider account/session was
available this session, same standing caveat as every other real-route
integration in this log without a live backend session to test
against. The `curl` smoke test above only confirms the routes compile
and render (client-side `AuthGuard` blanks them without a session
cookie) — it does not exercise the verification-status branches
themselves.
