# API_INTEGRATION_STATUS.md

> Full audit of every endpoint documented in `docs/API.md` against the
> current frontend implementation. Verified by reading the live source
> (`core/api/endpoints.ts`, `core/api/services/*.ts`, the module hooks
> that wrap them, and the screens that call those hooks) — not assumed
> from prior documentation. Last audited 2026-08-07.

**Legend**

- ✅ **Fully Integrated** — correct route, correct request body, correct
  response handling, and a real screen driving it with loading/empty/
  success/error states.
- 🟡 **Partially Integrated** — wired to the correct route, but with a
  contract mismatch (wrong param/response shape), a missing automation
  (e.g. no auto-refresh), a UI path that doesn't exist yet, or a
  documented capability the screen doesn't fully expose.
- ❌ **Not Integrated** — no frontend code calls the real route at all.
- ⚪ **No UI Required Yet** — not used (none of `API.md`'s 23 endpoints
  fall in this bucket; see note at the bottom on why the four Admin
  approval-queue routes are ❌ rather than ⚪).

## Auth

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| POST | `/auth/register` | Consumer + Rider + NodeOperator self-registration | ✅ | `RoleSelectScreen` (`/role-select`) → `CreateAccountScreen` (`/create-account?role=`) | `authService.registerConsumer` via `useAuth().register` | None. **2026-08-07**: `RoleSelectScreen`'s Rider/NodeOperator options now route to `/create-account?role=rider` / `?role=node_operator` (previously routed to now-deleted undocumented-flow screens); `CreateAccountScreen` reads `?role=` and includes it in the payload — all three self-registerable roles now reachable through this one documented endpoint, exactly as `API.md` describes ("This is the same endpoint for all three allowed roles"). Also fixed the client-side password strength meter (uppercase/lowercase/number/special) that contradicted `API.md`'s explicit "don't build a strength meter" guidance — now length-only (≥12 chars), matching `ResetPasswordScreen`. Also fixed a bug where a successful registration was incorrectly treated as a login (`setSession()` called with no server-side cookie ever issued) — `API.md` states registration does not log the user in; the hook now just routes to `/login`. |
| POST | `/auth/login` | Consumer + Rider + NodeOperator + Admin login | ✅ | `LoginScreen`, `AdminLoginScreen` (`/admin-login`) | `authService.loginConsumer` / `loginAdmin` via `useAuth().login` | None — role-agnostic per `API.md`, all four roles correctly share the one real route with `credentials:"include"`. **2026-08-07**: post-login redirect is role-aware (`session.user.role`) — NodeOperator → `/vendor/node-setup`, Consumer → `/dashboard` — previously hardcoded to `/dashboard` for every role, and unreachable by Rider/NodeOperator anyway since they didn't go through this endpoint yet. **2026-08-07 (later, gating pass)**: Rider → `/rider/home` (changed from `/rider/verification`) — a not-yet-verified Rider now lands on Home with a dismissible verification reminder instead of being forced straight into the verification form; see the Riders section below and `docs/HANDOFF.md` for the product reasoning. |
| POST | `/auth/refresh` | Session refresh | 🟡 | none directly | `authService.refreshSession` | Route/payload correct, but nothing calls it automatically on a `401`. Access tokens expire every 15 min with no interceptor — users get hard-logged-out mid-session instead of silently refreshing. |
| POST | `/auth/logout` | Logout | ✅ | Profile screens' "Log out" action | `authService.logout` via `useAuth().logout` | None. |
| POST | `/auth/password-reset/request` | Forgot password | ✅ | `ForgotPasswordScreen` (`/forgot-password`) | `authService.requestPasswordReset` | None functionally. Leftover `console.log`/`console.error` debug statements should be removed before ship. |
| POST | `/auth/password-reset/confirm` | Reset password | ✅ | `ResetPasswordScreen` (`/reset-password`) | `authService.confirmPasswordReset` | None — reads `token` from query string, correct password rules (12–128 chars, no composition), handles missing-token and success states. |
| POST | `/auth/verify-email` | Email verification | 🟡 | none | `authService.verifyEmail` | Service method is wired correctly (correct payload/response), but **no `/verify-email` route/screen exists** to read `token` from the emailed link and call it. Dead code until that page is built. |
| POST | `/users/invite` | Admin invites staff | ✅ | `InviteMemberForm`, Team Management (`/admin/team`) | `adminService.inviteStaff` via `useInviteStaff` | Errors surface via `getErrorMessage(error)` (generic `error.message` toast only) instead of `getFriendlyError(error)` (which extracts per-field `error.details`). A `400 VALIDATION_FAILED` on this form shows "Validation failed" with no indication of which field. |
| POST | `/auth/invite/confirm` | Accept invite | ✅ | `AcceptInviteScreen` (`/accept-invite`) | `authService.confirmInvite` via `useAuth().confirmInvite` | None — handles `VALIDATION_FAILED` (field messages), `INVALID_INVITE_TOKEN`, and `RATE_LIMITED`. |

## Nodes

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| POST | `/nodes` | Admin creates a Node | ✅ | `OnboardNodeForm`, Node Network (`/admin/nodes`) | `adminService.onboardPartnerNode` via `useOnboardNode` | Fields match the real body exactly. Same generic-toast validation issue as `/users/invite` above (`getErrorMessage`, not `getFriendlyError`). |
| GET | `/nodes` | Admin lists Nodes | ✅ | Node Network screen (`NodeNetworkScreen`) | `adminService.getNodeStatuses` via `useAdminNodes` | Fetches `limit=100` with no pagination UI — fine while the network is small, will silently truncate past 100 Nodes. |
| GET | `/nodes/nearby` | User picks a pickup Node | 🟡 (broken) | `GoogleMapView`/`MockMapView`, Select Nodes (`/delivery/select-nodes`) | `nodesService.listNearby` via `useNodes` | **Two stacked contract violations.** (1) Sends `radiusInMeters` as the query param — `API.md` requires `radiusKm` (0.1–100), so a real backend will almost certainly `400 VALIDATION_FAILED` on every call. (2) Independently, the response is parsed as a flat `LocoomoNode[]` (`httpClient.get<LocoomoNode[]>`) — but `API.md`'s actual response is the paginated envelope `{items, page, limit, total}` with `distanceMeters` per item. Even with the param fixed, `useNodes()` returns `query.data ?? []`, and `GoogleMapView.tsx`/`MockMapView.tsx` call `.map()` directly on that value — if the backend returns the documented paginated object, `.map()` is not a function and the Select Nodes map screen crashes. This is the single highest-priority fix in this audit. |
| GET | `/nodes/:id` | Admin views Node detail | ✅ | Node Network's "View Details" expand | `adminService.getNodeDetail` | None. |
| PATCH | `/nodes/:id` | Admin approves/suspends/edits a Node | 🟡 | Node Network's "Manage" panel | `adminService.updateNode` via `useManageNode` | Correctly wired, but the UI only ever sends `{status}` (approve/suspend/reactivate). `name`/`address`/`capacity`/`operatingHours`/etc. are all editable per `API.md` but no form exposes them. Same generic-toast validation issue as above. |

## Node Operators

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| POST | `/node-operators/onboarding` | Vendor self-service Node setup | ✅ | `VendorNodeSetupScreen` (`/vendor/node-setup`) | `vendorService.onboardNode` via `useVendorNodeSetup` | None. Fields match the real required body exactly. |
| GET | `/node-operators/me` | Vendor checks Node approval status | ✅ | Same screen, reachable from Vendor Profile's "Node Setup" row | `vendorService.getMyNodeOperatorProfile` via `useVendorNodeSetup` | None. Drives all three states correctly (`404`→onboarding form, `pending`→waiting view, `active`→dashboard link), field-level errors via `getFriendlyError`. |
| GET | `/node-operators/pending` | Admin's NodeOperator review queue | ❌ | none | none — no service method exists | No code calls this at all. There is no Admin screen to see who's waiting for Node approval, and no way to discover a pending NodeOperator except via `GET /nodes?status=pending` on the general Node Network screen (which doesn't surface the operator's identity/`profileId`). |
| PATCH | `/node-operators/:id/approve` | Admin approves a NodeOperator | ❌ | none | none — no service method exists | No approval action exists anywhere in the app. Combined with the row above, an Admin currently has **no way to approve a self-registered NodeOperator through the UI** — `PATCH /nodes/:id {status:"active"}` only flips the Node, not the linked User/profile the way this dedicated endpoint does in one transaction. |

## Riders

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| GET | `/riders/verification/upload-signature` | Rider KYC — get Cloudinary signature | ✅ | `RiderVerificationScreen` (`/rider/verification`) | `riderService.getVerificationUploadSignature` via `useRiderVerification` | None — only sends `documentType: "rating_screenshot"`, the one documented value. |
| POST | `/riders/onboarding` | Rider KYC — submit verification | ✅ | Same screen | `riderService.submitVerification` via `useRiderVerification` | None. Upload flows client-side straight to Cloudinary first (`uploadVerificationDocument`), then submits the resulting `public_id` — matches `API.md`'s "file bytes never pass through this API" instruction exactly. |
| GET | `/riders/me` | Rider checks verification status | ✅ | `RiderVerificationScreen`, `RiderHomeScreen`'s reminder sheet, `JobOfferScreen`'s gate, Rider Profile's "Verification" row | `riderService.getVerificationProfile` via `useRiderVerification` (called independently from each of those four screens/components, same query key — TanStack Query dedupes) | None. Drives all three states correctly (`404`→form, `pending`→under-review, `active`→dashboard link) on the verification screen itself. **2026-08-07**: also now gates `data.status !== "active"` on `JobOfferScreen` (blocks with "Verification required" + a link back to `/rider/verification`, instead of showing job-board content) and drives a dismissible reminder on `RiderHomeScreen`. Deliberately **not** gated on Home/Earnings/Profile — those stay browsable pre-approval (product decision, see `docs/HANDOFF.md`). |
| GET | `/riders/pending` | Admin's Rider review queue | ❌ | none | none — no service method exists | No code calls this. No Admin screen surfaces Riders waiting for approval. |
| PATCH | `/riders/:id/approve` | Admin approves a Rider | ❌ | none | none — no service method exists | No approval action exists anywhere. Same operational gap as NodeOperators above — **a Rider who completes verification can never be moved to `active` through the UI**, so they can never reach the job board regardless of how correct the verification submission flow itself is. |

## Summary

**23** endpoints documented in `API.md`. **15 ✅ Fully Integrated**, **4 🟡
Partially Integrated**, **4 ❌ Not Integrated**, **0 ⚪ No UI Required
Yet**.

### Recommended implementation priority

1. **Fix `GET /nodes/nearby`** (`nodes.service.ts`) — this is the User
   role's core "pick a pickup point" screen and is doubly broken (wrong
   query param + wrong response-shape assumption). Change
   `radiusInMeters` → `radiusKm` and unwrap `data.items` instead of
   treating the response as a bare array.
2. **Build the two Admin approval-queue screens** (`node-operators/pending`
   + `:id/approve`, `riders/pending` + `:id/approve`). Without these, the
   self-service onboarding flows (`VendorNodeSetupScreen`,
   `RiderVerificationScreen`) dead-end — a submitted NodeOperator or
   Rider has no path to ever become `active`. This is the single
   biggest functional gap in the app right now.
3. **Wire a `401` → `refresh` → retry interceptor** in `httpClient`
   (`core/api/client.ts`). `authService.refreshSession()` already exists
   and is correct; nothing calls it. Every user is currently one 15-minute
   access-token expiry away from an unexpected logout.
4. ~~Remove the client-side password strength meter in
   `CreateAccountScreen`~~ **Done (2026-08-07)** — replaced with the
   length-only check `API.md` calls for.
5. **Switch Admin-form error handling from `getErrorMessage` to
   `getFriendlyError`** (`useOnboardNode`, `useInviteStaff`,
   `useManageNode`) so `400 VALIDATION_FAILED`'s per-field `error.details`
   actually reach the user instead of a generic "Validation failed" toast.
6. **Build a `/verify-email` route/screen** to actually call the
   already-wired `authService.verifyEmail` — currently dead code.
7. Lower priority: expose `name`/`address`/`capacity`/etc. editing on
   `PATCH /nodes/:id`'s "Manage" panel (only `status` is exercised today);
   add pagination to `GET /nodes` once the network exceeds 100 entries.

### Inconsistencies and other issues found

- ~~**Rider and Vendor auth do not go through the documented endpoints
  at all.**~~ **Resolved 2026-08-07.** `RiderLoginScreen`/`VendorSetupScreen`
  and the five undocumented routes they called (`POST /auth/rider/register`,
  `POST /auth/rider/login`, `POST /auth/node-staff/provision`,
  `POST /auth/node-staff/login`, `POST /auth/node-staff/first-login-reset`,
  plus `authService.registerRider`/`loginRider`/`loginNodeStaff`/
  `firstLoginReset` and the undocumented `identity.riderOnboarding`)
  are deleted. Rider and NodeOperator now register via the same
  `POST /auth/register` (role field) and log in via the same
  `POST /auth/login` every role shares — see the Auth table above.
  Root cause: `UserRole` didn't actually match the backend's enum
  (`"user"`/`"vendor"` vs. the real `"consumer"`/`"node_operator"`),
  so there was no correct `role` value to send to the real endpoint —
  corrected as part of this fix. `docs/HANDOFF.md`'s 2026-08-07 entry
  has the full file list.
- ~~**`ARCHITECTURE.md` and `PROJECT_CONTEXT.md` both claim `/create-account`
  is "shared by User + Vendor signup via a `?role=` query param."**~~
  **Now true as of 2026-08-07** — `CreateAccountScreen.tsx` reads `?role=`
  and passes it to `registerConsumer`. `ARCHITECTURE.md`/`PROJECT_CONTEXT.md`
  themselves haven't been re-worded yet (item #1 on `docs/HANDOFF.md`'s
  standing "Remaining work" list covers general doc/code drift cleanup);
  the claim is accurate again, just not yet un-flagged at the source.
- **Endpoints the frontend calls that don't appear in `API.md`** (updated
  2026-08-07 — `/auth/rider/register`, `/auth/rider/login`,
  `/auth/node-staff/provision`, `/auth/node-staff/login`,
  `/auth/node-staff/first-login-reset`, and `/identity/rider/:userId/onboarding`
  removed from `endpoints.ts` entirely, see `docs/HANDOFF.md`): `/auth/consumer/request-otp`,
  `/auth/consumer/request-login-otp`,
  `/identity/consumer/:userId/onboarding`,
  `/corporate-ops/staff/elevate-superadmin`, `/nodes/onboard`,
  `/nodes/operator/inventory`, `/nodes/:id/status`, `/franchise-nodes/onboard-operator`,
  `orders.*`, `maps.*`, `riderOps.*`, `notifications.*`,
  `/payments/webhook/:provider`. Of these, `/nodes/:id/status` and
  `/franchise-nodes/onboard-operator` are defined in `endpoints.ts` but
  **never called anywhere** — dead route definitions, safe to delete.
  `API.md`'s own header states "if something you need isn't here, it isn't
  built yet" — so each of these is either an undocumented-but-real backend
  route, or the frontend is calling something that doesn't exist server-side.
  Not re-verified against a live backend in this pass; flag to backend docs
  owner.
- **`adminService.getTeamMembers()` throws `NOT_IMPLEMENTED` (no backend
  route), and `useAdminTeam()` swallows that into an empty array** (`query.data
  ?? []`) with `query.isError` never surfaced to `TeamManagementScreen`. The
  screen silently renders "no team members" instead of communicating that
  team listing isn't built yet — worth at least showing an `ErrorAlert` for
  this state rather than an indistinguishable empty state. Same silent-empty
  pattern likely worth checking on the other `NOT_IMPLEMENTED` Admin
  dashboard/orders/disputes/analytics screens (all throw by design per
  `admin.service.ts`'s file header, not re-audited screen-by-screen this
  pass since none of those endpoints are in `API.md`).
- **No screens import mock data directly.** `src/core/mocks/*` is dead
  code everywhere except one live fallback: `vendor.service.ts`'s
  `mapInventoryResponse()` defaults to `MOCK_NODES[1]` when the real
  `/nodes/operator/inventory` response is missing a `node` field. Per
  `PROJECT_CONTEXT.md`, this is intentional and scheduled for a deliberate
  cleanup pass at feature-complete, not incidental — not flagged as a bug
  here.
- **No duplicate services found.** Each domain (`auth`, `admin`, `nodes`,
  `vendor`, `rider`, `delivery`) has exactly one real service object; the
  commented-out mock variants share the file but are inert. The one
  legacy/duplicate-looking pair this file used to flag —
  `authService.submitRiderOnboarding` (→ `/identity/rider/:userId/onboarding`,
  undocumented) vs. `riderService.submitVerification` (→ `/riders/onboarding`,
  documented and real) — no longer exists: `submitRiderOnboarding` and
  the undocumented route it called were deleted 2026-08-07 (see
  `docs/HANDOFF.md`). `riderService.submitVerification` is the only
  Rider onboarding path now.

## Out of scope for this file

The app also calls `orders.*`, `maps.*`, `riderOps.*`, `notifications.*`
routes — none of these appear in `docs/API.md`, so there's nothing to
check them against here. Flag to whoever owns the backend docs if this
file should expand to cover them; several (`orders.scanHandoff`,
`orders.scanCollection`, `maps.riderTelemetryPing`, `riderOps.*`) are
live, load-bearing call sites for the Vendor scan-in/release and Rider
job flows, not dead code.
