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

---

## 2026-08-12 (docs-only pass — audit the new API.md diff)

**Feature**: No application code changed. `docs/API.md` (maintained by
the backend/project owner) had grown seven new documented endpoints
since the last audit — `POST`/`GET /admin/pricing`, `POST
/payments/intents`, `GET /payments/intents/:id`, `POST
/payments/webhooks/paystack`, `GET /orders`, `GET /orders/:id` — none
of which is an "Update" endpoint despite the session's original brief
describing one (pricing is explicitly append-only; the rest are
Create/Read). Confirmed this via `git diff docs/API.md` before writing
anything, per the project owner's explicit instruction not to guess.

**Files changed**: `docs/API_INTEGRATION_STATUS.md` only — added
"Admin Pricing", "Payments", and "Orders" sections auditing the seven
new endpoints against the live source (all found ❌ or 🟡 at the time:
nothing called `admin/pricing` or `payments/intents` yet; `GET
/orders`/`GET /orders/:id` happened to share a URL path with the
existing, undocumented `orders/book`-driven flow but not its response
shape). Updated summary counts (23→30 endpoints), the recommended
priority list (new priority 0: rebuild Checkout), and the
"Inconsistencies" section to stop listing `orders.list`/`orders.detail`
as fully undocumented.

**Verification performed**: none needed — read-only audit, no code
touched.

---

## 2026-08-12 (later — full integration pass: Approvals, Pricing, Checkout rebuild)

**Feature**: Following on directly from the docs-only pass above, the
project owner asked to integrate every endpoint the audit had just
flagged as not-yet-integrated, one at a time, building UI where none
existed and keeping it visually consistent with the existing design
system. Four endpoint groups, done in this order: NodeOperator
approvals, Rider approvals, Admin Pricing, then the Consumer
Checkout/payment rebuild (by far the largest, since it also required
fixing the already-broken `GET /nodes/nearby` and reworking the
Node-to-address delivery model into the real Node-to-Node one).

### 1. Admin: NodeOperator + Rider approval queues

`GET /node-operators/pending` + `PATCH /node-operators/:id/approve`,
`GET /riders/pending` + `PATCH /riders/:id/approve` — real, confirmed
routes with no screen anywhere in the app before this session
(previously flagged in `docs/HANDOFF.md` as the single biggest
functional gap: a self-registered NodeOperator/Rider who completed
onboarding had no path to ever become `active`).

**Files changed**:
- `src/core/api/endpoints.ts` — added `nodeOperators.pending`/`.approve(id)`
  and `riders.pending`/`.approve(id)`.
- `src/core/types/admin.types.ts` — added `PendingNodeOperator`
  (imports `RiderVerificationDocument` from `rider.types.ts` for the
  Rider row's document shape) and `PendingRider`.
- `src/core/api/services/admin.service.ts` — added
  `getPendingNodeOperators`/`approveNodeOperator`/`getPendingRiders`/
  `approveRider`; updated the file's header comment.
- `src/modules/admin/hooks/use-admin-approvals.ts` — new. Exports
  `useNodeOperatorApprovals()`/`useRiderApprovals()`, each a query +
  approve mutation, tracking which row is mid-approval via
  `mutation.variables` so only that row's button shows a spinner.
- `src/modules/admin/components/approvals/ApprovalsScreen.tsx` + `index.ts`
  — new. One screen, two tabs ("Node Operators"/"Riders"), modeled on
  `NodeNetworkScreen`'s tab pattern and `TeamManagementScreen`'s table
  pattern. No design reference exists for this screen (added to
  `docs/API.md` after the original 8-frame `admin_UI.png`), so it
  reuses existing patterns rather than inventing new visual language.
- `src/app/(admin)/admin/approvals/page.tsx` — new route.
- `src/core/config/constants.ts` — `ROUTES.adminApprovals`,
  `QUERY_KEYS.adminNodeOperatorsPending`/`.adminRidersPending`.
- `src/components/layout/nav-config.ts` — added "Approvals" nav item
  (`ShieldCheckIcon`), placed after "Team".

### 2. Admin: Pricing

`POST`/`GET /admin/pricing` — same "no design reference, no screen"
situation as Approvals.

**Files changed**:
- `src/core/api/endpoints.ts` — added `adminPricing.create`/`.list`.
- `src/core/types/admin.types.ts` — added `CreatePricingRulePayload`,
  `PricingRule`.
- `src/core/api/services/admin.service.ts` — added
  `createPricingRule`/`getPricingRules`.
- `src/modules/admin/hooks/use-admin-pricing.ts` — new.
- `src/modules/admin/components/pricing/AddPricingRuleForm.tsx`,
  `PricingScreen.tsx`, `index.ts` — new. Inline append-only form (same
  pattern as `OnboardNodeForm`) above a rate-history table, top row
  marked "Current".
- `src/app/(admin)/admin/pricing/page.tsx` — new route.
- `src/core/config/constants.ts` — `ROUTES.adminPricing`,
  `QUERY_KEYS.adminPricingRules`.
- `src/components/layout/nav-config.ts` — added "Pricing" nav item
  (`CreditCardIcon`), next to "Approvals".

### 3. Consumer: Checkout rebuilt on `POST /payments/intents`

The largest change. `POST /payments/intents` requires a real
`destinationNodeId` (Node-to-Node), not the free-text
`destinationAddress` the old, undocumented `orders/calculate-fare` +
`orders/book` flow used — so this touched the delivery draft model,
node selection, and every screen downstream of Checkout, not just the
payment call itself.

**Root-cause chain that expanded this task's scope**:
1. Wiring `payments/intents` correctly required a real destination
   Node id — `SelectNodesScreen` only collected a free-text address.
2. Node selection (`SelectNodesScreen`, both origin and now
   destination) depends on `GET /nodes/nearby`, which
   `docs/API_INTEGRATION_STATUS.md` already had flagged 🟡 broken
   (`radiusInMeters` instead of `radiusKm`, flat-array parsing instead
   of the paginated envelope) — left broken, the new destination
   picker would have been un-testable, so this session fixed it too.
3. Fixing `GET /nodes/nearby` meant correcting `LocoomoNode`'s
   fabricated fields (`isOpenNow`, `capacity.occupied`/`.total` — no
   such data exists on the real backend). Rather than editing
   `LocoomoNode` in place (which `vendor.service.ts`'s separate,
   still-unconfirmed `/nodes/operator/inventory` endpoint also
   depends on, unrelated to this session), a new `PickupNode` type was
   introduced instead, scoped to the Consumer's real node data.
4. Once Checkout redirects to Paystack, `docs/API.md` documents the
   redirect landing on `/orders/payment-callback` and polling `GET
   /payments/intents/:id` — a screen that didn't exist and had to be
   built, including recovering the intent id from `sessionStorage`
   (the callback URL's query params aren't documented) and finding the
   resulting Order afterward (no "get order by intent id" route
   exists, so it scans `GET /orders` for a matching `paymentIntentId`).
5. The real `Order` (`GET /orders`(/:id)) has a materially different
   shape from the old, undocumented `Delivery` type — no fee
   breakdown, no `route`/`collectionQrCode`/`trackingHistory`, and a
   `status` field where `docs/API.md` only confirms one value
   (`"awaiting_drop_off"`). Every screen rendering an order
   (`DeliveryCard`, `TrackPackageScreen`, `OrderSuccessScreen`, the two
   dashboard sections) needed rebuilding against the real shape, not
   just a mapping-function patch.

**New types** — `src/core/types/payment.types.ts` (new file):
`OrderParcelSize`, `CreatePaymentIntentPayload`,
`PaymentIntentFeeBreakdown`, `PaymentIntentStatus`, `PaymentIntent`,
`OrderStatus` (typed as `string`, not a union — see point 5 above),
`Order`, plus `toOrderParcelSize()` (maps the UI's legacy `"xl"` to the
real `"extra_large"`, the only member that differs). Barrel-exported
from `core/types/index.ts`.

**Legacy types kept, not deleted** — `src/core/types/delivery.types.ts`:
`Delivery`, `DeliveryQuote`, `CreateDeliveryDraft`,
`CalculateFarePayload`, `BookOrderPayload` are now unused by real app
code, but were **not deleted**: the commented-out mock delivery
service (`delivery.service.ts`) and `MOCK_DELIVERIES` fixture
(`core/mocks/mock-deliveries.ts`) still assume this shape, and
`docs/PROJECT_CONTEXT.md` explicitly says not to remove mock code until
the project is feature-complete. Each got a `@deprecated`/legacy
comment pointing at its real replacement instead. `LocoomoNode` was
left completely untouched for the same reason (still used by
`vendor.service.ts`/`VendorHomeScreen`).

**Files changed** (real-mode code):
- `src/core/api/endpoints.ts` — added `payments.intents`/
  `.intentDetail(id)`; commented `orders.calculateFare`/`.book` as
  legacy/unused; corrected `nodes.nearby`'s usage (see
  `nodes.service.ts` below).
- `src/core/api/services/delivery.service.ts` — replaced
  `calculateFare`/`create`/`pay` with `createPaymentIntent`/
  `getPaymentIntent`; `list`/`getById` now call the real `GET
  /orders`(/:id) and return `Order`, not `Delivery`.
- `src/core/api/services/nodes.service.ts` — rewritten: `listNearby`
  sends `radiusKm` + `limit`, unwraps `PaginatedList<RawNearbyNode>`,
  maps into `PickupNode`. `getById` now calls the real `GET /nodes/:id`
  directly (was a "fetch a huge radius and filter client-side"
  workaround, since this endpoint wasn't known to be usable this way
  before).
- `src/core/api/errors.ts` — added `getFriendlyError` cases for the
  three new payments error codes: `NODE_CAPACITY_UNAVAILABLE`,
  `PRICING_NOT_CONFIGURED`, `PAYMENT_PROVIDER_ERROR`.
- `src/store/delivery-draft.store.ts` — `destinationAddress` →
  `destinationNodeId`.
- `src/modules/user/components/delivery/SelectNodesScreen.tsx` —
  rewritten: origin picker unchanged (map + list), destination is now
  a second searchable Node list below it (same `NodeListItem`
  component), excludes whichever Node is picked as origin.
- `src/modules/user/components/delivery/DestinationAddressInput.tsx` —
  **deleted**, genuinely unused now.
- `src/modules/user/components/delivery/NodeListItem.tsx`,
  `GoogleMapView.tsx` — retyped from `LocoomoNode` to `PickupNode`;
  dropped the fabricated "Filling up"/`isOpenNow` UI, added
  `city`/`state`/`operatingHours` in its place.
- `src/modules/user/components/delivery/DeliveryMethodScreen.tsx` —
  removed the invented "From ₦800"/"From ₦2500" per-option pricing
  (real pricing is distance-only and this field isn't sent to
  `payments/intents` at all per `docs/API.md`); the method choice
  itself stays as a local, UI-only preference.
- `src/modules/user/hooks/use-fare-quote.ts`,
  `use-create-delivery.ts` — **deleted**, replaced by:
- `src/modules/user/hooks/use-checkout.ts` — new. Creates the intent
  once, exposes `redirectToPaystack()` (stashes the intent id in
  `sessionStorage`, then `window.location.href = authorizationUrl`).
- `src/modules/user/hooks/use-payment-intent-status.ts` — new. Polls
  `GET /payments/intents/:id` via `refetchInterval`, capped at ~36
  attempts (~90s) tracked with a `useRef` counter incremented inside
  the `refetchInterval` callback (not render) to satisfy the
  `react-hooks/purity` lint rule against calling `Date.now()`/reading
  refs during render.
- `src/modules/user/components/checkout/CheckoutScreen.tsx` — rewritten
  around `useCheckout()`; fires the intent creation exactly once
  (`useRef` guard) since it has the side effect of reserving Node
  capacity; no more in-app payment-method step.
- `src/modules/user/components/checkout/OrderSummaryCard.tsx` —
  rewritten against `PaymentIntentFeeBreakdown` (kobo amounts, `/100`
  for display) instead of the old naira `DeliveryQuote`.
- `src/modules/user/components/checkout/PaymentMethodSelector.tsx` —
  **deleted**. Paystack's hosted checkout presents payment method
  choice; the real API has no field for it.
- `src/modules/user/components/tracking/PaymentCallbackScreen.tsx`,
  `OrderStatusBadge.tsx` — new. The callback screen covers pending/
  paid/failed/expired/timed-out states; `OrderStatusBadge` +
  `getOrderProgress`/`isTerminalOrderStatus` render any raw status
  string gracefully via keyword heuristics (`complete`/`deliver`/
  `collect` → success-styled, `cancel`/`fail`/`expire` → danger-styled,
  anything else → neutral/in-progress) rather than a fixed lookup
  table, since only one status value is confirmed. Deliberately did
  **not** reuse the shared `StatusBadge`/`DeliveryStatus` — that type
  is still used by Admin's `NOT_IMPLEMENTED` order screens and Vendor's
  `NodeParcel` statuses, unrelated domains this pass didn't touch.
- `src/app/(user)/orders/payment-callback/page.tsx` — new route,
  inside the `(user)` group (same `AuthGuard` as the rest of Checkout).
- `src/modules/user/hooks/use-deliveries.ts`, `use-delivery.ts` —
  rewritten against `Order`; active/past split now uses
  `isTerminalOrderStatus` instead of a fixed `DeliveryStatus` set.
- `src/modules/user/components/dashboard/DeliveryCard.tsx`,
  `PastDeliveriesSection.tsx` — retyped to `Order`,
  `OrderStatusBadge`/`getOrderProgress` instead of `StatusBadge`/
  `getDeliveryProgress`.
- `src/modules/user/components/tracking/TrackPackageScreen.tsx` —
  rewritten; the "Tracking History" `TrackingTimeline` section was
  **removed**, not faked — the real Order has no event-log field, only
  a "Order Details" card (receiver/parcel/addresses/amount/date) in
  its place.
- `src/modules/user/components/tracking/OrderSuccessScreen.tsx` —
  rewritten against `Order`; no fee breakdown (only `PaymentIntent`
  has one), shows total paid instead; QR still shown (via the existing
  decorative `QrCodeBlock` placeholder) but encodes just `trackingCode`
  now, not the old `{trackingCode, qrNonce}` pair the real Order
  doesn't return.
- `src/core/config/constants.ts` — added `ROUTES.paymentCallback`,
  `ROUTES.trackList` (fixed a pre-existing drift: several screens
  already hardcoded `"/track"` directly instead of going through
  `ROUTES`, the project's own stated convention — gave it a proper
  entry rather than repeating the hardcode in the new code this pass
  added), `QUERY_KEYS.paymentIntent(id)`, and a new `STORAGE_KEYS`
  export (`pendingPaymentIntentId`).

**Design decisions**:
- Kept the four-step New Delivery flow's shape (New Delivery → Select
  Nodes → Method → Checkout) rather than removing the now-non-functional
  Method step — it's harmless UI-only state, and removing a whole step
  users are used to wasn't the ask; just stopped it claiming false
  pricing.
- Payment intent creation happens once, automatically, on Checkout
  mount (not on a button press) — matches `docs/API.md`'s own framing
  of the endpoint as doing fee calc *and* reservation together; a
  separate "preview" step doesn't exist server-side to call first.
- Chose `sessionStorage` (not the callback URL's query string) to carry
  the payment intent id across the Paystack redirect, since
  `docs/API.md` doesn't document what Paystack appends to
  `/orders/payment-callback`.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint
src` (clean — including fixing two `react-hooks/purity`/
`react-hooks/set-state-in-effect` violations the new polling/callback
code first tripped, using the same lazy-`useState`-initializer pattern
`RiderHomeScreen` already established for reading `sessionStorage`),
`npm run build` (clean after two unrelated `fonts.gstatic.com`/
`fonts.googleapis.com` network timeouts in this sandbox — succeeded on
retry; `/admin/approvals`, `/admin/pricing`, `/orders/payment-callback`
all present in the route table, every pre-existing route still
builds). Dev-server smoke test: `/checkout`, `/delivery/select-nodes`,
`/delivery/method`, `/orders/payment-callback`, `/track`,
`/admin/approvals`, `/admin/pricing` all return `200`.

**Not performed**: any verification against a live backend or a real
Paystack account — no live session was available this session, same
standing caveat as every other real-route integration in this log
without one. In particular, unverified: whether the real `GET
/nodes/nearby` response actually matches the new `PickupNode`
mapping; whether a real Node capacity reservation + Paystack
redirect + webhook + `GET /orders` round trip actually produces a
matching `paymentIntentId` the callback screen can find; and whether
`Order.status` ever takes a value this session didn't anticipate in
`OrderStatusBadge`'s heuristic (fails safe — unrecognized values render
as neutral/in-progress, not a crash).

**Remaining work**: see `docs/API_INTEGRATION_STATUS.md`'s updated
priority list (items 3, 5, 6, 7, 8) and `docs/HANDOFF.md`.

---

## 2026-08-12 (later still — live debugging session: "no stations available")

**Feature**: A real user, testing the Consumer flow from the previous
session's rebuild against the live backend for the first time, reported
`/delivery/select-nodes` showing no pickup/destination stations at all,
despite having created one `active` and one `pending` Node via Admin.
This session root-caused and fixed three stacked issues, live, in
conversation with the reporting user (no Claude in Chrome available
this session — diagnosed via `curl` through the dev proxy and by
reading the user's own Network-tab output back to them).

**Root-cause chain**:
1. `SelectNodesScreen` couldn't distinguish "the request failed" from
   "zero results" — `useNodes()` already returned `isError`, but the
   screen never read it, so any fetch error rendered the identical
   "No stations match" text as a genuine empty result. This is what
   made the real problem invisible in the first place.
2. Once surfaced, the real error was `401 UNAUTHENTICATED` on
   `GET /nodes/nearby` — confirmed via `curl` through the dev-mode
   proxy (`next.config.ts`'s `rewrites()`, confirmed working correctly
   and reaching the real live backend at
   `locoomo-api.up.railway.app`) that the route and backend were both
   healthy; the missing piece was purely session-side. Access tokens
   expire every 15 minutes per `docs/API.md`, and — as already flagged
   in `docs/API_INTEGRATION_STATUS.md`'s standing priority list —
   nothing retried on `401`. The user's session had simply gone stale
   mid-testing.
3. Even with a valid session, the default 25km search radius risked
   missing genuinely distant Nodes on a sparse, early-stage network.
4. Underlying all of it: both Node-creation forms (Admin's
   `OnboardNodeForm`, NodeOperator's self-onboarding form in
   `VendorNodeSetupScreen`) required typing raw latitude/longitude by
   hand, with no way to derive them from the address — an easy way to
   end up with a Node whose coordinates don't correspond to anywhere
   near its actual address, silently breaking every future
   `nodes/nearby` search for it.

**Also separately reported and confirmed, not fixed**: `GET
/orders?limit=100` returning
`{"success":false,"error":{"code":"NOT_FOUND","message":"Cannot GET /api/v1/orders?limit=100",...}}`.
That exact message format is a raw NestJS/Express "no route matched"
fallback, not the app's own structured `404 NOT_FOUND` handler (which
docs/API.md documents with a different meaning: "route or resource
doesn't exist" for a *resource*, not a whole unregistered route). This
indicates the live backend at `locoomo-api.up.railway.app` doesn't
actually have `GET /orders` deployed yet, despite `docs/API.md`
documenting it — `deliveryService.list()`'s request is correct per the
docs. **Flagged for the backend team, not a frontend fix.**

**Files changed**:
- `src/modules/user/hooks/use-nodes.ts` — now also returns `error`
  (was already returning `isError`, just unused).
- `src/modules/user/components/delivery/SelectNodesScreen.tsx` — added
  an `ErrorAlert` (via `getFriendlyError`) driven by `useNodes()`'s
  `isError`/`error`; both node lists now render nothing (not a
  misleading "no match" message) when the shared query is in an error
  state, since the banner above already explains why.
- `src/core/api/services/nodes.service.ts` — `listNearby`'s default
  `radiusKm` changed from `25` to `100` (the API's documented max).
- `src/core/config/constants.ts` — added `STORAGE_KEYS.session`
  (`"locoomo_session"`), extracted so both `auth.service.ts` (writes
  it) and the new interceptor in `client.ts` (clears it on a failed
  refresh) can reference the same key without `client.ts` importing
  `authService` — that would be a circular import, since
  `authService` itself imports `httpClient` from `client.ts`.
- `src/core/api/services/auth.service.ts` — its local
  `SESSION_STORAGE_KEY` constant replaced with the shared
  `STORAGE_KEYS.session`; no behavior change.
- `src/core/api/client.ts` — **new**: a `401` → refresh → retry
  interceptor. Any `UNAUTHENTICATED` response (excluding `/auth/*`
  routes and calls marked `skipAuth`) triggers one `POST /auth/refresh`
  attempt via a new `refreshSessionOnce()` (centralizes concurrent
  401s onto a single in-flight refresh — refresh tokens are
  single-use and rotate on every call per `docs/API.md`, so two
  independent refresh attempts would make the second one fail with
  `INVALID_REFRESH_TOKEN` even though nothing's wrong), then retries
  the original request exactly once (`isRetry` guard prevents any
  further recursion). A failed refresh clears `useAuthStore` and
  `localStorage` and hard-redirects to `/login`, per `docs/API.md`'s
  "any error from `/auth/refresh` is a hard sign-out" instruction.
  This finally gives the long-inert `skipAuth` option real meaning —
  previously documented in `ARCHITECTURE.md` as "presently a no-op."
  Also hardened response parsing: a `null`/non-JSON payload used to
  throw a raw, uncaught `TypeError` on `apiResponse.success` instead of
  a clean `ApiError` — split into an explicit null-check before the
  discriminated-union check.
- `src/components/maps/AddressGeocodeButton.tsx` — **new**, shared
  component (promoted straight to `components/maps/` since two modules
  needed it immediately, same reasoning as the existing
  `QrScannerView`/`OtpInputBoxes` promotion pattern documented in
  `ARCHITECTURE.md`). Wraps `@vis.gl/react-google-maps`'s
  `useMapsLibrary("geocoding")`; renders a "Find Coordinates from
  Address" button that resolves lat/lng from Address/City/State
  (`componentRestrictions: { country: "ng" }`) and pre-fills the
  (still manually editable) coordinate inputs. Renders a plain hint
  instead of a button when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is unset,
  matching `GoogleMapView`/`NodeNetworkMap`'s existing
  no-key-configured fallback pattern — doesn't fail silently, doesn't
  block manual entry either way.
- `src/modules/admin/components/nodes/OnboardNodeForm.tsx`,
  `src/modules/vendor/components/node-setup/VendorNodeSetupScreen.tsx`
  — both wired to `AddressGeocodeButton`.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint
src` (clean), `npm run build` (clean; `.next` briefly failed to clear
mid-session because the dev server process still held a lock — resolved
by waiting for the process to fully exit before retrying, not a code
issue). Confirmed via `curl` through the dev-mode API proxy that
`GET /api/v1/nodes/nearby` (no cookie) correctly returns `401
UNAUTHENTICATED` from the real live backend, proving the proxy and
backend are both reachable and healthy independent of the session-expiry
bug.

**Not performed**: this was diagnosed and fixed without direct browser
access (no Claude in Chrome connection this session) — the actual fix
has not been confirmed to resolve the reporting user's specific case
end-to-end (fresh login → Select Nodes showing the real Node → Add Node
with geocoding actually producing correct coordinates against a real
Google Maps API key, which this repo's `.env`/`.env.local` don't
currently have set). Whoever picks this up next should confirm all
three fixes together resolve the original report, and separately raise
the missing live `GET /orders` route with the backend team.

---

## 2026-08-13 — live debugging session, continued: two more real bugs found and confirmed fixed

**Feature**: Continuing the same live debugging session, the reporting
user confirmed the previous entry's `(user)/layout.tsx` role-gate fix
resolved the `/orders` 404 (it was, as hypothesized, a non-Consumer
session hitting a Consumer-only route — not a missing backend route
after all; the exact phrasing `"Cannot GET /api/v1/orders?limit=100"`
was the backend's own wrapped 404 for a role/route mismatch, not proof
the route was undeployed). Then hit a second, unrelated bug: Checkout
permanently stuck on "Calculating your delivery fee…" despite
`POST /payments/intents` returning a clean `200 success:true` response
with a complete, correctly-shaped `PaymentIntent` (confirmed via the
user's own Network tab output).

**Root cause**: `CheckoutScreen`'s intent-creation effect used a
separate `useRef` (`hasRequestedIntent`) to guard against firing
`createIntent()` more than once, independent of the mutation's own
state. Under some real-world render/effect timing this codebase
couldn't fully reproduce statically (React 18/19 Strict Mode's
double-invoke of mount effects is the leading suspect, though not
confirmed with certainty), the ref could end up set to `true` while
the *actual* `useMutation()` instance backing the visible render never
received its own `mutate()` call — so the network request that
succeeded belonged to an effectively orphaned mutation observer, and
the rendering component's own `intent`/`isCreating`/`createError` all
stayed at their initial falsy values forever. Confirmed via a
temporary on-page debug line (`isIdle`/`isCreating`/`hasIntent`/
`hasError`) added specifically to pin this down, since no browser
access was available this session — removed again once the fix was
confirmed.

**Fix**: removed the separate `useRef` guard entirely. The "have we
already fired" check now reads the mutation's own `isIdle` (exposed
from `useCheckout()`) instead of parallel, independently-mutable
state — by construction, this can no longer disagree with what the
mutation object itself believes happened, closing off this whole class
of bug rather than patching the specific symptom.

**Files changed**:
- `src/modules/user/hooks/use-checkout.ts` — now also returns `isIdle`
  (`mutation.isIdle`).
- `src/modules/user/components/checkout/CheckoutScreen.tsx` — removed
  `hasRequestedIntent` (`useRef`); the create-intent effect now guards
  on `!isDraftComplete || !isIdle` instead. Also moved the ad-hoc
  "Retry" button (added mid-session as a diagnostic safety net) from
  the loading branch to the error branch, where it's a genuinely
  useful, permanent affordance — Checkout previously had no way to
  retry a failed intent creation short of reloading the whole page.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint
src` (clean), `npm run build` (clean). **Confirmed working by the
reporting user** against the live backend — Checkout now correctly
shows the fee breakdown and an enabled "Confirm & Pay" button after a
real `POST /payments/intents` call. This is the first piece of this
whole integration (spanning the two previous 2026-08-12 entries) to be
verified end-to-end against a live backend and a real user session,
not just typecheck/lint/build/dev-smoke-test.

**Not performed**: the actual Paystack redirect → `/orders/payment-callback`
→ `GET /orders` matching flow downstream of "Confirm & Pay" is still
unverified live — the session ended at a working fee summary, before
following through to an actual payment.

---

## 2026-08-14

**Feature**: Handoffs module integration — the six `/handoffs/*`
endpoints added to `docs/API.md` the same day, covering the parcel
custody chain from consumer drop-off through rider pickup to arrival at
the destination Node.

**Files changed**:

*Shared layer*
- Created `src/core/types/handoff.types.ts` — `AvailableOrder`,
  `HandoffOrderSummary`, `HandoffOrderPreview`, `HandoffCode`,
  `HandoffType`, `AcceptedDelivery`, plus `HANDOFF_STATUS` and the
  code-length/TTL/concurrency constants.
- Created `src/store/rider-jobs.store.ts` — the rider's accepted
  deliveries, localStorage-backed. See "API gaps found" below.
- `src/core/api/endpoints.ts` — new `handoffs` group (six routes).
- `src/core/api/errors.ts` — `getFriendlyError` copy for the four new
  codes: `RIDER_NOT_ACTIVE`, `RIDER_CAPACITY_UNAVAILABLE`,
  `ILLEGAL_ORDER_TRANSITION`, `INVALID_HANDOFF_CODE`.
- `src/core/config/constants.ts` — `ROUTES.riderAvailableJobs`,
  `riderActiveDeliveries`, `riderHandoff(orderId)`,
  `vendorDropOff(trackingCode)`, `vendorRiderHandoff`; `QUERY_KEYS`
  `riderAvailableOrders(lat,lng,page)` + `riderAvailableOrdersRoot` and
  `vendorHandoffOrder(trackingCode)`.
- `src/core/api/services/rider.service.ts` — `listAvailableOrders`,
  `acceptAvailableOrder`, `requestHandoffCode`.
- `src/core/api/services/vendor.service.ts` — `lookupOrderByTrackingCode`,
  `confirmDropOff`, `confirmRiderHandoff`.
- `src/components/layout/nav-config.ts` — Rider "Jobs" repointed at the
  real board; new Rider "Active" and Vendor "Handoff" items.
- `src/core/types/index.ts` — barrel export.

*Rider surface (all new)*
- `src/modules/rider/hooks/use-available-orders.ts`,
  `use-accept-order.ts`, `use-handoff-code.ts`, `use-active-deliveries.ts`
- `src/modules/rider/lib/handoff-format.ts`
- `src/modules/rider/components/available-jobs/` (`AvailableJobsScreen`,
  `AvailableJobCard`)
- `src/modules/rider/components/active-delivery/`
  (`ActiveDeliveriesScreen`, `HandoffCodeScreen`)
- `src/app/(rider)/rider/available-jobs/`, `.../active-deliveries/`,
  `.../active-deliveries/[orderId]/handoff/`

*NodeOperator surface*
- Created `src/modules/vendor/hooks/use-handoff-lookup.ts`,
  `use-confirm-handoff.ts`
- Created `src/modules/vendor/components/handoff/`
  (`DropOffPreviewScreen`, `RiderHandoffScreen`, `HandoffStatusPill`)
- Created `src/app/(vendor)/vendor/drop-off/[trackingCode]/`,
  `.../rider-handoff/`
- `src/modules/vendor/hooks/use-scan-parcel.ts` +
  `components/scanner/QrScannerScreen.tsx` — repointed (see below).

**Summary**: The handoffs contract is structurally different from the
scan-based flow the app had been built against, in two ways that drove
most of the work:

1. **Nobody scans a rider.** Custody transfers on a 6-digit code the
   rider requests (`request-code`) and reads to the Node operator, who
   types it into `confirm-handoff`. There is no `qrNonce` anywhere in
   this contract.
2. **No GPS on any write.** The only endpoint taking coordinates is
   `GET /handoffs/available-orders`, and only to sort that one response
   — nothing is stored.

Consequently the Vendor QR scanner was repointed: it used to call
`vendorService.checkIn()` → the undocumented `orders.scanHandoff`, which
resolved and checked a parcel in atomically from a tracking code +
`qrNonce` + live position. The documented flow splits that into an
origin-scoped read followed by a separate write, so scanning no longer
mutates anything — it carries the tracking code to the new drop-off
preview screen, which does the lookup and owns the confirm. This is
also better counter UX: the operator now eyeballs the physical parcel
against the description *before* accepting custody. `checkIn()` itself
was left on the service, just no longer called from that path.

**Deliberately not done**: `JobOfferScreen`, `ActiveJobScreen`,
`RiderScanScreen` and their hooks (`use-job-offer`, `use-active-job`,
`use-scan-job`) still exist and still target the undocumented
`riderOps.*` routes. They are superseded by this work but were not
deleted — `/rider/jobs` still resolves. Removing them is a separate
decision; nav no longer points at them.

**API gaps found — flag to the backend team**:

1. **No rider-scoped "my deliveries" endpoint.** `GET /orders` is
   Consumer-only and `/handoffs/available-orders` only returns
   *unclaimed* orders, so the instant a rider accepts, the order
   disappears from every list they can query — while they still need its
   `id` to call `request-code` at both ends of the trip. Bridged with
   `store/rider-jobs.store.ts` (localStorage), which is per-device and
   can drift from server state. Requested: `GET /handoffs/my-deliveries`
   or a rider-scoped filter on an orders route. That store should be
   deleted outright when it lands, not kept as a cache.

2. **The origin/destination lookup asymmetry.** `confirm-handoff` is
   keyed on the order **uuid**, and the only documented way to resolve a
   human-readable code into that uuid is
   `GET /handoffs/orders/by-tracking-code/:code` — which is scoped to
   orders whose `originNodeId` is *your* Node. So `rider_pickup` (origin)
   works cleanly, while `rider_arrival` (destination) 404s on the lookup
   by design, leaving the destination operator with no documented way to
   obtain the id they are required to POST to. `RiderHandoffScreen` asks
   them to enter the order id directly as a stopgap, which in practice
   means reading a uuid off the rider's phone — poor counter UX, and it
   should not survive. Requested: either widen the lookup to match the
   destination Node too (the response carries no receiver PII, so the
   privacy rationale for the current scoping appears satisfied either
   way), or accept a tracking code as the `confirm-handoff` path param.

3. **No rider-facing payout figure.** The available-orders contract
   omits `amountKobo` (that's the consumer's fare, not a rider fee) and
   no rider-earnings endpoint exists, so the job board shows route, size
   and distance but no money. Left out rather than invented — the
   intended rider-facing economics need confirming.

**Verification**: `npx tsc --noEmit` clean, `npx eslint src` clean,
`yarn build` succeeds with all five new routes emitted. **No endpoint
was exercised against a live backend** — every response shape, status
transition and error path here is wired from `docs/API.md` alone.
Specifically unverified: real `distanceMeters` magnitudes, whether
`accept` ever returns a status other than `rider_assigned`, the `409`
race and capacity paths, code expiry, and the per-code lockout.

---

## 2026-08-15

**Feature**: Handoffs module, part two — the destination Node's
collection flow. Three new endpoints in `docs/API.md`
(`POST /handoffs/orders/:id/intake`,
`POST /handoffs/orders/:id/collection-code/resend`,
`POST /handoffs/orders/:id/collect`) plus one new error code,
`ORDER_NOT_READY_FOR_COLLECTION`. These close the lifecycle:
`arrived_at_destination → ready_for_collection → completed`.

**Files changed**:

*Shared layer*
- `src/core/api/endpoints.ts` — `intake`, `collectionCodeResend`, `collect`.
- `src/core/types/handoff.types.ts` — `ready_for_collection`/`completed`
  added to `HANDOFF_STATUS`; new `CollectParcelPayload`,
  `CollectionCodeResendResult`, `AwaitingCollectionParcel`,
  `COLLECTION_CODE_TTL_SECONDS`; lifecycle diagram extended and a note
  added on the two codes running in opposite directions.
- `src/core/api/errors.ts` — `ORDER_NOT_READY_FOR_COLLECTION`.
- `src/core/config/constants.ts` — `ROUTES.vendorAwaitingCollection`,
  `vendorCollect(orderId)`.
- `src/core/api/services/vendor.service.ts` — `confirmIntake`,
  `resendCollectionCode`, `collectParcel`.
- Created `src/store/node-parcels.store.ts` — destination-side twin of
  `rider-jobs.store.ts`. See "The uuid gap" below.
- `src/components/layout/nav-config.ts` — new Vendor "Collect" item.

*NodeOperator surface*
- Created `src/modules/vendor/hooks/use-parcel-intake.ts`,
  `use-collect-parcel.ts`, `use-awaiting-collection.ts`
- Created `src/modules/vendor/components/collection/`
  (`AwaitingCollectionScreen`, `CollectParcelScreen`)
- Created `src/app/(vendor)/vendor/awaiting-collection/` and
  `.../[orderId]/collect/`
- `src/modules/vendor/hooks/use-confirm-handoff.ts` — captures the order
  uuid into the new store on a successful `rider_arrival`.
- `src/modules/vendor/components/handoff/RiderHandoffScreen.tsx` —
  arrival success now chains straight into intake.

**Summary**: The physical sequence at a destination Node is rider hands
over → operator checks in → (hours later) receiver collects. The first
two are one moment at the counter, so `RiderHandoffScreen`'s arrival
success state now offers "Check In & Email Receiver" inline rather than
sending the operator somewhere else. That also matters because intake is
what mints and emails the receiver's collection code — until it runs,
the receiver has been told nothing and `resend` has nothing to resend.

The two 6-digit codes in this module run in **opposite directions**,
which is the easiest thing to get backwards and is now called out in
`handoff.types.ts`'s header:

- **Rider codes** (`request-code`): shown only to the rider, read aloud
  to the operator, never emailed. 5-minute TTL.
- **Collection codes** (minted by `intake`): emailed only to the
  receiver, read aloud to the operator, never in any API response the
  operator can see. 1-hour TTL.

`identityConfirmed` on `collect` is deliberately not defaulted. Per
`docs/API.md` it's an audit-trail attestation that does **not** block
completion when `false`, because proxy pickup is normal in this
business. Pre-selecting "yes" would record an attestation the operator
never made — the one thing that would make the field worthless — so the
screen asks it as an explicit two-option question with no default, and
the CTA stays disabled until it's answered.

**The uuid gap — now materially worse, and the main thing to fix**:
yesterday's entry flagged that `confirm-handoff` needs an order uuid the
destination operator has no documented way to obtain. All three new
endpoints are keyed on the same uuid and scoped to the same destination
Node, so the gap now blocks **four of the six operator endpoints**, not
one. There is still no destination-scoped lookup or list anywhere in
`docs/API.md`.

Mitigated, not solved: `confirm-handoff` (`rider_arrival`) *returns* the
uuid, so `use-confirm-handoff.ts` captures it into
`store/node-parcels.store.ts` at that single moment, and the collection
screens work off that. This is honest but fragile — the store is
per-device and per-browser, and clearing site data strands every parcel
at the Node with no frontend recovery path. `AwaitingCollectionScreen`
discloses that in-product rather than hiding it, and `CollectParcelScreen`
has a specific "not on this device" state instead of a dead form. Both
stores should be **deleted, not repurposed as caches**, once a
destination-scoped endpoint exists.

**Second gap found**: `identityConfirmed` asks the operator to attest
they matched the receiver's name, but **no destination-side endpoint
returns the receiver's name**. `by-tracking-code` explicitly omits
receiver PII with the note "that's only relevant at the destination
Node, at collection" — but nothing at collection supplies it either. So
the operator is attesting to a conversation, with nothing on screen to
check against. The UI is worded to match that reality rather than imply
a verification the app didn't perform. Either the collection screens
need a receiver name from somewhere, or the field's meaning should be
narrowed in the docs.

**Deliberately not done**: `ReleaseParcelScreen`,
`use-release-parcel.ts` and `vendorService.releaseParcel()` (→ the
undocumented `orders.scanCollection`) are untouched and still reachable
at `/vendor/parcels/[parcelId]/release`. They are the old, undocumented
version of exactly this flow — same 6-digit-code-at-the-counter shape,
but with a `qrNonce` and GPS the real contract has no concept of, a
3-attempt limit instead of 5, and an auto-send-on-mount that the real
one must not have. Superseded, but removal is a separate decision, same
call as the `riderOps.*` screens yesterday.

**Verification**: `npx tsc --noEmit` clean, `npx eslint src` clean,
`yarn build` succeeds from a cleared `.next` with both new routes
emitted. **No endpoint was exercised against a live backend** — response
shapes, transitions and error paths are wired from `docs/API.md` alone.
Specifically unverified: whether `intake` really is idempotent in
practice, the `409 ORDER_NOT_READY_FOR_COLLECTION` path, the resend
rate limit, the per-code lockout, and whether `collect` returns anything
beyond the summary shape.

---

## 2026-08-15 (later — supersession cleanup)

**Feature**: Removed the screens, hooks, routes, service methods and
endpoint definitions that the two Handoffs passes superseded. No new
functionality; this makes the app use one flow per custody moment
instead of two.

**Why this was needed**: the two integration passes left the superseded
screens in place on the reasoning that deleting them was "a separate
decision." That was defensible for dead code but wrong here, because
several of them were still *reachable*, so the app shipped two parallel
flows over two different backends:

- `VendorHomeScreen`'s "Ready for Collection" tab (from the undocumented
  `/nodes/operator/inventory`) sat alongside the new
  `AwaitingCollectionScreen` (from the local counter store) — two lists
  of the same parcels, disagreeing.
- `NodeParcelRow` routed those rows to the old `ReleaseParcelScreen`
  (undocumented `orders.scanCollection`), while the new list routed to
  `CollectParcelScreen` (documented `collect`).
- `RiderHomeScreen`'s "View Job Offers" CTA still pointed at the old
  `JobOfferScreen` (undocumented `riderOps.jobBoard`). The 2026-08-14
  entry's claim that "nav no longer points at any of them" was true of
  `nav-config.ts` only, and wrong about the app — correcting that here.
- Repointing the QR scanner in the morning's pass had orphaned
  `ScanSuccessScreen`: `ROUTES.vendorScanSuccess` ended up referenced
  nowhere but `constants.ts`.

**Deleted** (28 files):
- Rider: `components/job-offer/`, `components/active-job/`,
  `components/scanner/`, `components/complete/`; hooks `use-job-offer`,
  `use-active-job`, `use-scan-job`; routes `app/(rider)/rider/jobs/**`
  and `app/rider-scan/**`.
- Vendor: `components/release/`, `components/scanner/ScanSuccessScreen`,
  `components/scanner/ShelfLocationPicker`; hook `use-release-parcel`;
  routes `vendor/parcels/[parcelId]/release/` and `vendor/scan-success/`.

**Also removed**: `ENDPOINTS.riderOps.*` (5 routes),
`ENDPOINTS.orders.scanHandoff`/`scanCollection`; `riderService`'s
`getCurrentJobOffer`/`getActiveJob`/`acceptJob`/`declineJob`/
`scanPickup`/`scanDropoff`; `vendorService`'s `lookupParcelByCode`/
`checkIn`/`listShelves`/`assignShelf`/`sendReleaseOtp`/`releaseParcel`;
`useShelfLocations`/`useAssignShelf`; `ROUTES.riderJobOffer`/
`riderActiveJob`/`riderScanPickup`/`riderDeliveryComplete`/
`vendorRelease`/`vendorScanSuccess`; `QUERY_KEYS.riderJobOffer`/
`riderActiveJob`/`vendorShelves`.

**Repointed**: `RiderHomeScreen` → `ROUTES.riderAvailableJobs`;
`NodeParcelRow`'s ready-for-collection rows → `vendorAwaitingCollection`
(deliberately the list, not a deep link — the Node Dashboard is fed by
`/nodes/operator/inventory`, whose `id` is not known to be the order
uuid `collect` needs, so deep-linking on it would 404 in a way that
looks like a wrong code).

**Note on shelf assignment**: `ScanSuccessScreen` was the only UI for
it, and it's gone. Nothing was lost functionally — `listShelves()`
returned `[]` and `assignShelf()` threw NOT_IMPLEMENTED, so the screen
showed an empty picker behind a button that always errored, and shelf
assignment appears nowhere in `docs/API.md`. If the feature returns it
needs a real endpoint first.

**Mocks untouched**: `src/core/mocks/*` and the commented-out mock
service blocks were left exactly as they were, per
`PROJECT_CONTEXT.md`'s standing instruction. One mid-edit slip
clobbered part of `vendor.service.ts`'s commented mock block; it was
restored verbatim rather than taken as an opportunity to prune.

**Verification**: `npx tsc --noEmit` clean, `npx eslint src` clean,
`yarn build` from a cleared `.next` succeeds. Grepped for every removed
symbol — the only surviving mentions are explanatory comments.

---

## 2026-08-15 (later still — maps/geocoding moved to Geoapify)

**Feature**: Replaced Google Maps with Geoapify for both map rendering
and address→coordinate geocoding, behind a provider switch so the move
back to Google is a contained change when there's budget for it.

**Why**: Google requires a billing account even on its free tier.
Geoapify's free tier (3,000 req/day) needs no card, which unblocks the
one thing that actually matters here — Node coordinates. A Node saved
with wrong or placeholder lat/lng is invisible to `GET /nodes/nearby`
for every Consumer searching from a real location: it exists, looks
fine in the Admin list, and simply never appears to anyone.

**Files changed**:
- Created `src/core/api/services/geocoding.service.ts` — provider-agnostic
  `geocodeAddress()` → `{lat, lng, formatted}`. Owns its own `fetch`
  rather than going through `core/api/client.ts`, which speaks the
  Locoomo envelope and attaches session cookies that must never reach a
  third party (same reasoning as the Cloudinary upload in
  `rider.service.ts`).
- Created `src/components/maps/MapView.tsx` — the single place map
  rendering happens. Leaflet + Geoapify raster tiles.
- Created `src/components/maps/MapViewDynamic.tsx` — `next/dynamic`
  wrapper with `ssr: false`. Leaflet reads `window` at module scope, so
  a direct import crashes the server render; every screen goes through
  this.
- Created `src/components/maps/MapUnavailable.tsx` — shared no-key
  fallback, previously duplicated in two components.
- Rewrote `AddressGeocodeButton.tsx` against `geocodingService`. It now
  also shows the provider's matched address back, so a
  plausible-but-wrong match can be caught before saving.
- Replaced `GoogleMapView.tsx` with `NodeMapView.tsx` (renamed — the old
  name was no longer true; same props, `SelectNodesScreen` only changed
  its import).
- Rewrote `NodeNetworkMap.tsx` on the shared `MapView`.
- `env.ts` / `.env.example` / `.env.local` — added
  `NEXT_PUBLIC_MAPS_PROVIDER`, `NEXT_PUBLIC_GEOAPIFY_API_KEY`,
  `NEXT_PUBLIC_GEOAPIFY_MAP_STYLE`. Google vars kept, now only read when
  the provider is `google`.
- `package.json` — added `leaflet` + `@types/leaflet`, removed
  `@vis.gl/react-google-maps`.
- `README.md` — rewrote the map section, added "Switching map provider".

**Why Leaflet and not MapLibre**: Geoapify publishes tiles and APIs but
no map SDK, so a renderer was required either way. Leaflet is ~40KB
gzipped against MapLibre's ~200KB — the right trade for a mobile PWA on
Nigerian networks — and its `divIcon` lets markers stay plain HTML
styled with the app's own tokens instead of provider-specific pin
objects. If vector tiles, rotation or 3D are ever wanted, MapLibre is
the upgrade path and `MapView.tsx` is the only file it touches.

**Marker colours are resolved hex, not Tailwind classes**, in both map
components. Leaflet renders markers outside React, so the Tailwind JIT
compiler never sees class names used there and would purge them.

**Note on the Google path**: `geocodeWithGoogle()` is a deliberate
`NOT_IMPLEMENTED` throw rather than a stub that silently falls back to
Geoapify. Google's Geocoding *web service* sends no CORS headers, so a
browser can't call it directly — it needs the Maps JS SDK's client-side
`Geocoder` (what the old `AddressGeocodeButton` used) or a backend proxy
route. Setting `NEXT_PUBLIC_MAPS_PROVIDER=google` today fails loudly,
which is better than quietly using a provider the operator didn't pick.

**Verification**: `npx tsc --noEmit` clean, `npx eslint src` clean,
`yarn build` from a cleared `.next` succeeds. All three map-bearing
routes (`/delivery/select-nodes`, `/admin/nodes`, `/vendor/node-setup`)
were rendered against a running dev server with a dummy Geoapify key set
and returned `200` with no SSR errors — that specifically exercises the
`window`-at-module-scope hazard the dynamic import exists to avoid.
Bundles got smaller: select-nodes 192→178 kB, admin/nodes 165→152 kB,
vendor/node-setup 164→149 kB first-load JS (Leaflet lands in a lazy
chunk).

**Not verified**: no real Geoapify key was available, so live tile
rendering and a real geocode response have not been seen. The response
parsing is written defensively (missing `features`, non-numeric
`lat`/`lon`, and a 200-with-no-results are each handled) but the happy
path is unexercised.

---

## 2026-08-15 (last — rider handoff: the operator stops asking the rider for a tracking code)

**Feature**: Reworked the Node operator's rider-handoff flow so the only
thing a rider has to produce at a counter is their 6-digit code, which
is all `docs/API.md` ever said passes between them. The operator now
resolves *which parcel* from their own Node's records instead.

**The bug, stated precisely**: `RiderHandoffScreen` made "tracking code"
a required first field and hinted the operator could "read it off the
rider's screen." Nothing in the contract supports that.
`POST /handoffs/orders/:id/request-code` returns `{code, expiresAt}` —
no order reference — and the code is neither emailed nor logged, so it
is *the entire* rider→operator payload. Every rider therefore arrived
with six digits and was asked for a second identifier the app had no
right to expect. The endpoint layer was already correct; what was wrong
was where the frontend expected the order **uuid** to come from.

**Where the uuid actually comes from, per direction** (this is the whole
design):

- **`rider_pickup` (origin).** The origin operator already handled this
  parcel — they looked it up by tracking code and confirmed its drop-off
  at their own counter, and `POST /drop-off` hands back the uuid in its
  response. That is now captured into a new
  `store/node-outgoing.store.ts`, and the handoff screen shows it as a
  pick-list. Operator taps the parcel, types six digits, done.
- **`rider_arrival` (destination).** Still blocked backend-side (gap #2
  below, unchanged). The destination Node hears about a parcel for the
  first time when the rider walks in, and `by-tracking-code` is
  origin-scoped. The screen still offers a lookup, but keyed on the code
  **printed on the parcel label** — the object is in the operator's
  hands — and its `404` copy now says plainly that arrivals can't be
  looked up yet rather than implying operator error.

**Files changed**:
- Created `src/store/node-outgoing.store.ts` — parcels this Node is
  holding for a rider. Origin-side twin of `node-parcels.store.ts`, with
  one important difference documented in its header: **this list is
  recoverable.** `by-tracking-code` is scoped to exactly this Node's
  outgoing orders, so a cleared browser or a drop-off taken on the shop's
  other tablet can be rebuilt from the parcel label. The destination
  store has no such path. `addParcel` merges rather than replaces, so a
  record captured from a bare `HandoffOrderSummary` (codes only) gains
  its description/destination when re-resolved — rows an operator can't
  tell apart are useless at a counter.
- Created `src/modules/vendor/hooks/use-outgoing-parcels.ts` — mirrors
  `use-awaiting-collection.ts` exactly (effect-based hydration,
  `isHydrated` so the picker never flashes an empty state). Filters to
  the two statuses a pickup can legally confirm.
- `src/core/types/handoff.types.ts` — added `OutgoingParcel`; extended
  the module header's point 1 to say the code carries no order identity,
  so no screen may ever ask a rider for a tracking code.
- `src/modules/vendor/hooks/use-handoff-lookup.ts` — the drop-off
  confirm now records the order into the outgoing store, merging in the
  preview's `parcelDescription`/`parcelSize`/`destinationNodeName`.
- `src/modules/vendor/hooks/use-confirm-handoff.ts` — owns
  `selectedOrderId`; `confirmHandoff(code)` now takes only a code.
  Pickup success prunes the row; arrival success still captures into
  `node-parcels.store.ts` (unchanged, and still the only moment that
  uuid exists for a destination operator). New: a confirm that returns
  `409 ILLEGAL_ORDER_TRANSITION`/`404 NOT_FOUND` on a *listed* parcel
  proves the local row stale, so it's pruned and its tracking code
  returned as `prunedTrackingCode` — a row vanishing mid-tap with no
  explanation is worse than the stale row was.
- `src/modules/vendor/components/handoff/RiderHandoffScreen.tsx` —
  step 2 rebuilt: radio-style parcel rows for pickup, a collapsed
  "not listed?" label-code fallback (auto-opened when the list is
  empty), one shared "what you're confirming" card for both paths, and a
  pre-flight warning when the selected parcel is still
  `awaiting_drop_off` (a guaranteed 409). Step 3's copy now ends "That's
  the only thing they need to give you."
- `src/modules/rider/components/active-delivery/HandoffCodeScreen.tsx` —
  says the same thing from the rider's side ("These 6 digits are all the
  operator needs"), so a rider doesn't start reciting a tracking code at
  the counter. Its "not on this device" empty state no longer tells the
  rider the operator can find the parcel by tracking code — true at an
  origin Node, false at a destination one.

**Backend finding, confirmed live this session** (unauthenticated route
probes against `https://locoomo-api.up.railway.app`, which distinguishes
`Cannot GET …` from `UNAUTHENTICATED`):
- `GET /nodes/operator/inventory` → **`404 Cannot GET`. The route does
  not exist on the deployed backend.** `VendorHomeScreen` renders its
  `isError` state as the same "No parcels here" empty state as a genuine
  empty list, so **the Node Dashboard's parcel list is silently, always
  empty in production.** Not fixed here (out of scope), but it is why
  the outgoing list had to be built from drop-off confirms rather than
  from the dashboard's list, and it should be the next thing someone
  picks up.
- `GET /handoffs/my-deliveries`, `/handoffs/orders`,
  `/handoffs/node-orders`, `/handoffs/incoming-orders`,
  `/handoffs/orders/at-node`, `/nodes/operator/parcels`,
  `/nodes/me/parcels`, `POST /handoffs/confirm-handoff` (code-only, no
  order id) → all `404 Cannot GET/POST`. So neither client store has a
  server-side alternative hiding behind an undocumented route, and there
  is no code-only confirm endpoint. `by-tracking-code`,
  `available-orders` and `confirm-handoff` all answer `UNAUTHENTICATED`,
  i.e. they exist as documented.

**Verification**: `npx tsc --noEmit` clean, `npx eslint src` clean,
`yarn build` from a cleared `.next` succeeds; `/vendor/rider-handoff`
and `/rider/active-deliveries/[orderId]/handoff` both return `200` from
a running dev server. **Not verified**: nothing was clicked through in a
browser (no browser tooling available in this session) and no
NodeOperator session exists to exercise the endpoints, so the pickup
pick-list, the prune-on-409 path and the arrival lookup's real
behaviour against the deployed backend are all unexercised. The single
open question that only a live NodeOperator account can settle is
whether the deployed `by-tracking-code` is as origin-scoped as its docs
say — if it isn't, arrivals already work through the label fallback.

---

## 2026-08-15 (last, follow-up — the parcel-lookup field comes off `/vendor/rider-handoff` entirely)

**Feature**: Removed the tracking-code input and its "Find" button from
the rider-handoff screen. The screen now has exactly one input in either
direction: the rider's 6 digits.

**Why, on top of the pass above**: that pass kept the lookup as a
fallback for a parcel missing from the outgoing list, collapsed behind a
"not listed?" link. Reviewed at the counter, that's still wrong — **any
code box on this screen reads as something to ask the rider for**, which
is the exact confusion the whole change exists to remove. The field
being technically optional doesn't help an operator who's already
looking at a rider.

**What replaced it, per direction**:
- **Pickup.** Pick-list only. The recovery for a parcel that isn't on
  it moved to the scanner: `useHandoffLookup` now records into
  `store/node-outgoing.store.ts` on the **lookup**, not just the
  drop-off confirm, so scanning a parcel's label at `/vendor-scan` puts
  it back on the list with no state change implied. That's the same
  origin-scoped `by-tracking-code` call as before, just reached from the
  screen where a code box unambiguously means "read the label". The
  empty-list state now links straight to the scanner.
- **Arrival.** No form at all — a card explaining that a Node can only
  see parcels it sent out, so there is nothing to match the rider's code
  against, and this needs a backend change. **This is a deliberate loss
  of a maybe-working path**: `by-tracking-code` is documented as
  origin-scoped, but nobody has ever tested it with a live NodeOperator
  session, so a laxer deployment might have made the old field work.
  Recorded here so it isn't rediscovered as a regression — reinstating
  arrivals is gated on the backend ask in `use-confirm-handoff.ts`'s
  header, after which arrival becomes the same pick-a-parcel flow as
  pickup.

**Files changed**:
- `src/modules/vendor/components/handoff/RiderHandoffScreen.tsx` —
  removed the `Input`/Find pair, `trackingCode`/`isLookupOpen` state, the
  lookup error branches and the now-redundant "selected parcel" summary
  card (the picked row is already highlighted). Arrival renders the
  blocked-state card instead of steps 2 and 3.
- `src/modules/vendor/hooks/use-confirm-handoff.ts` — the lookup
  mutation is gone; selection comes only from the outgoing list.
  `selectedParcel` is a plain find over it. Everything else (direction,
  prune-on-stale, attempt counting, the arrival capture into
  `node-parcels.store.ts`) is unchanged.
- `src/modules/vendor/hooks/use-handoff-lookup.ts` — records the
  resolved order into the outgoing store from an effect on the lookup
  query's data, gated on `isAwaitingRiderPickup` so parcels past pickup
  aren't re-added just to 409 later.

**Verification**: `npx tsc --noEmit` clean, `npx eslint src` clean,
`yarn build` from a cleared `.next` succeeds; `/vendor/rider-handoff`
and `/vendor/drop-off/[trackingCode]` both return 200 from a dev server.
Still no browser click-through and no NodeOperator session — the
pick-list, the scan-to-recover path and the prune-on-409 path remain
unexercised against anything real.

---

## 2026-08-16 — `RiderHandoffScreen` actually wired to the rebuilt hooks

**Feature**: None — this is a correctness fix. The previous session
("2026-08-15, last, follow-up") rebuilt `use-confirm-handoff.ts`,
`use-handoff-lookup.ts`, `use-outgoing-parcels.ts` and
`store/node-outgoing.store.ts` around "the rider gives you six digits
and nothing else," and its log entry describes `RiderHandoffScreen.tsx`
as already rebuilt to match — a pick-list for pickup, an honest blocked
card for arrival. That description did not match the file on disk.

**The bug, stated precisely**: `RiderHandoffScreen.tsx` still had its
old body, with the tracking-code/order-id lookup UI commented out and
the hook destructure still naming removed exports
(`resolveByTrackingCode`, `resolvedOrder`, `isResolving`,
`lookupNotFound`, `lookupError`) in commented-out lines. The "Which
parcel?" step was entirely commented out, so `selectOrder` was never
called from the UI. `useConfirmHandoff`'s `confirmHandoff(code)` is a
no-op when `selectedOrderId` is unset (`if (!selectedOrderId) return;`),
so **pickup could not complete** — the confirm button was reachable and
enabled (`canConfirm` only checked code length) but tapping it silently
did nothing. Re-reading `docs/API.md` confirmed the hook layer's design
was correct as documented: `confirm-handoff` takes `type` and `code` in
the body but needs the order **uuid** in its path, and the rider's code
carries no order identity, so an order must be resolved client-side
before the request can be made.

**Fix**: Rebuilt `RiderHandoffScreen.tsx`'s body to match the hooks that
were already correct:
- Pickup renders a pick-list from `outgoingParcels`
  (`use-outgoing-parcels.ts`, gated on `isOutgoingHydrated` to avoid an
  empty-state flash), each row calling `selectOrder(parcel.id)`. An
  empty list shows a card linking to `/vendor-scan` (the documented
  recovery path — scanning a label re-adds a parcel via
  `by-tracking-code`, which is origin-scoped). `prunedTrackingCode` is
  surfaced when a listed parcel turns out to be stale.
- Arrival renders the blocked-state card only — no form, no code input,
  no confirm button, since there is no way to set `selectedOrderId` for
  that direction (backend gap, unchanged, documented in
  `use-confirm-handoff.ts`'s header and
  `API_INTEGRATION_STATUS.md`'s Inconsistencies section).
- `canConfirm` is now `isPickup && !!selectedOrderId && code.length ===
  HANDOFF_CODE_LENGTH` — previously it only checked code length, which
  is what let the button sit enabled with nothing selected.
- Removed the dead commented-out block and its unused imports (`Input`,
  the tracking-code/order-id state).
- The success screen (pickup/arrival copy, chained `useParcelIntake`
  check-in for arrival) was already correct and is unchanged — arrival's
  branch stays in place for when the backend gap closes, per the prior
  session's reasoning; it just can't be reached today.

**Files changed**:
- `src/modules/vendor/components/handoff/RiderHandoffScreen.tsx` — body
  rebuilt as above. No change to `use-confirm-handoff.ts`,
  `use-handoff-lookup.ts`, `use-outgoing-parcels.ts`,
  `store/node-outgoing.store.ts`, `store/node-parcels.store.ts`,
  `use-parcel-intake.ts`, or any type — all of those already matched
  `docs/API.md`.

**Verification**: `npx tsc --noEmit` clean, `npx eslint src` clean,
`next build` from a cleared `.next` succeeds; `/vendor/rider-handoff`
returns `200` from both the production build and a dev server, with no
`Application error`/`__next_error__` markers in the response body.
**Not verified**: no NodeOperator session was available, so the
pick-list rendering with real data, the scan-to-recover path, and the
prune-on-409 path are still unexercised against a live backend — same
open item the previous two sessions left, unchanged by this fix.

---

## 2026-08-17 — `my-orders`/`my-node/orders` land, arrival handoff finally works, rider payouts + license number

**Feature**: `docs/API.md` gained four things since the last session:
`GET /handoffs/my-orders` (rider), `GET /handoffs/my-node/orders`
(NodeOperator, either side via `myRole`), `GET /admin/rider-earnings`
(Admin payout report), and `licenseNumber` on `POST /riders/onboarding`.
This session implemented all four and used the first two to finish the
rider-handoff work the last two sessions had to leave half-done.

**The bug the last session left standing**: `/vendor/rider-handoff`
could only ever complete a `rider_pickup`. Arrival was rendered as a
static "can't be done yet" card, because `confirm-handoff` needs the
order's uuid in its path and, at the time, there was no documented way
for a *destination* Node operator to learn one before the rider showed
up — `by-tracking-code` is origin-scoped, and nothing else existed.
That was a correct read of `docs/API.md` as it stood. It stopped being
correct the moment `GET /handoffs/my-node/orders` shipped.

**What changed, per endpoint**:

- **`GET /handoffs/my-node/orders`** returns every order that's ever
  touched the caller's Node, either as origin or destination, `myRole`
  on each item saying which. New hook
  `src/modules/vendor/hooks/use-my-node-orders.ts` wraps it in one
  TanStack Query and exports four pure filters —
  `isAwaitingPickup`/`isAwaitingArrival`/`needsIntake`/
  `isReadyForCollection` — each a `myRole` + `status` predicate.
- **`GET /handoffs/my-orders`** returns every order a rider has ever
  been assigned, current and past. New hook
  `src/modules/rider/hooks/use-my-orders.ts`, with
  `isActiveDelivery`/`nextHandoffType` filters mirroring the vendor
  side's shape.
- **`GET /admin/rider-earnings`** — read-only payout-readiness report,
  one row per rider with a `completed` order, sorted by amount owed
  descending, each row expandable to that rider's individual orders.
  New `RiderPayoutSummary`/`RiderPayoutOrder` types, `getRiderEarnings`
  on `adminService`, `useRiderEarnings` hook, `RiderEarningsScreen` at
  `/admin/rider-earnings`, added to `ADMIN_NAV_ITEMS` next to
  "Analytics" (its closest thematic neighbour, same placement reasoning
  as "Pricing"/"Approvals" before it).
- **`licenseNumber`** — added to `SubmitRiderVerificationPayload` and
  `RiderVerificationProfile` (`string | null`, `null` for pre-existing
  riders). `RiderVerificationScreen`'s form gained a required input;
  the approved-status view shows it when present.

**The actual fix — `RiderHandoffScreen` rebuilt for symmetric pickup/
arrival**: Both directions now render the identical shape of pick-list,
sourced from `useConfirmHandoff`'s `pickableOrders` (which filters
`use-my-node-orders.ts`'s `orders` by `isAwaitingPickup` or
`isAwaitingArrival` depending on the selected direction). Tap a row,
type the rider's 6 digits, confirm — same interaction, same code, same
endpoint (`confirm-handoff`), differing only in `type` and which filter
picked the list. `useConfirmHandoff` no longer owns any localStorage
state; `selectOrder`/`selectedOrderId` are the only client state left,
and every mutation (`confirmHandoff`, `useCollectParcel`,
`useParcelIntake`, `useHandoffLookup`'s drop-off confirm) now
invalidates `QUERY_KEYS.vendorMyNodeOrders` instead of hand-writing a
store update.

**Three stores deleted, not deprecated**: `store/rider-jobs.store.ts`,
`store/node-outgoing.store.ts`, `store/node-parcels.store.ts`. Every
consumer was rewired to the two new hooks:
- Vendor: `use-confirm-handoff.ts`, `use-handoff-lookup.ts`,
  `use-awaiting-collection.ts`, `use-collect-parcel.ts`,
  `use-parcel-intake.ts`, `AwaitingCollectionScreen.tsx`,
  `CollectParcelScreen.tsx`.
- Rider: `use-active-deliveries.ts`, `use-accept-order.ts`,
  `use-handoff-code.ts`, `ActiveDeliveriesScreen.tsx`,
  `HandoffCodeScreen.tsx`.

One behavior change worth flagging: `AwaitingCollectionScreen` and
`CollectParcelScreen` used to show "arrived X ago"/"checked in X ago"
relative-time text, backed by timestamps the old stores recorded
themselves (`arrivedAt`, `intakeAt`) the moment each transition
happened on-device. `NodeOrderSummary` (the `my-node/orders` item
shape) carries no per-transition timestamp, only `createdAt` (order
placement) — so those lines were removed rather than reattached to a
value that would now be wrong or misleading. If per-transition timing
is wanted back, it needs a real field on the API response.

Also, `useAcceptOrder` (rider) seeds the accepted order straight into
`QUERY_KEYS.riderMyOrders`'s cache via `setQueryData` before navigating
to the handoff-code screen, rather than relying on the invalidated
query's refetch to land in time — a network round-trip between accept
and the handoff screen mounting would otherwise flash "nothing to hand
off here" for a beat.

**Deliberately not wired**: `MyDeliveriesScreen` ("My Deliveries"
earnings tab / `useJobHistory` / `DeliveryHistoryRow`). Its row needs a
`payout` amount per job; neither `my-orders` nor any other route in
`docs/API.md` returns a rider-facing fee figure — `GET
/admin/rider-earnings` is Admin-only and reports the consumer-paid
`amountKobo`, not a rider payout rate, which still doesn't exist as a
concept anywhere in the contract. Wiring `getMyOrders()` into that
screen would mean fabricating numbers the API doesn't provide, so
`riderService.getEarningsSummary()`/`getJobHistory()` both stay
`NOT_IMPLEMENTED`, documented in that file's header.

**Files changed**:
- `src/core/types/handoff.types.ts` — added `NodeOrderRole`,
  `NodeOrderSummary`, `MyOrderSummary`; removed `OutgoingParcel`,
  `AwaitingCollectionParcel`, `AcceptedDelivery` (the three
  store-shaped types, now dead); updated the module header.
- `src/core/types/rider.types.ts` — `licenseNumber` on
  `RiderVerificationProfile`/`SubmitRiderVerificationPayload`.
- `src/core/types/admin.types.ts` — added `RiderPayoutSummary`,
  `RiderPayoutOrder`.
- `src/core/api/endpoints.ts` — `handoffs.myOrders`,
  `handoffs.myNodeOrders`, `adminRiderEarnings.list`.
- `src/core/config/constants.ts` — `ROUTES.adminRiderEarnings`;
  `QUERY_KEYS.vendorMyNodeOrders`/`riderMyOrders`/`adminRiderEarnings`.
- `src/core/api/services/vendor.service.ts` — `getMyNodeOrders`.
- `src/core/api/services/rider.service.ts` — `getMyOrders`.
- `src/core/api/services/admin.service.ts` — `getRiderEarnings`.
- New: `src/modules/vendor/hooks/use-my-node-orders.ts`,
  `src/modules/rider/hooks/use-my-orders.ts`,
  `src/modules/admin/hooks/use-rider-earnings.ts`,
  `src/modules/admin/components/rider-earnings/` (`RiderEarningsScreen.tsx`,
  `index.ts`), `src/app/(admin)/admin/rider-earnings/page.tsx`.
- Deleted: `src/store/rider-jobs.store.ts`,
  `src/store/node-outgoing.store.ts`, `src/store/node-parcels.store.ts`,
  `src/modules/vendor/hooks/use-outgoing-parcels.ts` (folded into
  `use-my-node-orders.ts`).
- Rewritten: `src/modules/vendor/hooks/use-confirm-handoff.ts`,
  `use-handoff-lookup.ts`, `use-awaiting-collection.ts`,
  `use-collect-parcel.ts`, `use-parcel-intake.ts`;
  `src/modules/vendor/components/handoff/RiderHandoffScreen.tsx`;
  `src/modules/vendor/components/collection/AwaitingCollectionScreen.tsx`,
  `CollectParcelScreen.tsx`; `src/modules/rider/hooks/use-active-deliveries.ts`,
  `use-accept-order.ts`, `use-handoff-code.ts`;
  `src/modules/rider/components/active-delivery/ActiveDeliveriesScreen.tsx`,
  `HandoffCodeScreen.tsx`; `src/modules/rider/hooks/use-rider-verification.ts`,
  `src/modules/rider/components/verification/RiderVerificationScreen.tsx`.
- `src/components/layout/nav-config.ts` — "Rider Earnings" nav item.

**Verification**: `npx tsc --noEmit` clean, `npx eslint src` clean,
`next build` from a cleared `.next` succeeds (`/admin/rider-earnings`
appears in the route table alongside the rest). `/vendor/rider-handoff`,
`/vendor/awaiting-collection`, `/rider/active-deliveries`,
`/rider/verification`, `/admin/rider-earnings` all return `200` from a
dev server with no `Application error`/`__next_error__` markers in the
response body. **Not verified**: no NodeOperator, Rider, or Admin
session was available, so none of the four new endpoints, the arrival
pick-list, the collection screens' new timestamp-free rows, or the
earnings table have been exercised against real data — the same open
item every session in this module has left, unchanged by this pass.

---

## 2026-08-17 (follow-up) — three fragmented screens become one tabbed Inventory

**Feature**: Replaced the Node operator's screen-per-step design
(`RiderHandoffScreen` for `rider_pickup`/`rider_arrival`,
`AwaitingCollectionScreen` for the destination-side shelf) with a
single tabbed `InventoryScreen` at `/vendor/inventory`. The user's
framing: that split stopped making sense once both screens turned out
to read the exact same data — `GET /handoffs/my-node/orders`, wired
earlier the same day — so a mobile-first PWA counter app should show
one inventory, not three disconnected screens plus a nav item each.

**Design**: Four tabs, one `useMyNodeOrders()` query, sliced four ways
(`use-my-node-orders.ts`'s existing filters — nothing new needed there):
- **Pickup** (`isAwaitingPickup`) — origin side, waiting on a rider.
- **Incoming** (`isAwaitingArrival`) — destination side, rider en route.
- **Collection** — `needsIntake` (one-tap "Check In & Email Receiver")
  and `isReadyForCollection` (routes to `CollectParcelScreen`, kept
  separate since code + identity attestation is a materially different
  task than a list row).
- **History** — every order, unfiltered, newest first per docs/API.md.
  New: nothing before this showed the full record. Read-only, no
  action affordance on any row.

Pickup and Incoming rows **expand in place** rather than navigating —
mobile-first means the single most frequent counter action (type six
digits, confirm) shouldn't cost a page transition. `useConfirmHandoff`
is unchanged and reused as-is; `InventoryScreen` keeps its
`handoffType` synced to whichever of Pickup/Incoming is the active tab
via one effect, and surfaces success via a toast
(`useNotificationStore`) since the confirmed row just disappears from
its tab on the next refetch rather than a dedicated success screen.

**A lint fix worth noting**: the first draft of the expandable code
panel kept `code` state at the list level and reset it in a
`useEffect` keyed on `selectedOrderId` — `eslint-plugin-react-hooks`'s
`set-state-in-effect` rule correctly flagged this as the "adjusting
state in an effect" anti-pattern. Fixed by extracting the panel into
its own `ConfirmPanel` subcomponent, rendered with `key={order.id}` —
switching rows now mounts a fresh component with blank state instead
of an effect reaching back to clear the previous one.

**`RiderHandoffScreen.tsx` and `AwaitingCollectionScreen.tsx` deleted,
not deprecated** — same-day files, retired same day, once their
replacement existed. Their routes went with them: `/vendor/rider-handoff`
(whole folder) and `/vendor/awaiting-collection/page.tsx` (the list
page only — `/vendor/awaiting-collection/[orderId]/collect/page.tsx`
survives unchanged, since Next's App Router doesn't require a parent
segment to have its own `page.tsx`). `VENDOR_NAV_ITEMS` now has one
"Inventory" entry (`ArchiveIcon`) where "Handoff" and "Collect" used to
be two — net *fewer* bottom-nav items, not more. Two remaining
cross-links fixed to point at `ROUTES.vendorInventory`:
`NodeParcelRow.tsx` (Node Dashboard's ready-for-collection rows) and
`CollectParcelScreen.tsx`'s two "Back to Counter" buttons.

**Deliberately out of scope**: `VendorHomeScreen`'s own parcel list
(`ParcelFilterTabs`/`NodeParcelRow`/`useNodeParcels`) is untouched. It's
fed by the undocumented, still-404ing `GET /nodes/operator/inventory` —
a real, older, separately-tracked gap, not the one this session closed.
Pointing it at `use-my-node-orders.ts` is the natural next step, but
`NodeParcel` (its current type) carries sender/receiver names that
`NodeOrderSummary` doesn't — that's a product decision about what the
row should show, not a data-source swap, so it's flagged rather than
guessed at.

**Files changed**:
- New: `src/modules/vendor/components/inventory/` — `InventoryScreen.tsx`,
  `InventoryTabs.tsx`, `HandoffOrderList.tsx`, `CollectionList.tsx`,
  `HistoryList.tsx`, `index.ts`; `src/app/(vendor)/vendor/inventory/page.tsx`.
- Deleted: `src/modules/vendor/components/handoff/RiderHandoffScreen.tsx`,
  `src/modules/vendor/components/collection/AwaitingCollectionScreen.tsx`,
  `src/app/(vendor)/vendor/rider-handoff/` (folder),
  `src/app/(vendor)/vendor/awaiting-collection/page.tsx`.
- `src/modules/vendor/components/handoff/index.ts`,
  `src/modules/vendor/components/collection/index.ts` — drop the deleted
  screens' exports.
- `src/core/config/constants.ts` — `ROUTES.vendorInventory` replaces
  `vendorRiderHandoff`/`vendorAwaitingCollection`.
- `src/components/layout/nav-config.ts` — `VENDOR_NAV_ITEMS`'s
  "Handoff"/"Collect" collapsed into one "Inventory" entry.
- `src/modules/vendor/components/dashboard/NodeParcelRow.tsx`,
  `src/modules/vendor/components/collection/CollectParcelScreen.tsx` —
  cross-links repointed at `ROUTES.vendorInventory`.

**Verification**: `npx tsc --noEmit` clean, `npx eslint src` clean
(after the `ConfirmPanel` extraction above), `next build` from a
cleared `.next` succeeds — `/vendor/rider-handoff` and
`/vendor/awaiting-collection` are absent from the route table,
`/vendor/inventory` and `/vendor/awaiting-collection/[orderId]/collect`
are both present. `/vendor/inventory`, `/vendor/home`, and
`/vendor/awaiting-collection/[some-id]/collect` all return `200` from a
dev server with no `Application error`/`__next_error__` markers. **Not
verified**: no NodeOperator session available, so the expand-in-place
confirm flow, the tab count badges, and the History tab's real data
have not been exercised against live orders.

---

## 2026-08-17 (follow-up 2) — Node Dashboard (`/vendor/home`) rebuilt off real endpoints

**Feature**: closes the gap the previous entry explicitly flagged as
"the best next task" — the Node Operator's Home screen
(`VendorHomeScreen`) read the undocumented `GET
/nodes/operator/inventory`, which 404s on the deployed backend
(`docs/API_INTEGRATION_STATUS.md` item 2b). The screen's error state
rendered identically to a genuine empty list ("No parcels here"), so
the app's own Home tab was a dead endpoint behind a UI that looked
fine — no error, no crash, just permanently wrong content.

**Fix**: rebuilt the whole screen on the two real, confirmed routes
already wired elsewhere in the app, rather than waiting on
`/nodes/operator/inventory` to ever ship:
- **`GET /node-operators/me`** (`vendorService.getMyNodeOperatorProfile()`)
  for Node identity, address, and the self-reported max `capacity` —
  same route `useVendorNodeSetup` already polls for approval status,
  reused at the same `QUERY_KEYS.vendorNodeOperatorProfile` query key so
  TanStack Query dedupes the two call sites.
- **`GET /handoffs/my-node/orders`** (`useMyNodeOrders()`, already built
  2026-08-17 earlier the same day for `InventoryScreen`) for the live
  parcel snapshot.

Neither real endpoint returns an "occupied capacity" figure — the old
mock/dead-endpoint shape invented one. `use-node-dashboard.ts` derives
it instead: any order currently physically at this Node, on either
side of the custody chain (`isAwaitingPickup` — origin, not yet handed
to a rider; `needsIntake` — destination, arrived but not checked in;
`isReadyForCollection` — destination, checked in, waiting on the
receiver). `in_transit` orders are deliberately excluded — the parcel
isn't on the premises yet. `isHighFull` keeps the old mock's 60%
threshold.

**UI adjusted, not just re-plumbed** — a Node dashboard has three real
states the old build never distinguished (it just silently rendered
empty either way):
- **Not onboarded** (`GET /node-operators/me` → `404 NOT_FOUND`) — an
  `EmptyState` pointing at `/vendor/node-setup`, instead of a blank
  capacity bar.
- **Onboarded, not yet Admin-approved** (`node.status !== "active"`) —
  a "Waiting for approval" `EmptyState` with a link back to Node Setup,
  instead of showing capacity/parcels for a Node that can't legally
  receive anything yet.
- **Active** — the real dashboard: `CapacityBar` (unchanged component,
  now fed real numbers), the same three filter tabs re-pointed at the
  real predicates (`isAwaitingPickup`/`isReadyForCollection`/all
  on-site), and a row per order.

**Row component swapped, not patched**: `NodeParcelRow` (rendered the
now-dead `NodeParcel` shape, sender/receiver names included) is
deleted; `NodeOrderRow` (new) renders `NodeOrderSummary` instead —
tracking code, description, origin/destination Node name, and the
shared `HandoffStatusPill` used everywhere else in the vendor module
(`HandoffOrderList`/`CollectionList`/`HistoryList`), for one consistent
status-pill look across Home and Inventory. This is the product
decision the previous entry flagged as blocking a straight data-source
swap: `NodeOrderSummary` has no sender/receiver names, so the row shows
what every other handoff-module row already shows instead of inventing
fields the real response doesn't have. Ready-for-collection rows now
deep-link straight to `ROUTES.vendorCollect(order.id)` — safe now that
the id is a real order uuid from `my-node/orders`, unlike the old
dashboard's ids from the 404ing endpoint. Every other row lands on
`/vendor/inventory`, where the actual pickup/arrival code entry and
check-in actions live.

**`ROUTES.vendorFlag` (Flag Issue screen) is no longer linked from
Home.** It was the non-ready rows' destination on the old
`NodeParcelRow`, but `vendorService.flagParcel()` throws
`NOT_IMPLEMENTED` unconditionally — no backend route exists. Routing a
now-functional screen into a guaranteed-failure flow would be a
regression, not a fix. The Flag screen/route/hook are untouched and
still reachable by direct URL, but the app no longer links to them from
anywhere active — a separate, already-documented backend gap
(`docs/API_INTEGRATION_STATUS.md`'s "Genuine API gaps" section), not
something this session's endpoint swap should paper over.

**Verified live against the deployed backend**, not just typechecked:
registered a throwaway NodeOperator account through the app's own dev
proxy (`npm run dev`, hitting `https://locoomo-api.up.railway.app` via
`next.config.ts`'s rewrite), and drove the exact sequence
`useVendorNode`/`useNodeDashboard` make:
1. `GET /node-operators/me` before onboarding → real `404 NOT_FOUND`,
   confirming the `notOnboarded` branch fires on the real error shape.
2. `POST /node-operators/onboarding` → `201`, response matches
   `NodeOperatorProfile`/`NodeOperatorNode` exactly as typed.
3. `GET /node-operators/me` after onboarding → `200`, `node.status:
   "pending"`, confirming the "waiting for approval" branch's gate
   (`status !== "active"`) fires correctly.
4. `GET /handoffs/my-node/orders?limit=100` → `200`, `{items: [],
   total: 0}` — confirms the dashboard doesn't crash or error on a
   brand-new Node with no orders yet (`total` from `capacity`, `occupied:
   0`, `isHighFull: false`).

**Not verified**: no Admin session exists to approve the test Node, so
the "active" happy-path render (real `CapacityBar` numbers, populated
tabs, `NodeOrderRow` list) was exercised via `npx tsc --noEmit` / `next
build` / logic review only, not seen rendered in a browser — no
browser automation tool (`chromium-cli`, Playwright, `claude-in-chrome`)
was available in this session's environment. `npx tsc --noEmit` clean,
`npx eslint` clean on every file touched, `next build` from a clean
tree succeeds with `/vendor/home` present in the route table.

**Files changed**:
- Rewritten: `src/modules/vendor/hooks/use-vendor-node.ts` (now reads
  `GET /node-operators/me` instead of `/nodes/operator/inventory`;
  shared by `VendorProfileScreen`, which gets the same fix for free —
  it only ever read `node.name`/`node.address`, both present on the new
  shape).
- New: `src/modules/vendor/hooks/use-node-dashboard.ts` (combines
  `useVendorNode` + `useMyNodeOrders`, derives capacity/tab state).
- New: `src/modules/vendor/components/dashboard/NodeOrderRow.tsx`
  (replaces `NodeParcelRow.tsx`, deleted).
- Rewritten: `src/modules/vendor/components/dashboard/VendorHomeScreen.tsx`
  (loading/not-onboarded/pending-approval/active states),
  `src/modules/vendor/components/dashboard/ParcelFilterTabs.tsx`
  (retyped onto `DashboardFilterTab` from the new hook).
- `src/modules/vendor/components/dashboard/index.ts` — barrel updated
  for the `NodeParcelRow` → `NodeOrderRow` rename.
- `src/core/api/services/vendor.service.ts` — deleted the now-unused
  `getNodeProfile()` method; `listParcels()` and `mapInventoryResponse()`
  are untouched, still load-bearing for the Flag screen's parcel lookup
  (`use-parcel-detail.ts`) — a separate, already-`NOT_IMPLEMENTED`
  backend gap, out of scope here.
- Deleted: `src/modules/vendor/hooks/use-node-parcels.ts` (fully dead
  after the rewrite above — its only consumer was the old
  `VendorHomeScreen`).
- Docs: this entry; `docs/HANDOFF.md`'s "Current objective" and the
  "Explicitly out of scope this pass" note it superseded;
  `docs/API_INTEGRATION_STATUS.md`'s item 2b; `docs/ARCHITECTURE.md`'s
  Vendor flow block.

---

## 2026-08-17 (follow-up 3) — Inventory retired: its four tabs redistributed into Home and Activity

**Feature**: the user asked for the standalone Inventory screen
(follow-up 2's session, and the 2026-08-17-earlier one before it) to be
retired — its Pickup/Incoming data folded into Home's existing
Awaiting Pickup section, Collection into Home's existing Ready for
Collection section, a new Awaiting Arrival section added to Home for
Incoming, and History moved into the Activity Log. Home becomes a pure
summary/dashboard: tapping any pickup, arrival, or collection row now
navigates to a dedicated details page for that order, showing every
field the backing endpoint returns, instead of any list-level row
offering its own inline action.

**Read `docs/API.md` again before touching anything**, per the user's
explicit instruction not to invent data. Confirmed: no endpoint in the
Node Operator's API surface returns rider identity (name/phone) — the
6-digit code the rider reads aloud is the entire handoff protocol —
and no destination-side endpoint returns receiver PII (already
documented in `CollectParcelScreen`'s own header comment, predating
this session). Neither is shown on the new details pages; neither was
invented. See "Not available from the endpoints" below.

**Home (`VendorHomeScreen`) rewritten** — same tab mechanism
(`ParcelFilterTabs`, kept per explicit user preference over a stacked-
sections dashboard layout), three tabs instead of the previous
Awaiting Pickup/Ready for Collection/All:
- **Awaiting Pickup** — unchanged filter (`isAwaitingPickup`), but rows
  (`NodeOrderRow`) are now pure navigation — no more inline
  `HandoffOrderList` expand (that was this session's *previous*
  iteration, now superseded again by the details-page requirement).
- **Awaiting Arrival** — new tab, `isAwaitingArrival` (`in_transit`,
  destination side) — the exact filter Inventory's "Incoming" tab used,
  now visible on Home for the first time. Deliberately **excluded**
  from "occupied" capacity — the parcel isn't physically on the
  premises yet, only the on-its-way state is now visible.
- **Ready for Collection** — `CollectionSummaryList` (new), the two
  sub-groups the old `CollectionList` had (needs check-in / ready),
  same grouping and copy, but every row is a plain link now — no more
  inline "Check In & Email Receiver" button, since that action moved to
  the details page.
- The old "All" tab is gone — its role (an unfiltered overview) is now
  Activity's Order History tab, not a fourth Home tab.

**New details page: `HandoffDetailScreen`** (`/vendor/handoff/[orderId]`,
`ROUTES.vendorHandoffDetail`) — one route for both Awaiting Pickup and
Awaiting Arrival, direction inferred from the order's own `myRole`
rather than two near-identical routes. Shows every field
`NodeOrderSummary` has (tracking code, status, parcel description/size,
origin/destination Node names, `myRole`, placement date) plus the
rider-code entry, reusing `useConfirmHandoff` — the same hook, same
`POST /handoffs/orders/:id/confirm-handoff` call, same copy Inventory's
Pickup/Incoming tabs used, just driven by a `useEffect` that selects
this one order (`selectHandoffType` + `selectOrder`) instead of a
row-click in a list. The code panel only renders while
`isAwaitingPickup`/`isAwaitingArrival` is still true for the loaded
order — a stale link (already confirmed, already progressed) falls
back to a read-only view instead of offering an action the server
would 404/409 on. New hook: `useNodeOrder(orderId)`
(`use-my-node-orders.ts`) — finds the order in the already-cached
`GET /handoffs/my-node/orders` list, no separate fetch.

**`CollectParcelScreen` extended, not replaced** — it's now the Ready
for Collection details page for *both* of that tab's sub-states, not
just "ready":
- **Needs check-in** (`needsIntake`) — new branch: full parcel info +
  the "Check In & Email Receiver" action (`useParcelIntake`, the same
  hook Inventory's Collection tab used for its one-tap button — this is
  the "Send" action the task asked for). On success, the screen falls
  through to the "ready" branch on its own: `useParcelIntake`'s success
  invalidates `GET /handoffs/my-node/orders`, the order's status flips
  server-side, `useAwaitingCollectionParcel` re-derives from the
  refetched cache, and the same component re-renders into the other
  branch — no manual redirect needed.
- **Ready** (`isReadyForCollection`) — unchanged behavior (code entry +
  identity attestation + resend), but its info card is enriched with
  the same parcel/route/status details the needs-check-in branch and
  the new pickup/arrival details page show — previously it showed only
  the tracking code, which undersold "complete collection information."
- Three `ROUTES.vendorInventory` references (two "back" buttons, one in
  the success screen) fixed to `ROUTES.vendorHome` — the route they
  pointed at no longer exists. The success screen's two buttons
  ("Back to Counter" / "Dashboard", both effectively the same
  destination now) collapsed to one ("Back to Dashboard").

**History moved into Activity, not duplicated**: `ActivityScreen` gains
a second tab (`ActivityTabs`, new — same pill style as
`ParcelFilterTabs`) — "Activity Log" (unchanged, `GET
/notifications/user/{userId}`) and "Order History" (`OrderHistoryList`,
relocated verbatim from the deleted `HistoryList.tsx`, fed by
`useMyNodeOrders()`). This is a second data source sharing one screen,
same pattern Inventory itself used for its four tabs. `useMyNodeOrders()`
is already fetched by Home and the handoff details page elsewhere in
the app — TanStack Query dedupes by query key, so opening this tab
doesn't fire an extra request within the 30s `staleTime` unless the
cache has actually gone stale.

**Inventory deleted, not hidden** — `src/modules/vendor/components/inventory/`
(`InventoryScreen.tsx`, `InventoryTabs.tsx`, `HandoffOrderList.tsx`,
`CollectionList.tsx`, `HistoryList.tsx`, `index.ts`) and
`src/app/(vendor)/vendor/inventory/` are both gone. `VENDOR_NAV_ITEMS`
no longer has an "Inventory" entry — Home is now the one place an
operator sees everything at their counter, which is exactly what
Inventory duplicated rather than fed. `ROUTES.vendorInventory` removed
from `constants.ts`; `ROUTES.vendorHandoffDetail` added in its place.

**Not available from the endpoints** (per the user's explicit
instruction to inspect real responses before assuming anything, and
not invent what isn't there):
- **Rider details** (name, phone, any identifier) — no endpoint in the
  Node Operator's API surface returns this. `NodeOrderSummary`,
  `HandoffOrderPreview`, and the `confirm-handoff`/`request-code`
  responses carry no rider field at all; the 6-digit code is the entire
  protocol. `HandoffDetailScreen` does not show a "rider" section.
- **Collection person's name** — no destination-side endpoint returns
  receiver PII (already documented in `CollectParcelScreen`'s header
  comment before this session touched it). `identityConfirmed` remains
  what it always was: an attestation the operator made about a
  conversation, not a verification against anything on screen.
- **Per-status-transition timestamps** (when a parcel was picked up,
  arrived, checked in, or collected) — `NodeOrderSummary` carries only
  `createdAt` (order placement). `HandoffDetailScreen` and the enriched
  `CollectParcelScreen` info card both label it "Placed", not "Arrived"
  or "Checked in", for the same reason `OrderHistoryList` already did.

**Files changed**:
- New: `src/modules/vendor/components/handoff/HandoffDetailScreen.tsx`;
  `src/app/(vendor)/vendor/handoff/[orderId]/page.tsx`;
  `src/modules/vendor/components/dashboard/CollectionSummaryList.tsx`;
  `src/modules/vendor/components/activity/ActivityTabs.tsx`,
  `OrderHistoryList.tsx`.
- Rewritten: `src/modules/vendor/components/dashboard/VendorHomeScreen.tsx`,
  `NodeOrderRow.tsx` (simplified — always links to the new details
  page), `ParcelFilterTabs.tsx` (new tab set);
  `src/modules/vendor/hooks/use-node-dashboard.ts` (adds
  `awaitingArrival`, drops the old "all" combined list);
  `src/modules/vendor/components/activity/ActivityScreen.tsx`.
- Extended: `src/modules/vendor/components/collection/CollectParcelScreen.tsx`
  (needs-intake branch, enriched info card, route fixes);
  `src/modules/vendor/hooks/use-my-node-orders.ts` (adds
  `useNodeOrder(orderId)`).
- `src/core/config/constants.ts` — `vendorInventory` removed,
  `vendorHandoffDetail` added.
- `src/components/layout/nav-config.ts` — "Inventory" removed from
  `VENDOR_NAV_ITEMS`, `ArchiveIcon` import dropped (now unused there).
- Barrels updated: `dashboard/index.ts`, `handoff/index.ts`,
  `activity/index.ts`.
- Deleted: `src/modules/vendor/components/inventory/` (whole
  directory), `src/app/(vendor)/vendor/inventory/` (whole directory).
- Docs: this entry; `docs/ARCHITECTURE.md`'s Vendor flow block;
  `docs/API_INTEGRATION_STATUS.md`'s `my-node/orders`/`intake`/
  `confirm-handoff` rows; `docs/HANDOFF.md`'s "Current objective".
  **`docs/API.md` intentionally untouched** — read-only per the user's
  explicit instruction; it's the backend/project owner's file.

**Verification**: `npx tsc --noEmit` clean, `npx eslint` clean on every
file touched, a full-repo grep confirms no remaining reference to
`vendorInventory`, `InventoryScreen`, `InventoryTabs`,
`HandoffOrderList`, or the old `CollectionList`/`HistoryList` anywhere
in `src/` (only historical mentions in doc comments describing what was
retired). Per the user's explicit instruction, **the app was not run,
built, or tested this session** — no dev server, no `next build`, no
test suite. `npx tsc --noEmit` and `npx eslint` were treated as static
verification, not "running" the app, and were run for the same reason
they're run in every other session in this log. Nothing here has been
seen rendered in a browser.

---

## 2026-08-17 (follow-up 4) — Activity Log and Order History collapsed back into one list

**Feature**: follow-up 3 gave `ActivityScreen` two tabs — the original
notification-backed "Activity Log" and a new "Order History" tab for
the data moved off the retired Inventory screen. The user asked for
one list instead: reuse the Activity Log's card (`ActivityLogItem`)
to render the history data, drop the tab switcher entirely.

**`ActivityScreen` rewritten**: no more `ActivityTabs`/tab state. The
single list is now sourced from `useMyNodeOrders()`
(`GET /handoffs/my-node/orders`) instead of `useActivityLog()`
(`GET /notifications/user/{userId}`) — a genuine data-source swap, not
just a rendering change. A new local mapper,
`mapOrderToActivityEntry()`, turns each `NodeOrderSummary` into an
`ActivityLogEntry` so the existing `ActivityLogItem` component renders
it unchanged:
- `title` = tracking code, `description` = parcel description +
  destination/origin (arrow direction from the real `myRole` field,
  same convention `OrderHistoryList`/`NodeOrderRow` already used).
- `type` (drives the icon) is chosen from `myRole` alone —
  `handoff_to_rider` for origin-side orders, `parcel_checked_in` for
  destination-side — a representative icon for a real, known fact
  (which side of custody), not an invented event.
- `tag` = the order's status label, via a new exported
  `getHandoffStatusLabel()` (`HandoffStatusPill.tsx`) — reuses that
  component's own `STATUS_CONFIG` map so the tag text can never drift
  from what the pill itself would say, instead of duplicating a
  second status→label table.
- `isException` is always `false` — orders have no exception/flag
  concept in the real API, only a status, so nothing here claims one.

**`ActivityTabs.tsx` and `OrderHistoryList.tsx` deleted** — both were
introduced in follow-up 3 earlier the same day and are fully superseded
by this change; neither has a remaining caller.

**The notification-backed integration is left in place, not deleted.**
`useActivityLog()` and `vendorService.listActivity()`
(`GET /notifications/user/{userId}`) now have no caller anywhere in the
app, but unlike the dead-endpoint code deleted in earlier sessions
(`/nodes/operator/inventory`'s old consumers, the retired Inventory
screen), this is a *real, working* integration losing its only call
site — a different situation from cleaning up something broken.
Deleting it would also flip `GET /notifications/user/{userId}` from
integrated back to unintegrated in `API_INTEGRATION_STATUS.md`'s
bookkeeping, which felt like a call for the user to make explicitly
rather than a side effect of a UI request. Flagged in both the service
file's header comment and here — tell me if you want it removed too,
or reserved for a future notifications surface.

**Files changed**:
- Rewritten: `src/modules/vendor/components/activity/ActivityScreen.tsx`.
- Deleted: `src/modules/vendor/components/activity/ActivityTabs.tsx`,
  `OrderHistoryList.tsx`.
- `src/modules/vendor/components/handoff/HandoffStatusPill.tsx` — new
  exported `getHandoffStatusLabel()`.
- Barrels: `activity/index.ts` (drops the two deleted exports),
  `handoff/index.ts` (adds `getHandoffStatusLabel`).
- `src/core/api/services/vendor.service.ts` — header comment updated to
  note `listActivity()` is now unused, not deleted.
- Docs: this entry; `docs/ARCHITECTURE.md`'s `vendor/activity` line and
  the Inventory-retirement note below it; `docs/HANDOFF.md`'s "Current
  objective". **`docs/API.md` untouched**, per standing instruction.

**Verification**: `npx tsc --noEmit` and `npx eslint src` both clean
across the whole repo; grep confirms no remaining reference to
`ActivityTabs`/`OrderHistoryList` anywhere in `src/`. Per standing
instruction, the app was not run, built, or tested this session.

---

## 2026-08-17 (follow-up 5) — Dummy activity toast removed, icon reflects real status

**Feature**: the Activity screen's top card (`RiderHandoffToast`) was
hardcoded demo data — a fixed "LC-482TX picked up by Rider — Tunde A.,
2 mins ago" — sitting above the real, now-live Activity Log. Asked to
remove it and let the real most-recent activity occupy that top spot,
plus have each entry's icon reflect what actually happened rather than
a coarse origin/destination split.

**`RiderHandoffToast.tsx` deleted**, not just unused — it was
fabricated data, and the whole point of the last two sessions was
replacing invented/mocked content with real `GET /handoffs/my-node/orders`
data. `GET /handoffs/my-node/orders` is already documented newest-first
per docs/API.md and `ActivityScreen` never re-sorted it, so removing
the toast is sufficient on its own: the real most-recent order is now
the first row on the screen, in the exact position the dummy card used
to occupy.

**Icon selection widened from a 2-way split to a status-driven one** —
`activityEntryType()` (new, `ActivityScreen.tsx`) switches on the
order's real `status` field rather than just `myRole`:
`parcel_received_at_origin`/`rider_assigned`/`arrived_at_destination` →
`batch_received` (ArchiveIcon — just landed at this Node, from the
consumer or a rider); `in_transit` → `handoff_to_rider` (TruckIcon —
with a rider right now); `ready_for_collection` → `parcel_checked_in`
(PackageIcon); `completed` → `parcel_released` (PackageIcon). No new
icon or `ActivityEventType` member — every case maps onto the existing
set from `ActivityLogItem.tsx`'s `ICON_MAP`. Falls back to the
previous `myRole`-based split for `awaiting_drop_off` and any status
this build doesn't recognize yet.

**Files changed**: `src/modules/vendor/components/activity/ActivityScreen.tsx`
(new `activityEntryType()`, `RiderHandoffToast` import/usage removed);
deleted `RiderHandoffToast.tsx`; `activity/index.ts` barrel updated.

**Verification**: `npx tsc --noEmit` and `npx eslint src` clean across
the repo; grep confirms no remaining reference to `RiderHandoffToast`
outside one explanatory doc comment. Per standing instruction, the app
was not run, built, or tested this session.

---

## 2026-08-20 — Full endpoint/mock audit, Revenue Split feature, Vendor→Node rename

**Feature**: a complete re-audit of every API call in the codebase
against the current `docs/API.md` (44 documented endpoints), a
mock-data sweep, and — at the user's explicit request mid-session — a
full rename of the "Vendor" naming convention to "Node"/"Node Operator"
throughout the codebase (files, directories, types, services, hooks,
routes, and user-facing copy), since the backend's actual role is
`node_operator` and "Vendor" was always just this app's internal label
for the same thing.

**Endpoint audit findings** — every literal path string in
`core/api/endpoints.ts` checked against `docs/API.md`'s 44 documented
routes:

- **`/nodes/operator/inventory`** — undocumented, confirmed 404ing on
  the deployed backend (already known, see 2026-08-17's entry). Its
  only remaining call site, `vendorService.listParcels()`, backed the
  Flag Issue screen (`FlagIssueScreen`, `use-parcel-detail.ts`,
  `/vendor/parcels/[parcelId]/flag`) — which turned out to have **zero
  nav entries anywhere in the app** (fully unreachable except by typing
  the URL), and whose own submit action
  (`flagParcel()`) threw `NOT_IMPLEMENTED` unconditionally regardless.
  Deleted the whole feature: screen, route, both hooks, the service
  methods (`listParcels`, `flagParcel`, `mapInventoryResponse`), the
  endpoint constant, `ROUTES.vendorFlag`, and the now-orphaned
  `NodeParcel`/`FlagReason`/`FlagParcelPayload`/`ParcelNodeStatus`/
  `ShelfLocation`/`ReleaseParcelPayload` types and
  `NodeParcelStatusBadge` component.
- **`/corporate-ops/staff/elevate-superadmin`** — undocumented (the
  role enum has no `super_admin` concept at all per `API.md`), already
  flagged as "unconfirmed" in `docs/HANDOFF.md`. Removed the whole
  elevation form from `SuperAdminScreen` (Admin → Settings), replaced
  with an Admin-facing "isn't available yet" notice; deleted
  `adminService.elevateSuperAdmin`, `use-elevate-super-admin.ts`,
  `ElevateSuperAdminPayload`, and `ENDPOINTS.corporateOps`. The
  overview stat cards (still `NOT_IMPLEMENTED`, a separate real gap)
  are untouched.
- **`/maps/rider/telemetry-ping`** and **`/maps/track/:code`** —
  neither documented, and neither actually called from anywhere in the
  app (`sendTelemetryPing()` existed on `riderService` but had no
  caller — `setAvailability()`'s online/offline toggle never invoked
  it, despite the file's own header comment implying it did). Deleted
  both, plus the whole `ENDPOINTS.maps` group and the dead commented-out
  mock block in `rider.service.ts` that referenced them.
- **`/admin/rider-earnings`** — undocumented. `docs/API.md` instead
  documents `GET /earnings/mine` (Rider), `GET /earnings/my-node`
  (NodeOperator), and a whole `admin/revenue-split` group
  (`POST`/`GET /admin/revenue-split`, `GET .../entries`,
  `PATCH .../entries/:id/mark-paid`) that the previous session's
  `RiderEarningsScreen` (2026-08-17) was never built against. Removed
  `RiderEarningsScreen`/`use-rider-earnings.ts`/its route entirely, and
  built the three real replacements (see below).
- **`franchiseNodes.onboardOperator`, `nodes.onboard`,
  `nodes.updateStatus`** — all three undocumented *and* dead (zero call
  sites anywhere). Deleted as no-op cleanup.
- **`/auth/consumer/request-otp`, `/auth/consumer/request-login-otp`**
  — undocumented (the current `API.md` only has plain
  `POST /auth/register`/`POST /auth/login`, no OTP step for Consumer).
  Live, load-bearing call sites for Consumer signup/login. **Flagged to
  the user, who explicitly asked to leave this alone** ("already
  working") rather than rebuild the auth flow — not touched this
  session. Still listed as an open item in
  `docs/API_INTEGRATION_STATUS.md`'s Inconsistencies section.

**New real integrations — Earnings / Revenue Split**: `docs/API.md`'s
"Earnings (revenue split)" section (every `completed` order's fee is
split rider/origin-Node/platform per an Admin-configured ratio) had
zero frontend integration before this session.

- New shared `core/types/earnings.types.ts` — `MyRevenueSplitEntry`
  (the shape `GET /earnings/mine` and `GET /earnings/my-node` both
  return), `RevenueSplitRatio`/`CreateRevenueSplitRatioPayload`,
  `AdminRevenueSplitEntry`/`AdminRevenueSplitEntryFilters`,
  `MarkEntryPaidResult`.
- **Rider**: `riderService.listMyEarnings()` (`GET /earnings/mine`) is
  new; `getEarningsSummary()` (previously `NOT_IMPLEMENTED` — no
  endpoint existed before) now reduces the entry list client-side into
  today/total earnings+deliveries — there's no server-side "today"
  filter or aggregate. Powers the Home dashboard's stat cards and the
  Profile stat row, both previously permanently stuck in a loading/
  zero state. **Dropped the fabricated `rating` field** from
  `RiderEarningsSummary` — no rating concept exists anywhere in the
  real API (only a KYC `rating_screenshot` upload, unrelated) — and
  removed the "Rider Rating" stat card from `RiderProfileScreen`
  rather than keep showing an invented number. Also rebuilt the
  "Earnings" nav tab (`/rider/deliveries`, previously "My Deliveries")
  to list these entries instead of the old `getJobHistory()` job-list
  concept, which has no real backing endpoint at all (declined/expired
  jobs with a `payout` field — `GET /handoffs/my-orders` carries
  neither) and stays `NOT_IMPLEMENTED`; `use-job-history.ts`/
  `DeliveryHistoryRow.tsx`/`MyDeliveriesScreen.tsx` are renamed to
  `use-my-earnings.ts`/`EarningsEntryRow.tsx`/`MyEarningsScreen.tsx`
  and rewritten around the real entry shape. Also fixed a pre-existing
  **double-₦ currency bug** in `EarningsStatCards`/`RiderProfileScreen`
  (`formatCurrency()` already prepends `₦`; both places prepended a
  second one).
- **NodeOperator**: `nodeService.getMyNodeEarnings()`
  (`GET /earnings/my-node`) is new — this Node's own revenue-split
  entries (only present for orders where this Node was the *origin*).
  New `NodeEarningsScreen` (`/node/earnings`), reached from Node
  Profile — no nav-bar slot added (all four are already spoken for),
  same pattern as "Node Setup" being a Profile row rather than a tab.
- **Admin**: `adminService.createRevenueSplitRatio` /
  `getRevenueSplitRatios` / `getRevenueSplitEntries` /
  `markRevenueSplitEntryPaid` are new. New `RevenueSplitScreen`
  (`/admin/revenue-split`) replaces the deleted `RiderEarningsScreen` in
  both the sidebar nav (relabeled "Revenue Split") and route slot —
  shows the current split ratio, an append-only "Set Ratio" form (same
  inline-card pattern as `AddPricingRuleForm`), and a
  partyType/payoutStatus-filterable entries table with a "Mark Paid"
  action per pending row.

**Mock-data audit**: `src/core/mocks/` had six files. `mock-vendor.ts`,
`mock-deliveries.ts`, `mock-nodes.ts`, `mock-rider.ts`,
`mock-activity.ts` were all either fully unreferenced (`mock-rider.ts`
had zero importers, live or commented) or referenced only inside dead
commented-out mock-service blocks and one live-but-now-removed fallback
(`vendor.service.ts`'s `mapInventoryResponse()` used to default to
`MOCK_NODES[1]` when the real inventory response was missing a `node`
field — gone along with the rest of the Flag Issue feature above).
Deleted all five. **`mock-utils.ts` kept** — `generateId()` is a real,
still-used ID-generation utility (`node.service.ts`'s
`mapNotificationToActivity()` fallback id), not fake data; renaming/
moving it out of the `mocks/` folder felt like unrelated churn, flagged
here instead. Also deleted the large dead commented-out mock-service
blocks in `node.service.ts`/`rider.service.ts` (the mock/real API
switch this scaffolding was for has been dead since before this
project's AI-assisted work began — see `PROJECT_CONTEXT.md`) — these
were literal "mock service implementations" sitting in the file per
the standing instruction to remove them, not just unused imports.
Also deleted `SurgeAlertBanner.tsx` (Rider Home) — a hardcoded fake
"Downtown Zone is currently surging" card, already commented out of
use but left in the codebase; removed the dead file, its barrel
export, and the commented-out render call.

**Vendor→Node rename** (user's explicit mid-session request — "vendor
and node describe the same thing, use node"): every file, directory,
type, service, hook, route, and nav label with "Vendor" in the name is
renamed to "Node"/"Node Operator", checked against the pre-existing
"Node" naming (Pickup Station entities — `LocoomoNode`/`PickupNode`/
`nodesService`/`adminNodes`/`NodeMapView`) for collisions before each
rename:

- `src/modules/vendor/` → `src/modules/node/`; `src/app/(vendor)/` →
  `src/app/(node)/`, its `vendor/` route segment → `node/`;
  `src/app/vendor-scan/` → `src/app/node-scan/`.
- `core/api/services/vendor.service.ts` → `node.service.ts`,
  `vendorService` → `nodeService` (distinct from the pre-existing,
  plural `nodesService` — the public Nodes directory service, a
  different thing).
- `core/types/vendor.types.ts` → `node.types.ts`; its
  `VendorNodeProfile` type was already fully dead (only reachable
  through the just-deleted `mapInventoryResponse()`) — deleted rather
  than renamed.
- `VendorHomeScreen`/`VendorProfileScreen`/`VendorNodeSetupScreen` →
  `NodeHomeScreen`/`NodeProfileScreen`/`NodeSetupScreen`;
  `use-vendor-auth`/`use-vendor-node`/`use-vendor-node-setup` →
  `use-node-auth`/`use-node-profile`/`use-node-setup`; caught one
  broken relative import (`use-node-dashboard.ts` still pointed at the
  old `./use-vendor-node` filename) that the path-based rename pass
  missed since it wasn't an `@/modules/...` absolute import.
  `components/node-setup/` → `components/setup/` (was
  `modules/node/components/node-setup/`, redundant once the module
  itself is already "node").
- `VENDOR_NAV_ITEMS` → `NODE_NAV_ITEMS`; every `ROUTES.vendor*` /
  `QUERY_KEYS.vendor*` → `ROUTES.node*` / `QUERY_KEYS.node*`
  (`/vendor/home` → `/node/home`, `/vendor/node-setup` → `/node/setup`,
  etc. — URL paths changed too, per the user's explicit "everything"
  scope, not just internal identifiers).
- User-facing copy: `NodeProfileScreen`'s "Shop Owner" label →
  "Node Operator"; Admin nav's "Rider Earnings" → "Revenue Split" (see
  above). Left a handful of pure-comment "vendor" mentions untouched at
  the user's direction mid-sweep (`CreateAccountScreen.tsx`,
  `roles.ts`, `use-geolocation.ts`, `(rider)/layout.tsx` all still have
  one stale comment each referencing the old name/path — harmless,
  no functional effect).

**Files changed**: too many to list individually (the rename alone
touched ~85 files via directory moves + `git mv` + scoped find/replace,
verified with a full-repo `grep -rli vendor` sweep after each pass).
See the section above for the shape of it; `git status`/`git diff
--stat` against this session's start has the exhaustive list.

**Verification**: `npx tsc --noEmit` clean, `npx eslint src` clean,
`npx next build` succeeds (44 routes, including the new
`/admin/revenue-split` and `/node/earnings`) — a full production build
was run this session, not just static checks, specifically because a
rename this size is exactly the kind of change a type-checker alone
can miss (e.g. Next.js's route-group folder resolution). A full-repo
grep confirms no remaining `@/modules/vendor` or `vendor.service`/
`vendor.types` import paths anywhere. The app was not run in a browser
against a live backend this session — the new Revenue Split/Earnings
screens are built strictly from `docs/API.md`'s documented contract
and share the same "not live-verified" caveat as every other Admin/
NodeOperator/Rider screen in this project (see
`docs/HANDOFF.md`).

---

## 2026-08-21 (Rider Home — Available Jobs preview section)

**Feature**: Rider Home (`/rider/home`) gains a read-only preview of the
job board. The explicit product framing: Home should show *some* jobs
so a rider gets a sense of what's out there at a glance, but *viewing*
the full list or *accepting* a job stays a Jobs-screen-only action —
Home never gets its own Accept control. Read `docs/ARCHITECTURE.md`,
`docs/HANDOFF.md`, `docs/IMPLEMENTATION_LOG.md`,
`docs/API_INTEGRATION_STATUS.md`, `docs/API.md`, and the existing Rider
module (`RiderHomeScreen`, `AvailableJobsScreen`, `AvailableJobCard`,
`use-available-orders.ts`) before writing any code, per the task's
explicit instruction.

**No backend/API change** — `GET /handoffs/available-orders` was
already ✅ fully integrated (see `docs/API_INTEGRATION_STATUS.md`'s
Handoffs section) via `riderService.listAvailableOrders` /
`useAvailableOrders`. This session adds a second call site at a smaller
page size, not a new endpoint.

**Files created**:
- `src/modules/rider/components/dashboard/AvailableJobsPreview.tsx` —
  new. Calls `useAvailableOrders(3)` (the same hook `AvailableJobsScreen`
  uses, just `limit=3` instead of the default 20) and renders:
  - A "Jobs near you" header with a "View all" link → `ROUTES.riderAvailableJobs`.
  - Up to 3 compact `Card` rows (origin → destination, parcel size,
    distance when `isSortTrustworthy` — same trustworthy-distance
    caveat `AvailableJobsScreen` already observes, reusing
    `formatDistanceMeters`/`parcelSizeLabel` from
    `modules/rider/lib/handoff-format.ts` rather than re-deriving them).
  - A "+N more waiting — view all to accept" line when `total` exceeds
    the 3 shown.
  - A 2-row skeleton while loading, and a quiet "No jobs available right
    now" `EmptyState`-style card on a genuine empty list.
  - Returns `null` on a real fetch error (e.g. a `403 RIDER_NOT_ACTIVE`
    that slipped through the mount gate below) instead of rendering a
    second copy of `AvailableJobsScreen`'s `ErrorAlert` — Home is a
    summary surface, not a duplicate error UI.
  - Every row is wrapped in its own `Link` to `/rider/available-jobs`,
    not a per-order route — there is no detail route for an unclaimed
    order to deep-link into (the accept action itself needs the fuller
    `AvailableJobCard` context: full addresses, waiting-since, the
    at-capacity/remaining-capacity messaging), so a tap always lands on
    the real Jobs screen rather than attempting a shortcut accept from
    an under-informed summary card.
- `src/modules/rider/components/dashboard/index.ts` — barrel-exported
  `AvailableJobsPreview`.

**Files changed**:
- `src/modules/rider/components/dashboard/RiderHomeScreen.tsx` — the
  previous unconditional "View Job Offers" banner (shown whenever
  `availability === "online"`) is now conditional on the rider also
  being verification-`active`:
  - `online` + `active` → renders `AvailableJobsPreview`.
  - `online` + not yet `active` → unchanged old banner, which still
    routes to `/rider/available-jobs`'s own "Verification required"
    gate. This preserves the exact previous behavior for an
    unverified-but-online rider rather than fetching a list request
    that's guaranteed to `403 RIDER_NOT_ACTIVE`.
  - `offline` → unchanged "You're offline" card.

**Design decisions**:
- Gated the preview's mount (not just its rendering) on
  `verification?.status === "active"`, mirroring the exact gate
  `AvailableJobsScreen` itself enforces before calling the same
  endpoint — this avoids firing a doomed request from Home for any
  rider who hasn't cleared KYC yet, rather than relying solely on the
  component's own `error → null` fallback to hide the failure.
- Deliberately did not reuse `AvailableJobCard` as-is for the preview
  rows — that component's whole reason for existing is the Accept
  button and its accompanying capacity/loading state wiring, none of
  which belongs on a passive Home summary. Built a smaller row instead
  rather than threading a `hideAcceptButton`-style prop through the
  real screen's card.
- Capped at 3 rows with no pagination controls on Home — a preview
  that grows its own "next page" UI stops being a preview. Pagination
  stays exclusively on `AvailableJobsScreen`.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint`
on every changed/new file (clean), a cleared-`.next` `npx next build`
(clean — 44 routes, `/rider/home` grew from 157 B to 3.99 kB reflecting
the new component; every other route's size is unaffected, in
particular `/rider/available-jobs` itself). Dev-server smoke test:
`curl`'d both `/rider/home` and `/rider/available-jobs`, both return
`200` with the expected `AuthGuard` loading-spinner markup (no session
in this environment). **Not performed**: browser verification against
a live backend with a real, verified, online Rider account and actual
unclaimed orders near a Node — the populated-preview, "+N more", empty,
and skeleton states are implemented per the same documented contract
`AvailableJobsScreen` already uses, but haven't been seen rendered
against real data. Same standing caveat as most Rider-module sessions
in this log.

**Remaining/related work, unchanged by this session**: everything
`docs/API_INTEGRATION_STATUS.md`'s Handoffs section already flags for
`GET /handoffs/available-orders` (no rider-facing payout figure on this
endpoint, `useGeolocation`'s Lagos-centre fallback) applies identically
to this new preview call site, since it's the same query.

---

## 2026-08-21 (later — Profile off every Sidebar/BottomNav, onto a new RootTopBar; Admin gets a Profile screen + a "More" nav sheet)

**Feature**: explicit ask — every role's navbar should show the logo on
the left and a Profile button on the right (tapping it opens that
role's Profile screen), with "Profile" removed as a tab from both
`Sidebar` (desktop) and `BottomNav` (mobile), for all four roles: User,
Node Operator, Rider, Admin. Clarified scope with the user before
touching anything, since `TopBar` is shared across dozens of detail
screens, not just the tab-bar destinations: (1) the new bar applies
only to each role's root/tab screens, not every screen; (2) Admin
should get a real, new Profile screen (it had none — only "Settings", a
different destination) rather than pointing "Profile" at Settings; (3)
the logo shows mobile-only — desktop keeps just the Profile button,
since `Sidebar` already carries the logo there. A fourth point came out
of the same clarification round: Admin's `ADMIN_NAV_ITEMS` has nine
entries, too many for a mobile tab bar, so `BottomNav` should show 4
and fold the rest into a "More" pull-up sheet.

**Files created**:
- `src/components/layout/RootTopBar.tsx` — new shared component. Props:
  `profileHref` (required) and `hideOnDesktop` (optional, default
  `false`). Renders a sticky header: logo + "LOCOOMO" wordmark, `md:hidden`
  (Sidebar already shows the brand mark on desktop); a Profile button
  (`ml-auto` so it's right-aligned regardless of whether the logo half
  is rendered) — an initials-avatar `Link` styled like every existing
  Profile screen's own avatar (`bg-status-info-bg text-brand-blue`),
  falling back to a generic `UserIcon` if `useCurrentUser()` returns
  `null`. `hideOnDesktop` wraps the whole header in `md:hidden` — Admin
  passes this since `AdminTopBar` (already existed, desktop-only,
  mounted once in `AdminShell`) is that role's desktop bar; without the
  prop the two would stack.
- `src/modules/admin/components/profile/AdminProfileScreen.tsx` +
  `index.ts` — new. Admin's first-ever Profile screen: avatar (initials,
  `admin-accent` colors to match `AdminTopBar`/`AdminSidebar`), name,
  `"{role} account"` line, email/phone rows, a "Log Out" button. Built
  as its own inline `useMutation(() => authService.logout())` +
  `useAuthStore` (same shape `AdminSidebar`'s existing logout button
  already uses) rather than a shared hook — no `useAdminAuth().logout`
  existed to reuse, and building one just for this would have been a
  detour from the actual ask. Modeled directly on the other three
  roles' `ProfileScreen`/`RiderProfileScreen`/`NodeProfileScreen` (same
  avatar/Row pattern) for consistency.
- `src/app/(admin)/admin/profile/page.tsx` — new route, inside the
  `(admin)` group (covered by the existing `AuthGuard(allowedRoles=["admin"])`).

**Files changed**:
- `src/core/config/constants.ts` — added `ROUTES.profile` ("/profile" —
  formalizes what `nav-config.ts` used to hardcode as a literal string)
  and `ROUTES.adminProfile` ("/admin/profile", new route).
- `src/components/layout/nav-config.ts` — removed the `Profile` entry
  from `USER_NAV_ITEMS`, `NODE_NAV_ITEMS`, `RIDER_NAV_ITEMS` (down to 2,
  3, and 4 items respectively — `ADMIN_NAV_ITEMS` never had one, Admin's
  account destination was always the separate "Settings" item). Removed
  the now-unused `UserIcon` import. `Sidebar`/`BottomNav` both just
  render whatever `items` array they're given, so deleting these three
  entries was the entire fix for "remove Profile from Sidebar/BottomNav"
  — neither component needed a code change for that half of the ask.
- `src/components/layout/index.ts` — barrel-exported `RootTopBar`.
- `src/components/layout/BottomNav.tsx` — rewritten to support overflow.
  New `moreItems` prop (destinations with no tab slot of their own —
  Admin's pinned Settings) and a `MAX_VISIBLE_TABS = 4` constant. When
  `items.length > 4`, the first 3 render as normal tabs and a 4th "More"
  button (existing `DotsIcon`) appears, active-highlighted whenever the
  current route matches anything in the overflow; tapping it opens a
  new `MoreNavSheet` (same file) — a pull-up sheet, same overlay +
  drag-handle pattern as `VerificationReminderSheet`, listing every
  overflow item (plus `moreItems`) as a tappable row that closes the
  sheet on navigation. When `items.length <= 4` (User, Node, Rider, all
  post-Profile-removal), the component renders byte-for-byte the same
  as before — no "More" tab appears, no behavior change.
- `src/components/layout/AdminShell.tsx` — passes
  `moreItems={[ADMIN_SETTINGS_NAV_ITEM]}` to `BottomNav`, so Settings —
  previously pinned only in the desktop-only `AdminSidebar`, with zero
  mobile entry point — is reachable on mobile too, folded into the same
  "More" sheet as the six `ADMIN_NAV_ITEMS` that don't fit in the
  visible four.
- `src/components/layout/AdminTopBar.tsx` — the previously-decorative
  avatar (`div`) is now a `Link` to `ROUTES.adminProfile` (`aria-label="Profile"`).
  This is the desktop half of "Profile on the right" for Admin, since
  Admin's own root screens render `RootTopBar` with `hideOnDesktop` (no
  duplicate bar).
- Thirteen root screens across all four roles now render `RootTopBar`
  in place of the old per-screen `TopBar`:
  - **User**: `DashboardScreen.tsx` (had no top bar at all before —
    `RootTopBar` is new there, not a swap), `TrackListScreen.tsx`.
  - **Node**: `NodeHomeScreen.tsx` (all five render branches — loading,
    not-onboarded, error, waiting-for-approval, and the active happy
    path), `ActivityScreen.tsx`.
  - **Rider**: `RiderHomeScreen.tsx`, `AvailableJobsScreen.tsx`,
    `ActiveDeliveriesScreen.tsx`, `MyEarningsScreen.tsx`.
  - **Admin** (`RootTopBar ... hideOnDesktop`, since `AdminTopBar`
    already covers desktop): `AdminDashboardScreen.tsx`,
    `OrderListScreen.tsx`, `NodeNetworkScreen.tsx`,
    `TeamManagementScreen.tsx`, `ApprovalsScreen.tsx`,
    `PricingScreen.tsx`, `DisputeCenterScreen.tsx`,
    `AnalyticsScreen.tsx`, `RevenueSplitScreen.tsx`.
  Four of these (`TrackListScreen`, `ActivityScreen`, `MyEarningsScreen`,
  and `NodeHomeScreen`'s active-happy-path node-name heading) had an
  in-page `<h1>` duplicating the old `TopBar`'s `title`, but marked
  `hidden md:block` — the mobile view relied entirely on the bar for
  that text. Dropped the `hidden` (and bumped the heading down to a
  `text-[18px]` mobile size, `md:text-[22px]` unchanged) so the title
  isn't silently lost on mobile now that the bar carries no text. Every
  other converted screen already had an always-visible in-page `<h1>` (a
  pattern already consistent across the Admin module in particular), so
  nothing else needed this fix.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint src`
(clean, whole repo, run twice — once before a final small class-syntax
tweak, once after), a cleared-`.next` `npx next build` (clean — 45
routes, up from 44, `/admin/profile` new). Dev-server smoke test:
`curl`'d `/dashboard`, `/track`, `/profile`, `/node/home`,
`/node/activity`, `/node/profile`, `/rider/home`,
`/rider/available-jobs`, `/rider/active-deliveries`,
`/rider/deliveries`, `/rider/profile`, `/admin/dashboard`,
`/admin/profile`, `/admin-login` — all `200`. **Not performed**: no
live session (any role) or a browser was available this session, so
the bar's actual visual layout (logo/profile alignment at both
breakpoints), the initials avatar, and the "More" sheet's open/tap/close
interaction haven't been seen rendered — only compiled, built, and
route-probed. Whoever picks this up next with Claude in Chrome access
should click through at least one of each role before calling this
production-ready.

**Deliberately unchanged**: `Sidebar`'s own account footer (avatar +
name + email at the bottom of the desktop rail) and `AdminSidebar`'s
matching footer + inline logout button — neither was asked to change,
and both still work exactly as before; the new Profile button is an
addition, not a replacement for whatever `Sidebar`'s footer already
did. `TopBar.tsx` itself (the back-button component) is untouched —
every sub-screen (detail pages, forms, the Profile screens themselves)
still uses it exactly as before.

---

## 2026-08-21 (later still — Rider Profile's Vehicle Details shows a real license number; Verification screen shows full details + uploaded image + a "Verified" tag)

**Feature**: two related fixes to the Rider module, both scoped to
data already fetched elsewhere on these same screens — no new
endpoint. (1) `RiderProfileScreen`'s "Vehicle Details" card was backed
by `useRiderProfile()` → `riderService.getProfileDetails()`, a
permanent `NOT_IMPLEMENTED` stub (no vehicle type/plate/verified
endpoint exists anywhere in `docs/API.md`) — so that card had rendered
`"—"`/`undefined` in production the entire time this screen has
existed. Replaced with the one real, license-shaped field that *does*
exist: `licenseNumber` off `GET /riders/me`
(`useRiderVerification`, already called on this same screen for the
Verification card below it — no new fetch). (2)
`RiderVerificationScreen`'s "You're verified" (`status: "active"`)
branch showed a bare `EmptyState` with zero details — the *pending*
branch right next to it already showed employer/license/a document
link, so an approved rider saw strictly less about their own
submission than a still-pending one. Asked to show "all your
verification details, license, company names if available, the image
you uploaded and a small tag saying verified" — implemented for both
states via one shared view.

**Files changed**:
- `src/core/types/rider.types.ts` — deleted `VehicleDetails` and
  `RiderProfileDetails` (fabricated shapes with no backing route —
  `type`/`plateNumber`/`isVerified` never existed anywhere in
  `docs/API.md`, self-admitted in `rider.service.ts`'s own header
  before this session).
- `src/core/api/services/rider.service.ts` — deleted `getProfileDetails()`
  (the `NOT_IMPLEMENTED` stub those types backed) and the now-unused
  `RiderProfileDetails` import. Rewrote the file's header comment: the
  "REAL API GAPS" list drops the vehicle-details bullet (only the
  availability-toggle gap remains) and gained a dated note pointing at
  `licenseNumber`/`GET /riders/me` as what replaced it.
- `src/modules/rider/hooks/use-rider-profile.ts` — **deleted**, not
  deprecated. Its one caller no longer exists (see below), and grepping
  confirmed nothing else in the repo imported it — same
  delete-not-preserve convention this log has used for every other
  fully-superseded hook/store (`rider-jobs.store.ts`, `node-parcels.store.ts`,
  etc.).
- `src/modules/rider/components/profile/RiderProfileScreen.tsx` — the
  "Vehicle Details" card now reads `verification?.licenseNumber` (from
  the `useRiderVerification()` call already on this screen) instead of
  `details?.vehicle.*` (from the deleted `useRiderProfile()`).
  `isLoadingVerification` covers the loading state ("Checking…"); a
  `null`/missing license (self-reported, not backfilled for riders who
  onboarded before the field existed, per `docs/API.md`) shows "Not on
  file" rather than blank. The green "Verified" pill and left-border
  accent now key off `verification?.status === "active"` (a real,
  already-fetched value) instead of the deleted `vehicle.isVerified`
  (which was never real to begin with). Card heading ("Vehicle
  Details") kept as-is per how the task named it, even though its
  content is now a license number, not vehicle specs — there's no
  vehicle-specific data anywhere in the real API to show instead.
- `src/modules/rider/components/verification/RiderVerificationScreen.tsx`
  — `VerificationStatusView` rewritten: one shared layout for both
  `active` and `pending`, differing only in the top banner (icon,
  heading copy, and — active only — a small
  `<ShieldCheckIcon/>` "Verified" pill next to the heading, plus the
  "Go to Dashboard" CTA at the bottom, both previously exclusive to the
  old `active`-only `EmptyState` branch). Below the banner: a
  "Verification Details" card (current employer always; license number
  when present — same two fields the old `pending` branch already had,
  now shared by both states) and an "Uploaded Document" section that
  renders the actual image inline (`<img src={doc.viewUrl}>`, wrapped in
  the same `<a target="_blank">` so tapping still opens the full-size
  original) instead of the old pending-only "View uploaded document"
  text link — closing the "the image you uploaded" part of the ask.
  Extracted a local `Row` helper (icon + label + value) matching the
  one every other Profile screen in this codebase already uses, instead
  of the old branch's ad hoc inline markup repeated per field.
  `EmptyState` import removed (no longer used anywhere in this file);
  `next/image` deliberately not used for the document thumbnail — this
  project has no `images.remotePatterns`/`domains` configured in
  `next.config.ts` for Cloudinary's host, and the URL is already
  signed/short-lived per `docs/API.md`, so a plain `<img>` (with an
  inline eslint-disable for `@next/next/no-img-element`, same as this
  repo's existing pattern for genuinely external, already-hosted
  images) was the direct fix rather than a config change out of scope
  for this task.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint src`
(clean, whole repo — confirms the `no-img-element` disable comment is
sufficient and no stray reference to the deleted
`VehicleDetails`/`RiderProfileDetails`/`getProfileDetails`/
`use-rider-profile` remains anywhere), a cleared-`.next` `npx next
build` (clean after one transient webpack-worker cache miss unrelated
to this change — `rm -rf .next` + rebuild succeeded; 45 routes, sizes
for `/rider/profile` and `/rider/verification` both shifted slightly
reflecting the rewritten markup, no other route affected). Dev-server
smoke test: `/rider/profile` and `/rider/verification` both return
`200`. **Not performed**: no live, verified Rider session was available,
so the populated license number, the "Verified" pill, and the inline
document image have not been seen rendered against real data — same
standing caveat as most Rider-module work in this log. Worth an actual
click-through once a verified test Rider account exists, specifically
to confirm the signed Cloudinary `viewUrl` renders as an `<img>` without
a CORS/hotlink surprise — untested assumption this session, since no
real document URL was available to try.

---

## 2026-08-21 (latest — RouteRail's compact variant: a real progress bar instead of the dashed route line)

**Feature**: design feedback — the Consumer app's delivery/order-summary
cards "aren't cool," specifically the route indicator, which read as a
dashed decorative line rather than an actual progress bar.

**Root cause**: `src/components/ui/RouteRail.tsx` always rendered a
`repeating-linear-gradient` dashed-texture `<div>` on top of the
progress fill, on both of its variants — `compact` (cards) and `full`
(the tracking screen, Admin's Order Details). The component's own
header comment called this "the signature visual motif of the Locoomo
app," so it's an intentional design choice for the dedicated tracking
view — but at card size, on a track only 2px tall, it reads as
static dashes rather than something moving/filling.

**Scope decision**: fix `compact` only. The task named "the cards"
specifically, and `full`'s dotted line wasn't flagged — removing it
there too would be redesigning something not asked about, and it's the
one variant where the "route" framing (vs. plain progress) genuinely
fits the screen (a full tracking view, not a summary card).

**Files changed**:
- `src/components/ui/RouteRail.tsx` — the dashed-texture overlay
  `<div>` now only renders `variant === "full"` (was unconditional).
  `compact`'s track is now `h-1.5` (was a shared `h-[2px]` for both
  variants) so the solid fill actually reads as a progress bar rather
  than a hairline; `full` keeps the original `h-[2px]` alongside its
  dashed texture, unchanged. Added `role="progressbar"` +
  `aria-valuenow`/`aria-valuemin`/`aria-valuemax` to the track element
  itself (previously only `full` announced progress, via a separate
  `sr-only` span) — a small correctness fix alongside the requested
  visual one, since "a proper progress bar" reasonably includes being
  one semantically, not just visually. Updated the component's header
  comment to describe the two variants' now-different treatment instead
  of a single blanket "signature visual motif" claim.
- No caller changed. `DeliveryCard.tsx` (`ActiveDeliveriesSection`/
  `PastDeliveriesSection` on `/dashboard`, `TrackListScreen` on
  `/track`) and `OrderSummaryCard.tsx` (`/checkout`) both already call
  `RouteRail` with no `variant` prop, i.e. the default `compact` — so
  this is a one-file fix, not a per-screen one. `OrderDetailsScreen.tsx`
  (Admin) and `TrackPackageScreen.tsx` both pass `variant="full"`
  explicitly and are visually unchanged.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint
src/components/ui/RouteRail.tsx` (clean), a cleared-`.next` `npx next
build` (clean — 45 routes, no route added/removed/resized beyond
normal build noise). Dev-server smoke test: `/dashboard`, `/track`,
`/checkout` (the three screens rendering the affected `compact`
variant) all return `200`. **Not performed**: no browser session was
available, so the actual visual result — whether the thicker solid bar
reads as "cool"/"proper" to the person who filed this feedback — hasn't
been seen rendered. Worth a quick look in a browser before considering
this fully resolved, since this was subjective visual feedback, not a
functional bug.

---

## 2026-08-21 (newest — Rider's "Active" screen becomes "Activity": every order, tabbed)

**Feature**: follow-up to a live debugging session earlier the same day
(user + backend jointly root-causing a `RIDER_CAPACITY_UNAVAILABLE`
409). Temporary console logging (added mid-session, largely stripped
back out afterward by the user directly on disk — not this entry's
concern) traced it to a real backend bug: a rider with 2 `completed`
orders and only 1 `in_transit` was still rejected trying to accept a
4th, meaning the backend's capacity count doesn't exclude `completed`
orders from "active." Once that was confirmed as backend-side, not
frontend, the explicit next ask: give the rider their own visibility
into this — "pull all orders for the rider, completed, collect, in
transit all... use the active page... tab or bar that can be clicked
or slide."

**No new endpoint.** `GET /handoffs/my-orders` was already ✅ real and
already the data source for `ActiveDeliveriesScreen` — it was just
being filtered down to `isActiveDelivery`
(`rider_assigned`/`in_transit`) before the screen ever saw the rest.
Every other status in that same response (`arrived_at_destination`,
`ready_for_collection`, `completed`) was being fetched and silently
discarded. This session stops discarding it.

**Scope decision — reused the existing screen/route, per explicit
instruction**: "use the active page for this." No new route, no new
file for the screen itself.
`ActiveDeliveriesScreen.tsx` (`/rider/active-deliveries`) is rewritten
in place rather than superseded by a new one; the only naming change is
`RIDER_NAV_ITEMS`'s label, "Active" → "Activity" (`nav-config.ts`),
since the screen's scope genuinely widened from "what's currently on my
plate" to "everything I've ever taken."

**Files created**:
- `src/modules/rider/components/active-delivery/ActivityFilterTabs.tsx`
  — new. Four-tab pill row (`All`/`In Transit`/`Awaiting Collection`/
  `Completed`), each showing a live count, styled identically to the
  already-existing `EarningsFilterTabs` (same pill shape/active-state
  treatment) rather than inventing a second tab visual language.
  Exports `ACTIVITY_FILTER_ORDER` so the screen's swipe handler and the
  tab row agree on tab order without duplicating it.
- `src/components/ui/HandoffStatusPill.tsx` — new; the real
  implementation, **promoted** from
  `modules/node/components/handoff/HandoffStatusPill.tsx` — same
  promotion pattern `docs/ARCHITECTURE.md` already documents for
  `QrScannerView` (a second role needing a component that used to live
  inside a different role's module). Added two status configs it never
  had before: `ready_for_collection` ("Awaiting Collection", info-blue)
  and `completed` ("Completed", success-green) — Node's own screens
  always branch away before rendering a pill for either of those two
  statuses, but the Rider Activity screen's whole point is showing
  every status, including the two the lifecycle ends on.

**Files changed**:
- `src/modules/node/components/handoff/HandoffStatusPill.tsx` —
  replaced with a two-line re-export from the new shared location
  (`export { HandoffStatusPill, getHandoffStatusLabel } from
  "@/components/ui/HandoffStatusPill"`) — verbatim the same pattern
  `components/scanner/QrScannerView.tsx`'s promotion used. All six
  existing Node-module importers (`HandoffDetailScreen`,
  `CollectParcelScreen`, `DropOffPreviewScreen`, `ActivityScreen`,
  `NodeOrderRow`, `CollectionSummaryList`, plus the module's own
  `handoff/index.ts` barrel) needed zero changes — their import paths
  still resolve.
- `src/components/ui/index.ts` — barrel-exported
  `HandoffStatusPill`/`getHandoffStatusLabel`.
- `src/modules/rider/hooks/use-my-orders.ts` — added
  `isAwaitingCollection()` (`arrived_at_destination` |
  `ready_for_collection`) and `isCompletedDelivery()` (`completed`),
  siblings to the existing `isActiveDelivery()` — same one-predicate-
  per-bucket shape, all three pure functions over a single `status`
  field so the screen's tab-count logic is just three `.filter()` calls
  over one already-fetched list.
- `src/modules/rider/components/active-delivery/ActiveDeliveriesScreen.tsx`
  — rewritten. `useMyOrders()` (the full, unfiltered list) replaces the
  old `useActiveDeliveries()` (already `isActiveDelivery`-filtered) as
  the screen's data source; `isActiveDelivery` is still applied, just
  client-side per-tab now instead of upstream. New `filter` state
  (`ActivityFilter`, default `"in_transit"` — preserves the exact
  previous default view/behavior) picks which of the four `.filter()`
  results renders. `OrderActivityRow` replaces the old
  `ActiveDeliveryRow`: same actionable UI (tracking code, next-node
  info, "Get handoff code" + navigate buttons) when
  `isActiveDelivery(order)` is true, but now shows a real
  `HandoffStatusPill` instead of the old ad hoc colored badge span, and
  falls back to a plain read-only card (route summary + parcel info,
  status pill, no action buttons) for every other status — the
  screen's first time rendering `arrived_at_destination`/
  `ready_for_collection`/`completed` orders at all. Swipe support: a
  plain `onTouchStart`/`onTouchEnd` delta-x handler on the tab content
  wrapper (50px threshold), stepping `ACTIVITY_FILTER_ORDER` left/right
  — no gesture library added, since none exists elsewhere in this
  codebase and a 15-line handler covers "swipe to switch tabs" fully.
  Four sets of empty-state copy (`EMPTY_COPY`), one per tab, instead of
  a single generic "no deliveries" message that wouldn't fit "no
  completed deliveries yet" or "nothing awaiting collection."
- `src/components/layout/nav-config.ts` — `RIDER_NAV_ITEMS`'s "Active"
  label → "Activity" (same `href`/`icon`, same position); updated the
  block's header comment to explain the widened scope.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint
src` (clean, whole repo — confirms the re-export shim resolves and no
stale import of the old `HandoffStatusPill` path broke), a
cleared-`.next` `npx next build` (clean — 45 routes, same count as
before this session). Dev-server smoke test: `/rider/active-deliveries`,
`/rider/home`, `/rider/available-jobs` (Rider screens touched or
adjacent this session) and `/node/home`, `/node/activity` (Node screens
exercising the re-exported status pill, to confirm the promotion didn't
break that module) all return `200`; grepped the dev server log for
`error`/`TypeError` with none found. **Not performed**: no live Rider
session with a real mix of `rider_assigned`/`in_transit`/
`arrived_at_destination`/`ready_for_collection`/`completed` orders was
available, so the four tabs' populated states, their counts, and the
touch-swipe gesture haven't been exercised against real data or a real
touchscreen — only compiled, built, and route-probed.

**Related, unchanged by this session**: the `RIDER_CAPACITY_UNAVAILABLE`
backend bug this follows up on (capacity count not excluding
`completed` orders) is still open on the backend side — nothing here
fixes it, this session only gives the rider visibility into the same
data that debugging session used to prove the bug existed.

---

## 2026-08-21 (very latest — Node's Earnings tab, and login skips Setup for an already-approved Node)

**Feature**: two explicit Node-module asks. (1) "Remove the earnings
from the profile and place it on the sidebar and bottombar" — Earnings
was a row inside Node Profile; move it to a first-class nav tab, same
as every other role's Earnings destination already is. (2) "When you
open the node app it goes to the setup directly, change that so it
goes to the dashboard when a node is approved" — the post-login
redirect for `node_operator` was unconditional to `/node/setup`
regardless of the Node's real approval status.

**Files changed**:
- `src/components/layout/nav-config.ts` — `NODE_NAV_ITEMS` gained
  `{ label: "Earnings", href: ROUTES.nodeEarnings, icon: WalletIcon }`
  (fourth tab, after Activity — `WalletIcon` was already imported here
  for the Rider/Admin Earnings-shaped tabs, no new import needed).
  Updated the block's header comment.
- `src/modules/node/components/profile/NodeProfileScreen.tsx` — removed
  the `<Link href={ROUTES.nodeEarnings}>` Card row entirely (the
  "Business"/Node Setup row directly above it is untouched — only
  Earnings was asked to move). Removed the now-unused `WalletIcon`
  import.
- `src/modules/node/components/earnings/NodeEarningsScreen.tsx` —
  `TopBar title="Earnings" showBack` → `RootTopBar
  profileHref={ROUTES.nodeProfile}`, with a new in-page `<h1>Earnings</h1>`
  heading (`RootTopBar` carries no title slot) — matches the root/tab-
  screen convention every other promoted-to-a-tab screen already
  follows (e.g. the Rider module's own `MyEarningsScreen` made the
  identical switch when its tab was added). No data/logic changes.
- `src/modules/user/hooks/use-auth.ts` — the shared `loginMutation`
  (role-agnostic `POST /auth/login`, every role's login) used to
  redirect `node_operator` straight to `ROUTES.nodeSetup` unconditionally.
  `onSuccess` is now `async`: for `node_operator`, it calls
  `nodeService.getMyNodeOperatorProfile()` (real, already-confirmed
  `GET /node-operators/me`, the same call `useNodeSetup`/`useNodeProfile`
  already make elsewhere) and redirects to `ROUTES.nodeHome` when
  `node.status === "active"`, else still `ROUTES.nodeSetup` (covers
  `pending`, and the call's `404 NOT_FOUND`/any other error when
  onboarding was never completed at all — caught and treated the same
  as `pending`, since `NodeSetupScreen` already renders the correct
  view for both). Returns early in that branch, which also meant
  dropping the now-dead `node_operator: ROUTES.nodeSetup` entry from
  the fallback `roleRedirect` map further down (TypeScript's own control-
  flow narrowing correctly flagged it as unreachable once the early
  return existed — not a stylistic choice, the compiler required it).

**Investigation before changing anything**: confirmed
`(node)/layout.tsx` and `AuthGuard` do no redirecting of their own
(pure auth-gate + shell wrapper, no navigation logic) and that
`useNodeAuth` (Node's own hook) only implements logout, not login — so
`use-auth.ts`'s shared `loginMutation` is the single place this
decision is made, for every role including Node. No middleware or root-
page redirect does anything role-specific either (`app/page.tsx` just
sends everyone to `/role-select`). This is worth knowing if "opens on
Setup" ever recurs: there is exactly one code path to check.

**Verification performed**: `npx tsc --noEmit` (clean — surfaced one
real error mid-change: the fallback `roleRedirect` map's type no longer
allowed the `node_operator` key once the early return above narrowed
`session.user.role`, fixed by removing that now-unreachable entry),
`npx eslint src` (clean, whole repo), a cleared-`.next` `npx next
build` (clean — 45 routes, same count). Dev-server smoke test:
`/node/home`, `/node/profile`, `/node/earnings`, `/node/activity`,
`/login` all return `200`; dev log grepped clean of
`error`/`TypeError`. **Not performed**: no live NodeOperator session
(one `active`, one `pending`) was available to actually log in and
watch the redirect branch either way — the `getMyNodeOperatorProfile()`
call, the `status === "active"` check, and the catch-block fallback are
implemented per the same documented contract every other Node-module
screen already uses, but haven't been exercised against a real login.

---

## 2026-08-21 (absolute latest — Select Nodes: pull-up sheets replace endless inline lists, plus address-proximity search)

**Feature**: `/delivery/select-nodes` rendered both the origin and
destination Node pickers as a search box plus the *entire* matching
list, always expanded, one section stacked under the other. With more
than a handful of Nodes in the network this makes the Consumer keep
scrolling just to compare options. Ask: put each list behind something
opened on demand ("a drop down... click to see all node and select"),
and let the search find Nodes near a typed *address*, not just Nodes
whose own name/city text happens to match.

**No new endpoint** — `GET /nodes/nearby` (`useNodes`, unchanged) is
still the sole data source, fetched once at the API's already-max
radius (100km, per `nodesService.listNearby`'s existing default) and
kept in memory; an address search re-sorts that in-memory list rather
than issuing a second network call. `geocodingService.geocodeAddress()`
(Geoapify, already real/wired for `AddressGeocodeButton` on the
Admin/Node onboarding forms) is the reused address→coordinates call —
called here with only the `address` field populated (`city`/`state`
left empty), which its own `buildQueryText()` already handles (filters
falsy parts, joins what's left) — no service change needed.

**Files created**:
- `src/modules/user/components/delivery/NodePickerField.tsx` — the
  collapsed trigger: icon, label, the selected Node's name + live
  distance (or a placeholder when nothing's picked yet), chevron.
  Presentational only — owns no state, just an `onClick`.
- `src/modules/user/components/delivery/NodePickerSheet.tsx` — the
  actual list, in a pull-up sheet (`fixed inset-0` backdrop +
  `rounded-t-[24px]` panel + drag-handle bar — the exact pattern
  `VerificationReminderSheet` and `BottomNav`'s "More" sheet already
  use, not a new visual language). One `Input` does two jobs: as-typed
  text instantly filters the passed-in `nodes` prop by name/city
  (client-side, unchanged behavior from the old inline lists, just
  relocated here); a pin-icon button in the input's `rightElement`
  (only rendered when `addressSearchAvailable` — i.e.
  `geocodingService.isConfigured()`, hidden entirely otherwise, same
  graceful-degradation convention `AddressGeocodeButton` already uses
  for a missing API key) triggers `onSearchAddress`, also wired to the
  `Input`'s `Enter` key. Once an address search resolves, a
  `bg-status-info-bg` banner reads "Showing stations near {address} ·
  Clear"; the list stops being text-filtered while that's active
  (showing every Node, sorted by distance to the searched point) since
  a real address generally won't substring-match any Node's name.

**Files changed**:
- `src/modules/user/components/delivery/SelectNodesScreen.tsx` —
  rewritten. `NodeMapView` (origin-only, click-a-marker-to-select) is
  untouched — still fed `nodesWithLiveDistance` (sorted from the user's
  own live position, exactly as before); this session's changes are
  additive to what's below the map, not a map change. The two
  always-rendered `Input` + full-list sections are replaced with two
  `NodePickerField`s (`activeSheet: "origin" | "destination" | null`
  state picks which `NodePickerSheet` — if either — is mounted; only
  one exists in the DOM at a time). Origin and destination each carry
  fully independent address-search state
  (`{point, label, isSearching, error}` — new local `AddressSearchState`
  shape, one instance per picker) so searching near, say, the
  *receiver's* address for the destination picker has zero effect on
  the origin picker's list, and vice versa — these are genuinely
  different reference points a Consumer might want (their own location
  for pickup, someone else's for drop-off). A new local hook,
  `useNodesForPicker()`, centralizes the shared sort/filter logic
  (reference point = the picker's own searched address point, falling
  back to the user's live position; text-filtered in normal mode,
  left unfiltered — just re-sorted — once an address search is active)
  so origin and destination don't each duplicate it; the destination
  instance also excludes whichever Node is currently selected as
  origin, same as the pre-existing behavior.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint
src` (clean, whole repo), a cleared-`.next` `npx next build` (clean —
45 routes, same count; `/delivery/select-nodes`'s First Load JS grew
slightly reflecting the two new components, no other route affected).
Dev-server smoke test: `/delivery/select-nodes` returns `200`, dev log
grepped clean of `error`/`TypeError`. **Not performed**: no browser
session was available, and this environment has no
`NEXT_PUBLIC_GEOAPIFY_API_KEY` configured, so neither sheet has been
opened/searched/selected in an actual browser, and the address-geocode-
and-resort path has only been read/traced against `geocodingService`'s
existing (already-live-tested-elsewhere-per-`docs/HANDOFF.md`) contract
— not exercised end to end here. Worth a click-through (both pickers,
plain text search and an address search on each, and the map's
marker-tap path to confirm it still sets origin correctly) before
calling this production-ready.

---

## 2026-08-21 (most recent — Consumer Dashboard shows a "Payment Processing" card while a payment is stuck between Paystack and a real Order)

**Feature**: the ask — when a Consumer's payment is pending, log it,
show it to them as pending with a "come back later" message, and show
the real thing once it succeeds — "this will help customer not panic
when payment is made and they have not see the order neither did they
see any card showing it." The panic case, concretely: `POST
/payments/intents` succeeds, the Consumer is redirected to Paystack and
pays, but then either closes the app before `/orders/payment-callback`
(`PaymentCallbackScreen`) finishes polling `GET /payments/intents/:id`,
or that poll's ~90s window times out while they're still on it. Either
way, they land back on `/dashboard` to... nothing. `GET /orders` only
ever returns Orders that already exist server-side (i.e., already
`paid`), so a payment stuck between "charged" and "recorded" was
completely invisible — indistinguishable from "the payment never
happened," which is exactly the panic this closes.

**No new endpoint.** `GET /payments/intents/:id` (already real, already
the one `PaymentCallbackScreen` polls) is the only network call
involved. The gap was purely that nothing outside that one screen ever
remembered a payment intent existed — `PaymentCallbackScreen`'s only
memory of "which intent am I confirming" was `sessionStorage`, which is
tab-scoped and gone the moment the tab closes.

**Files created**:
- `src/modules/user/lib/pending-payments.ts` — new. A small,
  synchronous localStorage read/write module (`STORAGE_KEYS.pendingPayments`,
  new key) holding `PendingPaymentRecord[]` — `{intentId, amountKobo,
  originNodeName, destinationNodeName, parcelDescription, createdAt}`.
  Deliberately `localStorage`, not `sessionStorage` — "come back later"
  in the ask implies surviving a closed tab/browser restart, which
  `sessionStorage` doesn't. `addPendingPayment()` is the literal "log
  it" step (also fires a `console.log` trace — a genuine, permanent
  trace of "we told the Consumer this was pending," not a temp debug
  statement); `removePendingPayment()` is called the instant a record's
  real status stops being `"pending"`, from whichever of two places
  notices first.
- `src/modules/user/hooks/use-pending-payments.ts` — new. Reads the
  on-file records once (`useState` lazy initializer), then — only if
  there's at least one — fans out `GET /payments/intents/:id` for each
  via one `useQuery` (there's no "list my intents" endpoint, so this is
  a `Promise.all` over whatever ids are on file, not a single list
  call). Whichever records are still genuinely `"pending"` are returned
  as-is; anything else gets `removePendingPayment()`'d and logged
  inside the query function itself (not a follow-up effect — see the
  fix below), and a resolution to `"paid"` additionally invalidates
  `QUERY_KEYS.deliveries` so `ActiveDeliveriesSection` picks up the new
  real Order immediately rather than waiting out its own `staleTime`.
  `refetchOnWindowFocus: true` is the whole "polling" story — a check
  when the Consumer actually comes back, not a background loop, per the
  "come back later to check" framing rather than nagging the API.
- `src/modules/user/components/dashboard/PendingPaymentsSection.tsx` —
  new. Renders nothing when `usePendingPayments()` returns an empty
  list (the overwhelming majority of visits); otherwise one card per
  pending record — amount, the two Node names, and copy that explicitly
  says "no need to try again" (the thing a panicking Consumer is most
  likely to do wrong) plus "check back in a few minutes."

**Files changed**:
- `src/core/config/constants.ts` — added `STORAGE_KEYS.pendingPayments`.
- `src/modules/user/hooks/use-checkout.ts` — `redirectToPaystack()` now
  takes `{originNodeName, destinationNodeName}` (the intent itself only
  carries node *ids*, and `CheckoutScreen` already has the resolved Node
  objects on hand from `useNodes()`) and calls `addPendingPayment()`
  right before the existing `sessionStorage` stash and the
  `window.location.href` redirect — same moment, just one more thing
  recorded.
- `src/modules/user/components/checkout/CheckoutScreen.tsx` — the
  "Confirm & Pay" button's `onClick` now passes those two names through
  from its own already-resolved `originNode`/`destinationNode`.
- `src/modules/user/components/tracking/PaymentCallbackScreen.tsx` —
  two small additions to existing effects, no new branches: the
  `matchedOrder` effect (the `"paid"` happy path) now also calls
  `removePendingPayment(intentId)` alongside its existing
  `sessionStorage` cleanup; a new effect calls the same for
  `"failed"`/`"expired"` — this screen already tells the Consumer
  directly in those cases, so leaving the record on file would just be
  a stale duplicate the Dashboard would show later for no reason.
- `src/modules/user/components/dashboard/DashboardScreen.tsx` — mounted
  `<PendingPaymentsSection />` between `DashboardHeader` and
  `ActiveDeliveriesSection`.

**Bug caught by lint, fixed before this shipped**: the first draft of
`use-pending-payments.ts` kept the "still pending" list in its own
`useState`, populated by a `useEffect` that called `setRecords(...)`
after inspecting the query's result — `react-hooks/set-state-in-effect`
correctly flagged this (same category of violation this log has
precedent for, from a 2026-08-17 Node Operator session). Fixed by
moving the resolution/cleanup/logging logic *into* the query function
itself, which returns the already-pruned "still pending" list directly
as `query.data` — no separate state, no effect, no cascading render.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint
src` (clean, whole repo — confirms the set-state-in-effect fix and
that two initially-added-defensively `eslint-disable` comments for
`no-console` were unnecessary and were removed, since this project's
eslint config doesn't enable that rule), a cleared-`.next` `npx next
build` (clean after one transient webpack-worker cache miss unrelated
to this change — 45 routes, same count; `/dashboard` and `/checkout`
both grew reflecting the new code, no other route affected).
Dev-server smoke test: `/dashboard`, `/checkout`,
`/orders/payment-callback` all return `200`, dev log grepped clean of
`error`/`TypeError`. **Not performed**: no live or sandboxed Paystack
payment was available, so an actual pending → paid transition, the
card's real rendering with a genuine amount/Node pair, and the
`console.log` trace's actual output have not been seen end to end —
only compiled, built, and route-probed.

---

## 2026-08-22 (production-readiness pass: dead-endpoint removal + Admin backend gap list + animated PWA splash)

**Feature**: three requests in one sitting, following a fresh
role-by-role integration audit (Node/Admin/Customer) and a full
`docs/API.md` re-read. (1) Remove every endpoint not documented in
`API.md` that also has no live caller — explicit ask: "I need the
project clean for production." (2) List all of `admin.service.ts`'s
permanently-`NOT_IMPLEMENTED` methods with their function, to hand to
the backend team. (3) An animated logo+wordmark launch splash for the
mobile PWA.

### Dead-endpoint removal

Traced every candidate up to its hook and screen before deleting
anything — a route with a real caller stays, no matter how it's
described elsewhere; a route with zero callers goes, no matter how
confidently a comment claimed it was "kept for later."

**Files changed**:
- `src/core/api/endpoints.ts` — removed `auth.consumerRequestOtp`,
  `auth.consumerRequestLoginOtp`, the whole `identity` group
  (`consumerOnboarding`), the whole `notifications` group
  (`listForUser`/`markRead`/`markAllRead` — the latter two were never
  called by anything either, not just `listForUser`), `orders.calculateFare`,
  `orders.book`, and `payments.webhook` (a provider-parameterized
  constant that never matched the real, plural
  `/payments/webhooks/paystack` path anyway).
- `src/core/api/services/auth.service.ts` — removed
  `requestConsumerOtp()`, `requestConsumerLoginOtp()`,
  `submitConsumerOnboarding()`, and their now-unused
  `ConsumerOnboardingPayload`/`RequestOtpPayload` type imports.
- `src/core/api/services/node.service.ts` — removed `listActivity()`
  and its `mapNotificationToActivity()` helper, and the now-unused
  `generateId`/`useAuthStore`/`ActivityLogEntry` imports. Rewrote the
  file's header comment: it used to argue for keeping `listActivity()`
  ("a real, working integration... pending a product decision") — that
  decision is made now, in favor of deleting it, since `ActivityScreen`
  has sourced the Activity Log from `getMyNodeOrders()` instead since
  2026-08-17 and nothing else ever called it.
- `src/modules/node/hooks/use-activity-log.ts` — **deleted**, not left
  as dead code. Its only reference anywhere in the app, after the
  service method it wrapped was removed, was a comment in
  `ActivityScreen.tsx` describing history, not a real import.
- `src/modules/user/hooks/use-auth.ts` — removed
  `requestSignUpOtpMutation`/`requestLoginOtpMutation` and everything
  they exposed (`requestSignUpOtp`, `isRequestingSignUpOtp`,
  `requestSignUpOtpError`, `signUpOtpSent`, `requestLoginOtp`,
  `isRequestingLoginOtp`, `requestLoginOtpError`, `loginOtpSent`), plus
  the `target`/`setTarget` state that only existed to feed them and the
  now-unused `useState`/`OtpChannel` imports.
- `src/modules/user/components/auth/CreateAccountScreen.tsx` — removed
  the ~120-line block of commented-out OTP-flow JSX (the two-step
  "send code" / "verify code" form) that a same-day earlier session had
  disabled by wrapping in a JSX comment rather than deleting. It
  referenced several of the hook fields removed above, so it would have
  been a compile error the moment anyone un-commented it — better gone
  than left as a trap. The live registration form (first/last name,
  email, phone, password, consent — `POST /auth/register`) is
  unchanged.
- `src/core/types/user.types.ts` — removed `OtpChannel`,
  `RequestOtpPayload`, `ConsumerOnboardingPayload` (all now-orphaned),
  and two long-`@deprecated` types explicitly marked "kept for the mock
  service" — `SignUpPayload` and `LoginPayload`. The mock service they
  referred to was deleted in the 2026-08-20 session; these two were
  simply never cleaned up alongside it.

**Deliberately not touched**: `GET /nodes/:id` (`nodesService.getById()`)
and `POST /auth/verify-email` — both are genuinely documented in
`API.md`, they just have no current UI caller. That's a different
category from what this pass targeted ("not in API.md"); removing a
real, documented integration because nothing calls it *yet* would be
the wrong call — flagged instead, in the same-day audit response, as
candidates for either a real UI or an explicit product decision to
drop them.

**Verification performed**: `npx tsc --noEmit` (clean — this is what
caught every dangling reference; each deletion round surfaced the next
one to fix, in order: `auth.service.ts`'s `RequestOtpPayload`/
`ConsumerOnboardingPayload` imports, then `use-auth.ts`'s two missing
service methods, then `node.service.ts`'s missing `ENDPOINTS.notifications`),
`npx eslint src` (clean — caught the resulting unused-import warnings
in the same three files plus `use-auth.ts`'s orphaned `target`/`setTarget`),
a cleared-`.next` `npx next build` (clean after one transient
webpack-worker cache miss unrelated to this change — 45 routes, same
count). **Not performed**: `docs/API_INTEGRATION_STATUS.md`'s
Inconsistencies section still describes some of what was just deleted
as "still there, flagged" — needs a pass to mark these resolved, not
done this session.

### Admin backend gap list (no code changed)

Read `admin.service.ts` in full and produced a per-screen table (14
methods, not the 13 estimated in the prior session's audit — the
Analytics screen's orders-trend chart is a distinct stub from the
three other Analytics stubs already counted) for the user to hand to
their backend engineer: which screen each blocks, a suggested route,
and the response shape the frontend type already expects. Flagged two
worth a product conversation rather than just an endpoint: Super Admin
(no `super_admin` role exists in the documented enum at all) and the
Rider leaderboard's rating field (no rating concept exists anywhere
else in the real API).

### Animated PWA splash screen

**Files created**:
- `src/components/splash/SplashScreen.tsx` — new. Logo (`LogoMark`,
  72px) fades/scales in, "LOCOOMO" wordmark follows ~220ms later (CSS
  `animation-delay`), holds ~650ms once both have settled, then the
  whole overlay fades out over 400ms and unmounts (`isMounted` state
  goes false — not just hidden, so it leaves the accessibility tree and
  DOM once done). All timing is plain `setTimeout`s in a single
  mount-time effect, no animation library added — matches this
  codebase's existing pattern of hand-rolled CSS transitions/keyframes
  elsewhere (`animate-spin`, `RouteRail`'s progress fill).

**Files changed**:
- `src/app/globals.css` — added `@keyframes splash-logo-in` /
  `splash-wordmark-in` and their `.animate-splash-logo`/
  `.animate-splash-wordmark` utility classes. No separate
  `prefers-reduced-motion` handling needed — the file already had a
  blanket rule (`* { animation-duration: 0.01ms !important; ... }`)
  that collapses these too.
- `src/app/layout.tsx` — mounted `<SplashScreen />` as the first child
  of `<body>`, a sibling to `QueryProvider`/`ServiceWorkerRegistration`
  rather than nested inside them, since it's a fixed-position overlay
  that doesn't participate in the provider tree and must render
  regardless of auth/query state.

**Design decisions**:
- Background is `--bg-canvas` (`#F7F9FC`) — deliberately the exact same
  value as `manifest.webmanifest`'s `background_color`, which is what
  Android already paints behind the app icon before any JS runs on a
  standalone-installed PWA launch. Matching it means this component's
  fade-in is the only visual transition a user sees, not a color swap
  on top of one the OS already did.
- `LogoMark` itself is unchanged — it has hardcoded blue fill colors
  (not `currentColor`), so a light background was the only option that
  wouldn't require a new monochrome logo asset just for this screen.
- Shows on every page load (regular browser tab or installed PWA)
  rather than being gated behind `window.matchMedia('(display-mode:
  standalone)')` — a deliberate default favoring simplicity and
  demoability over restricting it to only the installed-PWA case; easy
  to add the gate later if it turns out to be wanted only there.
- Mounted in the root layout specifically because the App Router keeps
  that layout mounted across client-side navigation — so this only
  ever plays once per actual page load/refresh, which is the "cold
  launch" moment a splash should own, not something that would
  otherwise replay every time a route link is clicked inside the app.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint
src` (clean), a cleared-`.next` `npx next build` (clean — 45 routes,
unchanged count). Dev-server smoke test: `/role-select`'s SSR output
contains the `animate-splash-logo` class and the "LOCOOMO" text,
confirming the component actually renders server-side rather than only
existing in source; `200`, no runtime errors in the dev log.
**Not performed**: no browser was available this session, so the
animation's actual look/feel/timing — whether ~1.7s total (entrance +
hold + exit) reads as polished rather than sluggish or too brief on a
real device — has not been seen. Worth an actual look, ideally on an
installed PWA on a phone, before considering this finished.

---

## 2026-08-22 (later — "Payment Processing" Dashboard section removed)

**Feature**: full removal of the pending-payment feature added
2026-08-21. Explicit reasoning given: "since user will not logout, it
will give displaying pending and that is not good." The localStorage
record backing it had no expiry — a payment that never resolved (no
webhook confirmation, or the Consumer simply never came back) would
show "Payment processing... check back shortly" on every Dashboard
visit indefinitely, for as long as that browser's storage survived,
across however many sessions. Decision was to remove the feature
outright rather than patch the missing expiry.

**Files deleted**:
- `src/modules/user/lib/pending-payments.ts`
- `src/modules/user/hooks/use-pending-payments.ts`
- `src/modules/user/components/dashboard/PendingPaymentsSection.tsx`

**Files reverted to their exact pre-2026-08-21 state** (confirmed via
`git diff` against each file's last-committed version — zero diff on
all three):
- `src/modules/user/hooks/use-checkout.ts` — `redirectToPaystack()`
  back to taking no arguments and only writing
  `STORAGE_KEYS.pendingPaymentIntentId` to `sessionStorage`; the
  `addPendingPayment()` call and its now-unused import removed.
- `src/modules/user/components/checkout/CheckoutScreen.tsx` — "Confirm
  & Pay" back to `onClick={redirectToPaystack}` directly, no longer
  passing origin/destination Node names through.
- `src/modules/user/components/tracking/PaymentCallbackScreen.tsx` —
  the `matchedOrder` effect's `removePendingPayment()` call and the
  second effect (added solely to clean up the pending record on
  `"failed"`/`"expired"`) both removed; `removePendingPayment` import
  gone.

**Files changed**:
- `src/modules/user/components/dashboard/DashboardScreen.tsx` —
  `<PendingPaymentsSection />` and its import removed; back to
  `RootTopBar` → `DashboardHeader` → `ActiveDeliveriesSection` →
  `PastDeliveriesSection`.
- `src/core/config/constants.ts` — `STORAGE_KEYS.pendingPayments`
  removed. `STORAGE_KEYS.pendingPaymentIntentId` (the original,
  tab-scoped `sessionStorage` key `PaymentCallbackScreen` has always
  used) is untouched.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint
src` (clean), a repo-wide grep for every symbol the feature introduced
(`pendingPayments`, `addPendingPayment`, `removePendingPayment`,
`usePendingPayments`, `PendingPaymentsSection`) confirming zero
remaining references anywhere in `src/`, and a cleared-`.next` `npx
next build` (clean — 45 routes, matching the pre-feature count exactly).
Dev-server smoke test: `/dashboard`, `/checkout`,
`/orders/payment-callback` all return `200`, dev log grepped clean of
`error`/`TypeError`.

**Consequence, left open by explicit choice**: the original panic
scenario this feature was built to solve — a Consumer who closes the
app mid-payment, or outlasts `PaymentCallbackScreen`'s ~90s poll
window, sees nothing on Dashboard indicating their payment is still
being confirmed — is back. Nothing here fixes that; the call made this
session was that an indefinitely-persisting "pending" card was worse
than that gap. A future fix, if wanted, should carry its own expiry
(e.g. auto-drop the record after a fixed window, or re-check status
against a max age) rather than reviving this exact implementation
unchanged.

---

## 2026-08-22 (later still — Admin login via the shared /login screen now rejects instead of silently bouncing)

**Bug reported**: "when I login in as admin here /login to say
successfull but did not redirect." Confirmed by reading the actual
request path, not just guessing: `POST /auth/login` is documented as
role-agnostic (`docs/API.md`), so an Admin's real credentials succeed
identically to any other role on the shared `/login` screen —
`authService.loginConsumer()` had no role check at all, unlike
`loginAdmin()` (the `/admin-login` screen's service call), which
already checks the reverse direction. The session cookie gets issued,
`use-auth.ts`'s `loginMutation.onSuccess` fires the success toast and
pushes to `ROUTES.dashboard` (its redirect map's `admin` entry) — but
`src/app/(user)/layout.tsx`'s `AuthGuard` is `allowedRoles:
["consumer"]`, so it immediately redirects that mismatched session
straight back to `/login`. Net effect from the outside: a success
message, then silence — exactly what was reported.

**Fix**: `authService.loginConsumer()` (`core/api/services/auth.service.ts`)
now mirrors `loginAdmin()`'s existing reverse check. Right after `POST
/auth/login` resolves, if `raw.role === "admin"`: fire-and-forget `POST
/auth/logout` to revoke the cookies that call just issued, then throw
`ApiError({code: "INVALID_CREDENTIALS", message: "The email or password
doesn't match our records."})` — the exact same message/code every
other wrong-login reason on this screen already produces. Deliberately
*not* a distinct "this is an admin account, use /admin-login" message —
per `docs/API.md`'s own stated reasoning for `INVALID_CREDENTIALS`
("deliberately identical... so a login attempt can't be used to
enumerate registered emails"), telling a stranger which email belongs
to an admin account would itself be a leak. `mapSessionResponse`/
`persistSession` are skipped entirely in this branch — no session ever
touches `useAuthStore` or `localStorage` for a rejected admin attempt.

**No screen changes needed.** `LoginScreen.tsx` already renders
`getFriendlyError(loginError)` generically; `INVALID_CREDENTIALS`
already maps to "We couldn't sign you in 🔐 / The email or password
doesn't match our records." (`core/api/errors.ts`), so this Just
Works™ once the service throws the right code — nothing about the UI
needed to know an Admin was involved.

**Related cleanup**: `use-auth.ts`'s post-login `roleRedirect` map had
`admin: ROUTES.dashboard` — dead code now, since `loginConsumer()` can
no longer resolve successfully with that role at all (the throw above
happens before `onSuccess` ever runs). Changed the map's type from
`Record<typeof session.user.role, string>` to
`Partial<Record<typeof session.user.role, string>>` and dropped the
`admin` entry, rather than leave a redirect target that's provably
unreachable — same standard applied in the 2026-08-22 dead-endpoint
cleanup session just before this one.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint
src` (clean), a cleared-`.next` `npx next build` (clean after one
transient webpack-worker cache miss unrelated to this change — 45
routes, unchanged count). Dev-server smoke test: `/login` and
`/admin-login` both return `200`, dev log clean. **Not performed**: no
live Admin credential pair was available to actually submit on `/login`
and watch the rejection fire end to end — implemented per the same
pattern `loginAdmin()`'s own already-live reverse check uses, but not
exercised against a real account this session.

---

## 2026-08-22 (later — clarified "default splash screen" on Android; trimmed custom splash hold time)

**Question asked**: "There is a default splash screen, how do i remove
it so it just my custom splash screen that shows." Clarified with the
user which platform first — confirmed Android, installed PWA.

**Finding, not a bug**: the "default splash" is Chrome's own native
splash for any installed `display: "standalone"` PWA, generated from
`manifest.webmanifest`'s icon + `background_color` before any JS runs.
It cannot be disabled via manifest, meta tag, or app code — it's
equivalent to a native Android app's system-level launch screen.
Searched the repo for anything else that could be a second custom
splash (`loading.tsx`, a static splash image in `public/`,
`apple-touch-startup-image` tags) — found nothing; the
`SplashScreen.tsx` component from 2026-08-21 is the only one.

**Files changed**:
- `src/components/splash/SplashScreen.tsx` — `HOLD_MS` 650ms → 250ms.
  Reasoning: on an installed Android PWA this component only ever
  mounts after the native splash has already shown and dismissed, so a
  long deliberate hold here was stacking a second "branded pause" on
  top of one the OS already provided — reading as two splash screens
  rather than one continuous launch. The background-color match to
  `manifest.webmanifest` (already in place since the component was
  built) is what keeps the native → custom handoff from flashing a
  different color; that part needed no change.

**Verification performed**: `npx tsc --noEmit` (clean), `npx eslint`
on the changed file (clean), a cleared-`.next` `npx next build`
(clean — 45 routes, unchanged). Icon files in `public/icons/`
sanity-checked by file size only (not opened/viewed) — all consistent
with real generated assets, no placeholder-sized files found.
**Not performed**: no Android device or installed PWA was available to
see the actual before/after handoff, so whether 250ms is the right
amount of settle-time hasn't been observed on real hardware.
