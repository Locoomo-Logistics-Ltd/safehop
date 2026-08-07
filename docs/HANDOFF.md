# HANDOFF.md

> Always describes the *current* project state. Overwrite this file's
> contents each session (unlike `IMPLEMENTATION_LOG.md`, which is
> append-only).

## Current objective

Previous sessions integrated the Admin UI with the real backend API
and built the invitee-facing Invite Acceptance flow (`/accept-invite`).
This session's objective: the next item on the standing "Remaining
work" list — wire `PATCH /nodes/:id` behind Node Network's previously-
decorative "Manage" button, so an Admin can actually approve a
pending Node or suspend/reactivate one.

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

## Remaining work

**From previous sessions** (unchanged, not touched this session —
still open):
1. Resolve doc/code drift in root-level docs (`README.md`,
   `API_INTEGRATION.md` bearer-token claim, mock/real API claim).
2. Backend response-shape verification for `mapSessionResponse` /
   `mapFareResponse` / `mapInventoryResponse` /
   `mapNotificationToActivity`.
3. Payment SDK integration (`deliveryService.pay()` is a no-op).
4. Rider self-registration + KYC onboarding UI.
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

**Invite Acceptance flow** (this session's focus, done, but not
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
