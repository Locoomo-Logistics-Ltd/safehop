# API_INTEGRATION_STATUS.md

> Full audit of every endpoint documented in `docs/API.md` against the
> current frontend implementation. Verified by reading the live source
> (`core/api/endpoints.ts`, `core/api/services/*.ts`, the module hooks
> that wrap them, and the screens that call those hooks) — not assumed
> from prior documentation. Last audited 2026-08-20 (full endpoint/mock
> audit — see that date's entry below and in
> `docs/IMPLEMENTATION_LOG.md`).
>
> **`docs/API.md` is maintained by the backend/project owner — read it,
> never edit it from a frontend session.** This file is the one that
> gets edited here, to track the frontend's side of the contract.

**2026-09-03 update (node visibility, staff management, dispatch)**:
`docs/API.md` added four endpoints and one field on every Node.

- **`PATCH /node-operators/nodes/:nodeId/visibility`** — an owner
  toggles `isPubliclyVisible` (new on the Node shape, default `true`).
  **This is not a deactivation**, and the UI is worded to avoid saying
  it is: `false` hides the Node from `GET /nodes`/`/nodes/nearby` for
  non-Admins and makes a Consumer-initiated `POST /payments/intents`
  naming it — as origin *or* destination — answer `404`. Handoffs,
  earnings, staff, and receiving another operator's dispatched parcels
  all keep working. Genuine deactivation (`status: inactive`) remains
  Admin-only via `PATCH /nodes/:id`, which explicitly does **not**
  accept `isPubliclyVisible`.
- **`GET /node-operators/nodes/:nodeId/staff`** and **`DELETE
  .../staff/:userId`** — the roster and removal. Closes the "no way to
  see or revoke staff" gap this file flagged on 2026-09-02.
- **`POST /node-operators/nodes/:nodeId/dispatch`** — the operator's
  own outbound parcel, origin fixed to the URL's Node. Open to
  NodeStaff as well as owners.

Two new error codes: `CANNOT_REMOVE_OWNER_MEMBERSHIP` (400),
and `NODE_NOT_ACTIVE` (403) now also covers visibility and dispatch.
All four are wired — see the Node Operators section below. Summary
counts now cover **60** documented endpoints, not 56.

**2026-09-02 update (multi-Node)**: `docs/API.md` turned a Node
Operator from *one account, one Node* into *one account, many Nodes*,
and added a second role that works at a Node. Concretely: the singular
`GET /node-operators/me` is **gone**, replaced by `GET
/node-operators/me/nodes` (an array, `[]` rather than `404` when not
onboarded, each item tagged `roleAtNode: "owner" | "staff"`);
`PATCH /node-operators/me/payout-account` became the per-Node
`PATCH /node-operators/nodes/:nodeId/payout-account`; and two wholly
new routes landed — `POST /node-operators/nodes` (add a 2nd/3rd
location) and `POST /node-operators/nodes/:nodeId/staff/invite` (the
first non-Admin invite path in the API, minting `node_staff`
accounts). All eight `/handoffs/*` operator routes now accept a
**NodeStaff** session as well, and scope to *any* Node the caller is a
member of rather than one. Two new error codes:
`NODE_OPERATOR_NOT_ONBOARDED` (400), `NODE_NOT_ACTIVE` (403). Admin's
`/node-operators/pending` + `/:id/approve` are unchanged in shape but
now mean "approve **one Node**" — an already-active operator's next
location still queues for its own review.

All of it is now wired — see the rewritten Node Operators section
below, plus the Handoffs and Earnings sections. Summary counts now
cover **56** documented endpoints, not 54 (one removed, three added).

**2026-08-28 update**: `docs/API.md` picked up `POST /auth/google`
(Google Identity Services sign-in/signup, one endpoint for both
outcomes) and `GET`/`PATCH /users/me` (self-service profile read/update
— the only way to set `phone`, which registration — password or
Google — no longer collects at all). All three are now wired: a new
`GoogleAuthButton` (Google's own rendered button, wraps the GIS
`accounts.id` client-side script) on `RoleSelectScreen` (signup,
`consentAccepted: true`) and `LoginScreen` (login, no consent/role
sent); a new `usersService`/`CompleteProfileScreen`
(`/complete-profile`) that any login — password or Google — routes to
first whenever the returned `phone` is `null`, before continuing to the
same role-based destination login already used
(`resolvePostAuthRoute`, extracted from `use-auth.ts` so
`loginWithGoogle`/`CompleteProfileScreen` share it instead of
duplicating the NodeOperator-approval-status lookup). See the Auth
section below and `docs/HANDOFF.md`/`docs/IMPLEMENTATION_LOG.md` for
full detail, including why this is Google Identity Services rather than
the `next-auth` dependency already sitting in `package.json` (dead
scaffolding, no `[...nextauth]` route ever existed). Summary counts now
cover **54** documented endpoints, not 51.

**2026-08-26 update**: `docs/API.md` picked up three payout-account
routes with zero prior frontend integration — `GET /payments/banks`,
`PATCH /riders/me/payout-account`, `PATCH /node-operators/me/payout-account`
— plus five `payoutAccount*` fields that were already documented on
`GET /riders/me`/`GET /node-operators/me`/`GET
/admin/revenue-split/entries` but never rendered anywhere. All three
routes are now wired: a new shared `PayoutAccountCard` component
(`components/payout/`) embedded in `RiderVerificationScreen` and
`NodeSetupScreen` lets a Rider/NodeOperator set the bank account Admin
disburses their earnings to; `RevenueSplitScreen`'s entries table gained
a "Payout Account" column with a copy-to-clipboard button so an Admin
can pay without a second lookup, plus the existing "Mark Paid" action
right next to it. A non-dismissible `PayoutReminderBanner` nudges an
unconfigured Rider/NodeOperator on Home and Profile until they set one
up — see the Riders, Node Operators, Payments, and Earnings sections
below. Summary counts now cover **51** documented endpoints, not 48.

**2026-08-24 update**: `docs/API.md` picked up a `destinationFeeNaira`
field on `POST/GET /admin/pricing` (flat fee paid entirely to the
destination Node on order completion, separate from the rider/origin-
Node/platform percentage split), a `destination_node` addition to the
revenue-split `partyType` enum (a fourth row per completed order), and
one wholly new endpoint, `GET /admin/capacity-audit` (read-only
reconciliation report). All three are now wired — see the Admin
Pricing and Earnings sections below and the new Admin Diagnostics
section. Summary counts now cover **48** documented endpoints, not 47.

**Legend**

- ✅ **Fully Integrated** — correct route, correct request body, correct
  response handling, and a real screen driving it with loading/empty/
  success/error states.
- 🟡 **Partially Integrated** — wired to the correct route, but with a
  contract mismatch (wrong param/response shape), a missing automation
  (e.g. no auto-refresh), a UI path that doesn't exist yet, or a
  documented capability the screen doesn't fully expose.
- ❌ **Not Integrated** — no frontend code calls the real route at all.
- ⚪ **No UI Required Yet** — the route is server-to-server or otherwise
  has no frontend call site by design (first used 2026-08-12, by
  `POST /payments/webhooks/paystack` — see the Payments section).

**2026-08-12 update**: `docs/API.md` grew seven new documented
endpoints since the last audit — `POST`/`GET /admin/pricing`,
`POST /payments/intents`, `GET /payments/intents/:id`,
`POST /payments/webhooks/paystack`, and `GET /orders` / `GET
/orders/:id` (plus four new error codes: `INVALID_WEBHOOK_SIGNATURE`,
`NODE_CAPACITY_UNAVAILABLE`, `PAYMENT_PROVIDER_ERROR`,
`PRICING_NOT_CONFIGURED`). **None of these is an "Update" endpoint** —
pricing is explicitly append-only ("this never edits an existing rule,
it adds a new one"), the rest are Create/Read. The one genuine Update
endpoint in the whole API, `PATCH /nodes/:id`, is unchanged by this
diff and was already 🟡 partially integrated (see the Nodes section).
New sections below (Admin Pricing, Payments, Orders) audit these seven
against the live source — summary counts at the bottom now cover all
**30** documented endpoints, not 23.

**2026-08-12 (later same day — integration pass)**: every ❌ row this
file flagged has now been wired, plus the previously-broken `GET
/nodes/nearby` row and the Checkout flow's undocumented-route problem
noted in "Inconsistencies" below. Full detail in
`docs/IMPLEMENTATION_LOG.md`'s matching entry and
`docs/HANDOFF.md`. Short version: **26 ✅ / 3 🟡 / 0 ❌ / 1 ⚪** — the
three remaining 🟡 rows (`/auth/refresh`, `/auth/verify-email`,
`PATCH /nodes/:id`) were already 🟡 before this pass and are unrelated
to it (session refresh interceptor, verify-email route, and Node
Network's "Manage" panel only sending `status` — each still just
missing a UI/plumbing addition to an already-correct method).

**2026-08-14 (Handoffs pass)**: `docs/API.md` grew six more documented
endpoints — the whole `/handoffs/*` module — plus four new error codes
(`RIDER_NOT_ACTIVE`, `RIDER_CAPACITY_UNAVAILABLE`,
`ILLEGAL_ORDER_TRANSITION`, `INVALID_HANDOFF_CODE`). All six are now
wired, with new screens on both sides; see the new Handoffs section
below and `docs/IMPLEMENTATION_LOG.md`'s 2026-08-14 entry.

**2026-08-15 (Collection pass)**: three more — `POST /handoffs/orders/:id/intake`,
`.../collection-code/resend`, `.../collect` — plus
`ORDER_NOT_READY_FOR_COLLECTION`. These close the lifecycle at
`completed`. All three wired, with a new destination-side counter list
and collection screen; see the Handoffs section and
`docs/IMPLEMENTATION_LOG.md`'s 2026-08-15 entry. Summary counts now
cover **39** documented endpoints, not 30:
**31 ✅ / 7 🟡 / 0 ❌ / 1 ⚪**.

All four Handoffs 🟡 rows share a single cause — the destination
operator cannot resolve an order uuid — and would all go ✅ on one
backend change. See Inconsistencies item 2.

This module supersedes several of the undocumented routes the
"Inconsistencies" section below has been flagging — `riderOps.jobBoard`,
`riderOps.acceptJob`, `riderOps.scanPickup`, `riderOps.scanDropoff`, and
`orders.scanHandoff`. The Node operator's scanner no longer calls
`orders.scanHandoff`; the Rider screens that call `riderOps.*` still
exist but are no longer reachable from nav. See that section for the
current state of each.

**2026-08-20 (full endpoint/mock audit)**: every literal endpoint
string in `core/api/endpoints.ts` re-checked against all 44 routes
documented in the current `docs/API.md`. Found and removed six
undocumented call sites (`/nodes/operator/inventory` via the dead Flag
Issue screen, `/corporate-ops/staff/elevate-superadmin` via Super
Admin's elevation form, `/maps/rider/telemetry-ping` and
`/maps/track/:code` — both dead code with zero callers, `/admin/rider-
earnings` via the old Rider Earnings screen) plus three dead-and-
undocumented unused constants (`franchiseNodes.onboardOperator`,
`nodes.onboard`, `nodes.updateStatus`). Wired the three new documented
Earnings endpoints (`GET /earnings/mine`, `GET /earnings/my-node`,
`admin/revenue-split` group) that had zero integration before this
pass — see the new Earnings section below. `/auth/consumer/request-
otp`/`request-login-otp` remain undocumented and live but were
explicitly left unwired-to-real-auth at the user's direction this
session — see Inconsistencies. Full detail in
`docs/IMPLEMENTATION_LOG.md`'s 2026-08-20 entry, including the
same-session Vendor→Node rename (every `vendor*` identifier/route in
this file's rows below now reads `node*` — a naming change only,
not a re-verification of any endpoint's behavior).

## Auth

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| POST | `/auth/register` | Consumer + Rider + NodeOperator self-registration | ✅ | `RoleSelectScreen` (`/role-select`) → `CreateAccountScreen` (`/create-account?role=`) | `authService.registerConsumer` via `useAuth().register` | None. **2026-08-07**: `RoleSelectScreen`'s Rider/NodeOperator options now route to `/create-account?role=rider` / `?role=node_operator` (previously routed to now-deleted undocumented-flow screens); `CreateAccountScreen` reads `?role=` and includes it in the payload — all three self-registerable roles now reachable through this one documented endpoint, exactly as `API.md` describes ("This is the same endpoint for all three allowed roles"). Also fixed the client-side password strength meter (uppercase/lowercase/number/special) that contradicted `API.md`'s explicit "don't build a strength meter" guidance — now length-only (≥12 chars), matching `ResetPasswordScreen`. Also fixed a bug where a successful registration was incorrectly treated as a login (`setSession()` called with no server-side cookie ever issued) — `API.md` states registration does not log the user in; the hook now just routes to `/login`. **2026-08-28**: `phone` removed from the request payload — `API.md` dropped it from this route entirely (every account now starts `phone: null` regardless), so `RegisterConsumerPayload` no longer has the field and `CreateAccountScreen`'s phone input is gone; see the new `/users/me` rows below for where it's actually set. |
| POST | `/auth/login` | Consumer + Rider + NodeOperator + Admin login | ✅ | `LoginScreen`, `AdminLoginScreen` (`/admin-login`) | `authService.loginConsumer` / `loginAdmin` via `useAuth().login` | None — role-agnostic per `API.md`, all four roles correctly share the one real route with `credentials:"include"`. **2026-08-07**: post-login redirect is role-aware (`session.user.role`) — NodeOperator → `/node/setup` (route renamed 2026-08-20, was `/vendor/node-setup`), Consumer → `/dashboard` — previously hardcoded to `/dashboard` for every role, and unreachable by Rider/NodeOperator anyway since they didn't go through this endpoint yet. **2026-08-07 (later, gating pass)**: Rider → `/rider/home` (changed from `/rider/verification`) — a not-yet-verified Rider now lands on Home with a dismissible verification reminder instead of being forced straight into the verification form; see the Riders section below and `docs/HANDOFF.md` for the product reasoning. **2026-08-28**: the redirect logic moved into a shared `resolvePostAuthRoute(user)` helper (`modules/user/lib/auth-routing.ts`) so `POST /auth/google` below can reuse the exact same role map instead of duplicating it; `loginMutation.onSuccess` now also checks `session.user.phone` first and routes to `/complete-profile` when it's `null` before ever reaching that helper. |
| POST | `/auth/google` | Google sign-in/signup (one endpoint, both outcomes) | ✅ | `RoleSelectScreen` (`/role-select`, signup — `consentAccepted: true`), `LoginScreen` (`/login`, login — no consent/role sent) | `authService.loginWithGoogle` via `useAuth().loginWithGoogle` | **New 2026-08-28.** `GoogleAuthButton` (`modules/user/components/auth/`) loads Google Identity Services' own script client-side (`https://accounts.google.com/gsi/client`) and renders Google's own button — the ID-token flow this route documents only hands back a credential through GIS's own UI, so this isn't a custom-styled button. Requires `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; left unset (as in this repo's `.env`/`.env.local`), the button renders a disabled "unavailable" state rather than crashing, same degrade pattern as the Geoapify/Google Maps keys. **Not exercised against a live backend or a real Google Cloud OAuth client** — no real `NEXT_PUBLIC_GOOGLE_CLIENT_ID` was available this session. `CONSENT_REQUIRED` (login attempted with no existing account) gets a tailored inline message + "Sign up with Google instead" link on `LoginScreen`, not just the generic `getFriendlyError` copy. |
| GET | `/users/me` | Self-service profile read | ⚪ | none directly — see `PATCH` row below | `usersService.getMe` | **New 2026-08-28, wired but not called anywhere.** The app currently only ever needs the cached session's `phone` (already present on every `AuthSession`), so nothing calls this yet — a future "refresh my profile" action would use it. Not a screenless-integration violation in the same sense as other rows flagged that way elsewhere in this file: the service method exists for completeness with `PATCH` below, per docs/API.md documenting both together, but has no dedicated UI trigger of its own. |
| PATCH | `/users/me` | Set/update phone number | ✅ | `CompleteProfileScreen` (`/complete-profile`) | `usersService.updateMe` via `useCompleteProfile` | **New 2026-08-28.** Shown after *any* successful login (password or Google) whose `session.user.phone` is `null` — registration no longer collects it at all per `API.md`. Also linked as "Add phone number" from the Phone row on all four roles' Profile screens (`ProfileScreen`/`NodeProfileScreen`/`RiderProfileScreen`/`AdminProfileScreen`) whenever it's still unset, so a user isn't limited to the one moment right after login to fill it in. **Known gap**: NodeOperator/Rider onboarding (`POST /node-operators/onboarding`/`POST /riders/onboarding`) now returns `400 PROFILE_INCOMPLETE` until phone is set — `getFriendlyError` has a case for it, but neither onboarding screen deep-links to `/complete-profile` from that specific error, just shows the generic copy+action text. |
| POST | `/auth/refresh` | Session refresh | ✅ | none directly (interceptor, not screen-driven) | `authService.refreshSession`, called internally by `core/api/client.ts` | **Fixed 2026-08-12 (later — live debugging session).** `httpClient`'s `request()` now catches any `401 UNAUTHENTICATED` (except on `/auth/*` routes and `skipAuth` calls), fires one refresh attempt, and retries the original call once. Concurrent 401s share one in-flight refresh (`refreshPromise`) so a second caller doesn't independently trigger `401 INVALID_REFRESH_TOKEN` against the now-rotated, single-use token. A failed refresh clears the session (`useAuthStore` + `localStorage`) and hard-redirects to `/login`, per `API.md`'s "treat as a hard sign-out" instruction. This was surfaced by a real user report: `GET /nodes/nearby` returning `401` for a logged-in Consumer testing the Select Nodes screen — an expired, never-refreshed 15-minute access token. |
| POST | `/auth/logout` | Logout | ✅ | Profile screens' "Log out" action | `authService.logout` via `useAuth().logout` | None. |
| POST | `/auth/password-reset/request` | Forgot password | ✅ | `ForgotPasswordScreen` (`/forgot-password`) | `authService.requestPasswordReset` | None functionally. Leftover `console.log`/`console.error` debug statements should be removed before ship. |
| POST | `/auth/password-reset/confirm` | Reset password | ✅ | `ResetPasswordScreen` (`/reset-password`) | `authService.confirmPasswordReset` | None — reads `token` from query string, correct password rules (12–128 chars, no composition), handles missing-token and success states. |
| POST | `/auth/verify-email` | Email verification | ✅ | `VerifyEmailScreen` (`/verify-email`) | `authService.verifyEmail` via `useAuth().verifyEmail` | None — new 2026-08-26, closes the standing "build a /verify-email route/screen" item on this file's priority list. Reads `token` from the query string and fires the verify call automatically on mount (no further input needed, unlike the reset/invite equivalents). No "resend" endpoint exists per `docs/API.md`, so an invalid/expired/used token points onward to Login rather than offering a retry; a genuine network/server error does offer "Try Again". |
| POST | `/users/invite` | Admin invites staff | ✅ | `InviteMemberForm`, Team Management (`/admin/team`) | `adminService.inviteStaff` via `useInviteStaff` | Errors surface via `getErrorMessage(error)` (generic `error.message` toast only) instead of `getFriendlyError(error)` (which extracts per-field `error.details`). A `400 VALIDATION_FAILED` on this form shows "Validation failed" with no indication of which field. |
| POST | `/auth/invite/confirm` | Accept invite | ✅ | `AcceptInviteScreen` (`/accept-invite`) | `authService.confirmInvite` via `useAuth().confirmInvite` | None — handles `VALIDATION_FAILED` (field messages), `INVALID_INVITE_TOKEN`, and `RATE_LIMITED`. |

## Nodes

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| POST | `/nodes` | Admin creates a Node | ✅ | `OnboardNodeForm`, Node Network (`/admin/nodes`) | `adminService.onboardPartnerNode` via `useOnboardNode` | Fields match the real body exactly. Same generic-toast validation issue as `/users/invite` above (`getErrorMessage`, not `getFriendlyError`). |
| GET | `/nodes` | Admin lists Nodes | ✅ | Node Network screen (`NodeNetworkScreen`) | `adminService.getNodeStatuses` via `useAdminNodes` | Fetches `limit=100` with no pagination UI — fine while the network is small, will silently truncate past 100 Nodes. |
| GET | `/nodes/nearby` | User picks a pickup Node | ✅ | `GoogleMapView`, Select Nodes (`/delivery/select-nodes`) | `nodesService.listNearby` via `useNodes` | **Fixed 2026-08-12.** Was sending `radiusInMeters` and parsing a flat array; now sends `radiusKm` and unwraps the paginated `{items,...}` envelope, mapping into a new `PickupNode` type (real fields: `city`/`state`/`capacity` as a raw number/`operatingHours`, no fabricated `isOpenNow`/`capacity.occupied`). **2026-08-20**: `LocoomoNode` (the type this row deliberately left untouched) is now unused for real — its one live consumer, `node.service.ts`'s `mapInventoryResponse()`, was deleted along with the rest of the dead Flag Issue feature (see Inconsistencies). `MockMapView.tsx` (`@deprecated`, unused by the active screen) still references the old `LocoomoNode` shape and was left untouched. |
| GET | `/nodes/:id` | Admin views Node detail | ✅ | Node Network's "View Details" expand | `adminService.getNodeDetail` | None. **2026-08-12**: also reused by `nodesService.getById` (Consumer side) — same route, any authenticated role per `API.md`, previously had a hacky "search nearby and filter" workaround instead. |
| PATCH | `/nodes/:id` | Admin approves/suspends/edits a Node | 🟡 | Node Network's "Manage" panel | `adminService.updateNode` via `useManageNode` | Correctly wired, but the UI only ever sends `{status}` (approve/suspend/reactivate). `name`/`address`/`capacity`/`operatingHours`/etc. are all editable per `API.md` but no form exposes them. Same generic-toast validation issue as above. |

## Node Operators

Rewritten 2026-09-02 for multi-Node, extended 2026-09-03. The
account↔Node relationship is a *membership*, not a profile:
`roleAtNode` (`owner`/`staff`) decides what a session can do at a given
Node; approval, payout accounts, public visibility and staff are all
per-Node; and `node_staff` is a real role in `UserRole` admitted to the
`(node)` route group alongside `node_operator`.

Owner-only vs. membership-only is worth stating once, because the split
isn't intuitive: **owner** gets payout account, visibility, and staff
management (all three answer `404` — not `403` — for a staff
membership, so the UI hides them rather than rendering a form that can
only fail). **Any member, owner or staff**, gets every handoff route
*and* dispatch — that's counter work, and the API says so explicitly.

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| POST | `/node-operators/onboarding` | Node Operator sets up their **first** Node | ✅ | `MyNodesScreen` (`/node/setup`) — its empty state is the onboarding form, unchanged from the pre-multi-Node first-run experience | `nodeService.onboardNode` via `useNodeSetup().createNode` | None. `createNode` picks between this and `POST /node-operators/nodes` on whether the fetched list is empty, so no form has to encode that server-side rule; if the list is stale the API's `409`/`400` both map to copy pointing at the other path. |
| POST | `/node-operators/nodes` | Node Operator adds a 2nd/3rd location | ✅ | `AddNodeScreen` (`/node/nodes/new`), reached from My Nodes' "Add Another Station" and the `NodeSwitcher`'s "Manage stations" | `nodeService.addNode` via the same `useNodeSetup().createNode` | None — new 2026-09-02. Same `NodeOnboardingForm` as first-time onboarding (extracted from the old `NodeSetupScreen` so the two can't drift), `variant` changing copy only. On success it selects the new station and routes to its detail page. |
| GET | `/node-operators/me/nodes` | Every Node this account **owns** a membership at | ✅ | `MyNodesScreen`, `NodeDetailScreen` (`/node/nodes/[nodeId]`), `NodeSwitcher` (Home + Activity headers), `NodeHomeScreen`, `NodeProfileScreen`, and `resolvePostAuthRoute`'s post-login redirect | `nodeService.getMyNodes` via `useMyNodes` (owner path only) | Replaced the removed singular `GET /node-operators/me`. Not-onboarded is now an empty array, not a `404`, and every caller checks that instead. **Owner-only, confirmed live 2026-09-09** — a `node_staff` session gets a plain `403 FORBIDDEN` here. ~~"Called for every session in the Node app, staff included" (corrected 2026-09-08)~~ — **that correction was wrong and is itself retracted 2026-09-09**: the reasoning ("`roleAtNode`'s own `"staff"` value implies a list an owner alone could call would never need it") was a plausible theory this backend doesn't honor. Never call this route for a `node_staff` session; `useMyNodes` now reconstructs a staff session's stations from `GET /handoffs/my-node/orders` + `GET /nodes/:id` instead (both confirmed staff-accessible) — see that hook's header and the new row below. `roleAtNode` still gates only what a member may *change* (payout, visibility, team — all three `404` for staff even on the owner path), never whether they can see their own station; that principle survived the correction, only the "one endpoint for both roles" mechanism didn't. |
| GET | `/nodes/:id` (staff fallback path) | Enriches a `node_staff` session's discovered station id(s) into real Node records | ✅ | Same call sites as above, for a staff session specifically | `nodeService.getNodeById` via `useMyNodes`'s staff branch, `useQueries` (one call per discovered id, in parallel) | None — new 2026-09-09, added specifically to fix the `403` above. This route was already used elsewhere (`nodesService.getById`, Consumer-facing, narrower `PickupNode` shape) but not for the full `NodeOperatorNode` shape (`status`/`isPubliclyVisible` included) a Node-module screen needs; `getNodeById` is that fuller fetch. A `404` here (a discovered station later suspended by Admin — this route's own documented non-Admin behavior) is treated as "this station silently drops from the list," not a hook-level error, so one suspended station doesn't take down a staff member's others. |
| PATCH | `/node-operators/nodes/:nodeId/payout-account` | Node Operator sets/replaces **one Node's** payout bank account | ✅ | `PayoutAccountCard` (shared component) embedded in `NodeDetailScreen`, per station — moved off the account-wide setup screen, since payout accounts are per-Node now | `nodeService.setPayoutAccount(nodeId, payload)` via `useNodeSetup` | None. The mutation is shared across stations, so its in-flight/saved/error state is scoped by `payoutAccountNodeId` — saving station A's account can't flash state onto station B's card. Owner-only (the route `404`s for a staff membership), so the card isn't rendered for one. `NodeHomeScreen`'s nudge now links to the active station's own page; `NodeProfileScreen`'s row counts how many stations still need one. |
| POST | `/node-operators/nodes/:nodeId/staff/invite` | Node owner invites counter staff | ✅ | `NodeStaffCard` on `NodeDetailScreen` | `nodeService.inviteNodeStaff` via `useNodeStaff` | None. Goes through the same invite-email → `POST /auth/invite/confirm` mechanism as Admin's `/users/invite`, so `AcceptInviteScreen` needed no changes. Hidden on a non-`active` Node (the route's `403 NODE_NOT_ACTIVE`). **2026-09-03**: moved from the invite-only `NodeStaffInviteCard` into `NodeStaffCard` alongside the roster below; the success copy says the invitee appears "once they accept", because the roster lists *active* memberships and an invite isn't one yet. |
| GET | `/node-operators/nodes/:nodeId/staff` | This station's active staff roster | ✅ | `NodeStaffCard`'s roster on `NodeDetailScreen` | `nodeService.getNodeStaff` via `useNodeStaff` | None — new 2026-09-03. Closes the gap the row above used to carry. Owner-only, so it's only queried for an `owner` membership. This is the only place a staff member's `userId` exists after the one-time invite response, so the remove action below is fed exclusively from these rows. |
| DELETE | `/node-operators/nodes/:nodeId/staff/:userId` | Node owner revokes a staff member | ✅ | Per-row "Remove" in `NodeStaffCard`, with inline second-tap confirmation (`components/ui` has no modal primitive, and revoking access shouldn't be a one-tap accident) | `nodeService.removeNodeStaff` via `useNodeStaff` | None — new 2026-09-03. **First `204 No Content` route in the API**: `core/api/client.ts`'s `rawRequest` previously threw on an empty body, and now returns `undefined` for an empty *successful* response (the malformed-response guard is unchanged and still throws). `400 CANNOT_REMOVE_OWNER_MEMBERSHIP` is unreachable from this UI — the roster never lists owners — but is mapped in `getFriendlyError` anyway. |
| PATCH | `/node-operators/nodes/:nodeId/visibility` | Owner opens/closes a station to public drop-offs | ✅ | `NodeVisibilityCard` on `NodeDetailScreen`; the resulting state also shows on `NodeHomeScreen` (a standing banner), `MyNodesScreen`, `NodeSwitcher`, `NodeProfileScreen`, and Admin's `NodeStatusCard` | `nodeService.setNodeVisibility` via `useNodeVisibility` | None — new 2026-09-03. **Labelled "Public drop-offs", never "Deactivate"** — see this file's 2026-09-03 header note for why that distinction is load-bearing rather than cosmetic; every piece of copy states what keeps working. Disabled (not hidden) on a non-`active` Node with the reason shown, since the route answers `403 NODE_NOT_ACTIVE` and the owner can only wait. No optimistic update: an operator reads this state back to decide whether they're taking walk-ins. |
| POST | `/node-operators/nodes/:nodeId/dispatch` | Station sends its own parcel | ✅ | `DispatchScreen` (`/node/dispatch`), reached from a new "Send" nav tab in **both** `NODE_NAV_ITEMS` and `NODE_STAFF_NAV_ITEMS` | `nodeService.dispatchParcel` via `useDispatchParcel` | None — new 2026-09-03. Membership-gated, not owner-gated, per the route's own wording. One screen rather than the Consumer's four-step wizard (no origin to pick, no method step). Destination picker is `GET /nodes/nearby` centred on the **origin station's own coordinates**, so it needs no geolocation permission and sorts by distance from the counter; the origin itself is filtered out client-side. Ends in the same Paystack redirect as Checkout. See "Inconsistencies" for the two backend gaps this exposed. |
| GET | `/node-operators/pending` | Admin's **Node** review queue | ✅ | `ApprovalsScreen` (`/admin/approvals`, "Nodes" tab) | `adminService.getPendingNodeOperators` via `useNodeOperatorApprovals` | None. **2026-09-02**: queues Nodes, not operators — the same `userEmail` legitimately appears more than once, one row per pending Node, and the tab/copy were reworded accordingly. |
| PATCH | `/node-operators/:id/approve` | Admin approves **one Node** | ✅ | Same screen, "Approve" button per row | `adminService.approveNodeOperator` via `useNodeOperatorApprovals` | None. **2026-09-02**: return type corrected to `NodeMembership` (the route answers with the approved membership, not the queue row), and the toast reworded from "Node operator approved" to name the station. |

## Riders

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| GET | `/riders/verification/upload-signature` | Rider KYC — get Cloudinary signature | ✅ | `RiderVerificationScreen` (`/rider/verification`) | `riderService.getVerificationUploadSignature` via `useRiderVerification` | None — only sends `documentType: "rating_screenshot"`, the one documented value. |
| POST | `/riders/onboarding` | Rider KYC — submit verification | ✅ | Same screen | `riderService.submitVerification` via `useRiderVerification` | None. Upload flows client-side straight to Cloudinary first (`uploadVerificationDocument`), then submits the resulting `public_id` — matches `API.md`'s "file bytes never pass through this API" instruction exactly. `licenseNumber` (added to `docs/API.md` 2026-08-17, self-reported, no document check) is now a required field on the form and the payload; existing riders' profiles show `null` until they resubmit, which the form doesn't currently prompt for — a re-verification nudge would need a product decision, not a frontend one. |
| GET | `/riders/me` | Rider checks verification status | ✅ | `RiderVerificationScreen`, `RiderHomeScreen`'s reminder sheet, `AvailableJobsScreen`'s gate (this row's "`JobOfferScreen`" was stale — that screen was deleted 2026-08-15, superseded by `AvailableJobsScreen`, which carries the same gate), Rider Profile's "Verification" row **and** (new 2026-08-21) its "Vehicle Details" card | `riderService.getVerificationProfile` via `useRiderVerification` (called independently from each of those call sites, same query key — TanStack Query dedupes) | None. Drives all three states correctly (`404`→form, `pending`→under-review, `active`→dashboard link) on the verification screen itself — **2026-08-21**: the `active`/`pending` views now share one layout showing employer/license/the uploaded document image inline, instead of `active` showing none of it. Also gates `data.status !== "active"` on `AvailableJobsScreen` and drives a dismissible reminder on `RiderHomeScreen`. **2026-08-21**: `RiderProfileScreen`'s "Vehicle Details" card now reads `data.licenseNumber` here too — replacing a fabricated, permanently-`NOT_IMPLEMENTED` "vehicle" call that never had a real route (see Inconsistencies). Deliberately **not** gated on Home/Earnings/Profile — those stay browsable pre-approval (product decision, see `docs/HANDOFF.md`). **2026-08-26**: response now also carries the five `payoutAccount*` fields — see the row below. |
| PATCH | `/riders/me/payout-account` | Rider sets/replaces payout bank account | ✅ | `PayoutAccountCard` (new shared component, `components/payout/`) embedded in `RiderVerificationScreen`'s status view (both pending and active states — the real route only requires onboarding to be complete, not approval) | `riderService.setPayoutAccount` via `useRiderVerification` | None — new 2026-08-26. Bank picker sourced from `GET /payments/banks` (`getPayoutBanks`), same hook. `RiderHomeScreen` (persistent banner, not dismissible) and `RiderProfileScreen` (a status row, same pattern as the Verification row) both nudge off `payoutAccountConfigured` until this is called once — "keep prompting until it's set" was an explicit ask, so unlike the KYC reminder sheet this one doesn't have a "maybe later." |
| GET | `/riders/pending` | Admin's Rider review queue | ✅ | `ApprovalsScreen` (`/admin/approvals`, "Riders" tab) | `adminService.getPendingRiders` via `useRiderApprovals` | None — new 2026-08-12. Shows a "View screenshot" link to the pending Rider's signed `viewUrl` document alongside each row. |
| PATCH | `/riders/:id/approve` | Admin approves a Rider | ✅ | Same screen, "Approve" button per row | `adminService.approveRider` via `useRiderApprovals` | None — new 2026-08-12. Closes the gap this row used to describe: a Rider who completes verification can now be moved to `active` through the UI, reaching the job board. |

## Admin Pricing

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| POST | `/admin/pricing` | Admin sets a new pricing rule | ✅ | `AddPricingRuleForm`, `PricingScreen` (`/admin/pricing`) | `adminService.createPricingRule` via `useCreatePricingRule` | Same generic-toast validation issue as `/users/invite`/`/nodes` above (`getErrorMessage`, not `getFriendlyError`). **2026-08-24**: form and payload extended with `destinationFeeNaira` (a flat fee paid entirely to the destination Node — see the Earnings section's `destination_node` party type below), required alongside the other two fields. |
| GET | `/admin/pricing` | Admin views rate history | ✅ | Same screen — table below the form, newest-first, top row marked "Current" | `adminService.getPricingRules` via `usePricingRules` | None. `/admin/pricing` has no home in the original 8-frame design; placed as a new nav item next to "Approvals" (see `nav-config.ts`'s comment). This closes the real gap the pre-2026-08-12 audit flagged: Consumer checkout (`POST /payments/intents`) depends on a pricing rule existing, and there was previously no Admin-facing way to create one. **2026-08-24**: table gained a "Destination Fee" column reading `rule.destinationFeeNaira`. |
## Earnings (revenue split)

New 2026-08-20. Every `completed` order's fee is split rider/origin-Node/platform per an Admin-configured ratio — see `docs/API.md`'s "Earnings (revenue split)" section. **Supersedes `GET /admin/rider-earnings`**, an endpoint the 2026-08-17 session wired `RiderEarningsScreen` to that never actually appeared in `docs/API.md` — deleted, see Inconsistencies.

**2026-08-24**: `docs/API.md` added a fourth party type, `destination_node` — a flat fee (`PricingRule.destinationFeeKobo`, set on `POST /admin/pricing`) paid entirely to the destination Node, a separate line item from the rider/origin-Node/platform percentage split (so tuning that ratio never changes what a destination Node earns and vice versa). Every `completed` order now produces four `revenue_split_entries` rows, not three. `RevenueSplitPartyType` (`earnings.types.ts`) widened accordingly; `RevenueSplitScreen`'s party label map and filter both cover it now.

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| POST | `/admin/revenue-split` | Admin sets the split ratio | ✅ | `SetRevenueSplitRatioForm`, `RevenueSplitScreen` (`/admin/revenue-split`) | `adminService.createRevenueSplitRatio` via `useCreateRevenueSplitRatio` | None — new 2026-08-20. Client-side validates the three percentages sum to exactly 100 before enabling submit, mirroring the server's `400 INVALID_REVENUE_SPLIT`. Same generic-toast validation issue as `/users/invite`/`/nodes` above. |
| GET | `/admin/revenue-split` | Admin views ratio history | ✅ | Same screen — "Current split" card reads the newest entry | `adminService.getRevenueSplitRatios` via `useRevenueSplitRatios` | None — new 2026-08-20. |
| GET | `/admin/revenue-split/entries` | Admin views payout-readiness entries | ✅ | Same screen — filterable table, `partyType`/`payoutStatus` | `adminService.getRevenueSplitEntries` via `useRevenueSplitEntries` | Requested at `limit=100`, no pagination UI yet. **2026-08-24**: `partyType` filter's `<select>` now offers `destination_node` alongside rider/node/platform. |
| PATCH | `/admin/revenue-split/entries/:id/mark-paid` | Admin marks an entry settled off-system | ✅ | Same screen, "Mark Paid" per pending row | `adminService.markRevenueSplitEntryPaid` via `useMarkRevenueSplitEntryPaid` | None — new 2026-08-20. No request body, idempotent per `API.md`. **2026-08-26**: the same table now has a "Payout Account" column reading the five `payoutAccount*` fields `GET .../entries` already returned (see the row above) but the screen never rendered — bank name + account number + account name, with a copy-to-clipboard button (`PayoutAccountCell`, this screen only) next to it, so the Admin doesn't need a second lookup before running a transfer. Reads "Not set up" when the party hasn't configured a payout account yet. |
| GET | `/earnings/mine` | Rider views own earnings | ✅ | `EarningsStatCards`/`RiderHomeScreen`, `RiderProfileScreen`'s stat row, `MyEarningsScreen` (`/rider/deliveries`, "Earnings" nav tab) | `riderService.listMyEarnings`/`getEarningsSummary` via `useMyEarnings` (list), `useRiderEarnings` (reduced today/total summary) | None — new 2026-08-20, closes a real gap (`getEarningsSummary()` previously `NOT_IMPLEMENTED`, no endpoint existed). No server-side "today" filter or rating field — summary is reduced client-side from the full entry list; `RiderEarningsSummary` no longer carries a `rating` field (nothing in the real API supplies one). |
| GET | `/earnings/my-node` | NodeOperator views this Node's earnings | ✅ | `NodeEarningsScreen` (`/node/earnings`, reached from Node Profile) | `nodeService.getMyNodeEarnings` via `useNodeEarnings` | None — new 2026-08-20, first integration of this route (previously zero frontend calls). Only shows entries where this Node was the *origin*, per the documented split rule. |

## Payments

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| POST | `/payments/intents` | Consumer places an order (fee calc + Node capacity reservation + Paystack checkout) | ✅ | `CheckoutScreen` (`/checkout`) | `deliveryService.createPaymentIntent` via `useCheckout` | **Rebuilt 2026-08-12.** `CheckoutScreen` now creates the intent once per visit (guarded against double-fire), shows the real `feeBreakdown`, and "Confirm & Pay" redirects to the returned `authorizationUrl`. Replaces the old `useCreateDelivery` → `ENDPOINTS.orders.book`/`orders.calculate-fare` flow (undocumented routes, never actually collected payment — `deliveryService.pay()` was a no-op re-fetch). No payment-method picker in-app anymore — Paystack's hosted page presents card/bank/USSD, the real payload has no such field; `PaymentMethodSelector.tsx` was deleted as genuinely dead code. **Not verified against a live backend** — no real Node capacity reservation or Paystack redirect has been exercised this session (see `docs/HANDOFF.md`). |
| GET | `/payments/intents/:id` | Consumer polls payment status after the Paystack redirect | ✅ | `PaymentCallbackScreen` (`/orders/payment-callback`) | `deliveryService.getPaymentIntent` via `usePaymentIntentStatus` | **New 2026-08-12.** Polls every 2.5s (capped at ~90s) while `status: "pending"`; on `"paid"` looks up the resulting Order via `GET /orders` (no dedicated "order by intent id" route exists) and forwards to the success screen; `"failed"`/`"expired"`/timeout each get a distinct retry state. The intent id is recovered from `sessionStorage` (set right before the Paystack redirect), not the callback URL's query string — `API.md` doesn't document what Paystack appends there. **Not verified against a live backend.** |
| POST | `/payments/webhooks/paystack` | Paystack → backend payment confirmation | ⚪ | n/a | n/a | Server-to-server only per `API.md` ("your frontend never does" this) — correctly has no frontend call site. Listed here for completeness, not a gap. |
| GET | `/payments/banks` | Bank list, for a payout-account bank picker | ✅ | `PayoutAccountCard`'s bank `<select>`, used by both `RiderVerificationScreen` and `NodeSetupScreen` | `riderService.getPayoutBanks` / `nodeService.getPayoutBanks` (same endpoint, one method per domain service — matches this file's "no cross-domain service" convention rather than introducing a shared one for a single GET) via `useRiderVerification` / `useNodeSetup` | None — new 2026-08-26. Not paginated per `API.md`; fetched once (`staleTime: Infinity`, `QUERY_KEYS.payoutBanks`, shared cache key across both roles) since it's a static reference list. |

## Admin Diagnostics

New 2026-08-24. `GET /admin/capacity-audit` — no prior frontend integration at all (confirmed via grep before starting: zero references to `capacity-audit` anywhere in `src/`). Read-only reconciliation report comparing the stored `RiderProfile.currentActiveOrderCount`/`Node.currentCount` counters against freshly-computed expected values.

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| GET | `/admin/capacity-audit` | Admin views the rider/Node capacity reconciliation report | ✅ | `CapacityAuditScreen` (`/admin/capacity-audit`, new nav item, last in `ADMIN_NAV_ITEMS`) | `adminService.getCapacityAudit` via `useCapacityAudit` | None — new 2026-08-24. Manual "Refresh" button, no auto-polling (a diagnostic pull, not a live feed). No write/reconcile action exists on the screen since `docs/API.md` documents no mutation sibling for this route — surfacing the drift is the whole job. |

## Orders

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| GET | `/orders` | Consumer's own order list | ✅ | `TrackListScreen`, `PastDeliveriesSection`, `ActiveDeliveriesSection` | `deliveryService.list` via `useDeliveries` | **Rebuilt 2026-08-12.** `deliveryService.list()` now returns the real `Order` type (`core/types/payment.types.ts`) matching `API.md`'s documented shape exactly — no more mapping into the fictional `Delivery` type. Active/past split is a best-effort heuristic (`isTerminalOrderStatus`, keyword-matching on the status string) since `API.md` only confirms one status value (`"awaiting_drop_off"`) and doesn't enumerate the rest of the lifecycle. **Not verified against a live backend** — the heuristic and `OrderStatusBadge`'s fallback rendering are built to degrade gracefully for any status string, but haven't seen a real one beyond the single documented example. |
| GET | `/orders/:id` | Consumer's own order detail | ✅ | `TrackPackageScreen`, `OrderSuccessScreen`, `PaymentCallbackScreen` | `deliveryService.getById` via `use-delivery.ts` | **Rebuilt 2026-08-12**, same shape correction as the row above. `TrackPackageScreen`'s old "Tracking History" event-log section was removed rather than faked — the real Order response has no such field, only a single current `status`. |

## Summary

**60** endpoints documented in `API.md` as of 2026-09-03 (up from 54 at
the 2026-08-28 audit — multi-Node turned the Node Operators group from
5 routes into 8, plus visibility/staff-management/dispatch added 4
more; see the 2026-09-02 and 2026-09-03 update notes above). **Every
one has a row in this file** (verified by a 1:1 diff of every
`### METHOD /api/v1/...` header in `API.md` against every table row
here — no gaps either direction; the table's `GET /nodes/:id` appears
twice on purpose, once for its original Node-detail use and once for
the staff-fallback path `useMyNodes` added, both the same documented
endpoint). **57 ✅ Fully Integrated** (up from 51 — the seven
multi-Node/staff/visibility/dispatch rows added 2026-09-02/09-03, see
their rows above), **1 🟡 Partially Integrated** (`PATCH /nodes/:id`),
**0 ❌ Not Integrated**, **2 ⚪ No UI Required Yet** (`GET /users/me`
joins the pre-existing one below).

### Recommended implementation priority

0. ~~**Rebuild the Checkout/order-placement flow against `POST
   /payments/intents`**~~ **Done (2026-08-12).** `CheckoutScreen` now
   creates a real payment intent and redirects to Paystack; a new
   `/orders/payment-callback` screen polls `GET /payments/intents/:id`
   and forwards to the real Order once paid. **Not verified against a
   live backend** — no real Paystack account/webhook was available this
   session (see `docs/HANDOFF.md`'s "Potential risks").
1. ~~**Fix `GET /nodes/nearby`**~~ **Done (2026-08-12).** Sends
   `radiusKm` now, unwraps the paginated envelope, maps into a new
   `PickupNode` type with only the fields the real response has.
2. ~~**Build the two Admin approval-queue screens**~~ **Done
   (2026-08-12).** `ApprovalsScreen` (`/admin/approvals`) covers both
   NodeOperator and Rider review queues in one screen (tabbed).
3. ~~**Wire a `401` → `refresh` → retry interceptor**~~ **Done
   (2026-08-12, later — live debugging session).** See the `/auth/refresh`
   row above.
4. ~~Remove the client-side password strength meter in
   `CreateAccountScreen`~~ **Done (2026-08-07)** — replaced with the
   length-only check `API.md` calls for.
5. **Switch Admin-form error handling from `getErrorMessage` to
   `getFriendlyError`** (`useOnboardNode`, `useInviteStaff`,
   `useManageNode`, and now also `useCreatePricingRule`/
   `useNodeOperatorApprovals`/`useRiderApprovals`) so `400
   VALIDATION_FAILED`'s per-field `error.details` actually reach the
   user instead of a generic toast. Still open.
6. ~~**Build a `/verify-email` route/screen** to actually call the
   already-wired `authService.verifyEmail` — currently dead code.~~
   **Done (2026-08-26).** `VerifyEmailScreen` at `/verify-email`.
7. Lower priority, still open: expose `name`/`address`/`capacity`/etc.
   editing on `PATCH /nodes/:id`'s "Manage" panel (only `status` is
   exercised today); add pagination to `GET /nodes` once the network
   exceeds 100 entries.
8a. **New from a live debugging session, same day (2026-08-12,
   later still)** — a real user testing the Consumer flow reported
   "no stations available" on Select Nodes despite one `active` Node
   existing. Root-caused to three stacked issues, all fixed:
   - `SelectNodesScreen` swallowed any `nodes/nearby` fetch error into
     the same "No stations match" text as a genuine empty result —
     added an `ErrorAlert` banner driven by `useNodes()`'s (already
     returned but unused) `isError`/`error`.
   - The actual error was `401 UNAUTHENTICATED` — an expired,
     never-refreshed access token, which item 3 above (now done)
     fixes going forward.
   - `nodesService.listNearby`'s default `radiusKm` was `25`; changed
     to `100` (the API's documented max) — early in a network's life,
     Nodes are sparse, so a tight default risks hiding real, distant
     matches.
   - Root cause of *why* the Node wasn't near any reasonable search
     position in the first place: Admin's "Add Node" form
     (`OnboardNodeForm`) and the NodeOperator self-onboarding form
     (`NodeSetupScreen`) both required typing raw latitude/
     longitude by hand — easy to get wrong or leave as placeholder
     values. Added `AddressGeocodeButton` (new,
     `src/components/maps/`, shared between both forms) — resolves
     lat/lng from the Address/City/State fields via Google's
     Geocoding API, same graceful-degradation-without-an-API-key
     pattern as `GoogleMapView`. Requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
     to actually geocode (currently empty in this repo's `.env`/
     `.env.local` — the button/form show a hint instead of failing
     silently when it's unset).
8. **New from the 2026-08-12 pass, not done**: the active/past order
   split (`isTerminalOrderStatus`) and `OrderStatusBadge`'s color/label
   logic are keyword-matching heuristics, not driven by a confirmed
   status enum — `docs/API.md` only documents `"awaiting_drop_off"`.
   Replace the heuristic with a real lookup table once the backend's
   full `Order.status` enum is confirmed.
9. **New from the 2026-08-20 audit, deliberately not done**: rebuild
   Consumer signup/login against the documented plain
   `POST /auth/register`/`POST /auth/login` flow — the current
   `/auth/consumer/request-otp`/`request-login-otp` OTP step doesn't
   appear anywhere in `docs/API.md`. Flagged to the user this session;
   they asked to leave it alone ("already working") rather than have it
   rebuilt. High blast radius (every Consumer's signup/login) if
   revisited — confirm the decision still stands before touching it.

### Inconsistencies and other issues found

- **`GET /node-operators/me/nodes` really does `403` a `node_staff`
  session.** (2026-09-09, backend.) Confirmed live, not theoretical —
  the response shape's own `roleAtNode` field can be `"staff"`, which
  reads as if a staff session should be able to call this and see its
  own rows, but the deployed backend rejects the call outright before
  it ever gets that far. Worked around client-side: `useMyNodes`
  reconstructs a staff session's station(s) from `GET
  /handoffs/my-node/orders` (confirmed open to `NodeStaff`) plus `GET
  /nodes/:id` (open to any authenticated role) per discovered id. This
  closes the functional gap but leaves one case genuinely unsolvable
  from the client: **a brand-new staff invite whose station has never
  processed a single order has no id to discover by this method at
  all** — there is no endpoint that would surface it. **Ask**: either
  open this route to `NodeStaff` (the schema already implies that was
  the intent), or add a route that answers "which Nodes am I staff
  at" directly regardless of order history.
- **A dispatching operator can't watch their own payment settle.**
  (2026-09-03, backend.) `POST /node-operators/nodes/:nodeId/dispatch`
  returns an ordinary `PaymentIntent` and redirects to Paystack, which
  redirects back to the fixed `{FRONTEND_URL}/orders/payment-callback`
  — but `GET /payments/intents/:id` and `GET /orders` are both
  **Consumer-only**, so the poll that screen runs for a Consumer
  booking would only collect `403`s on an operator's session. Handled
  rather than papered over: a `pendingDispatch` session flag makes
  `PaymentCallbackScreen` skip polling entirely for that flow and tell
  the operator where the parcel will appear instead — `GET
  /handoffs/my-node/orders` *does* admit them, and the dashboard's new
  "Expected" tab reads it, so the claim is checkable. **Ask**: admit a
  NodeOperator/NodeStaff session to `GET /payments/intents/:id` for an
  intent created by their own dispatch.
  - Related: that callback route had to move **out of** the `(user)`
    route group (`allowedRoles={["consumer"]}`) into `app/orders/
    payment-callback`, or an operator returning from Paystack was
    redirected to `/login` before the screen rendered at all. URL
    unchanged — `(user)` is a route group, not a path segment.
- **A private Node can't be discovered as a dispatch destination.**
  (2026-09-03, backend.) `POST .../dispatch` explicitly *accepts* any
  `active` destination regardless of its `isPubliclyVisible`
  ("dispatching to another private Node… is legitimate"), but the only
  listing endpoints — `GET /nodes` and `GET /nodes/nearby` — filter
  private Nodes out for non-Admin callers. So the API permits something
  the picker structurally cannot offer, and an operator would need the
  destination's raw uuid. **Ask**: either return private Nodes to a
  NodeOperator session on those listings, or add a way to resolve a
  partner station by code.
- **A dispatched order's `awaiting_drop_off` state had nowhere to
  live.** (2026-09-03, frontend — fixed here, noted because it changed
  an existing screen.) A dispatch starts at `awaiting_drop_off` exactly
  like a Consumer's order, and none of the Node dashboard's three tabs
  matched that status, so an operator could pay for a dispatch and then
  have no way to reach it and confirm the drop-off that releases it to
  riders. Home gained an **"Expected"** tab
  (`isExpectedAtOrigin`, origin-side + `awaiting_drop_off`) whose rows
  link to the existing drop-off preview. Deliberately excluded from the
  capacity bar's "occupied" count — the parcel isn't on the shelf until
  `POST .../drop-off` says so.

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
  2026-08-20 — see that date's full re-audit in `docs/IMPLEMENTATION_LOG.md`.
  `orders.list`/`orders.detail` were removed from this list 2026-08-12,
  since `GET /orders`/`GET /orders/:id` are now documented; see the new
  Orders section above for why they're still only 🟡, not ✅):
  `/auth/consumer/request-otp`, `/auth/consumer/request-login-otp`,
  `/identity/consumer/:userId/onboarding`, `orders.calculateFare`
  (`/orders/calculate-fare`), `orders.book` (`/orders/book`),
  `orders.scanHandoff`, `orders.scanCollection`, `riderOps.*`,
  `notifications.*`, `/payments/webhook/:provider` (note: this is
  `endpoints.ts`'s `payments.webhook`, singular and
  provider-parameterized — distinct from `API.md`'s documented
  `POST /payments/webhooks/paystack`, plural and Paystack-fixed; nothing
  in the frontend calls either one, this is a naming mismatch worth
  flagging to backend docs, not a live gap).
  **Resolved/removed 2026-08-20**: `/corporate-ops/staff/elevate-superadmin`,
  `/nodes/onboard`, `/nodes/operator/inventory`, `/nodes/:id/status`,
  `/franchise-nodes/onboard-operator`, `maps.*` (`riderTelemetryPing`/
  `track`), and `/admin/rider-earnings` are all gone from `endpoints.ts`
  now — see the Earnings section above and
  `docs/IMPLEMENTATION_LOG.md`'s 2026-08-20 entry for what replaced each
  (or, for the four that were dead code with zero callers, that nothing
  did). `/auth/consumer/request-otp`/`request-login-otp` remain, live and
  load-bearing for Consumer signup/login — explicitly left as-is at the
  user's direction this session rather than rebuilt against the
  documented plain-`register`/`login` flow; still open.
  **Resolved 2026-08-12 for `orders.calculateFare`/`orders.book`**: these
  were the load-bearing route for the entire Consumer checkout flow;
  `deliveryService` no longer calls either one, `CheckoutScreen` now
  uses the real `POST /payments/intents` instead (see the Payments
  section above). The two route strings are still defined in
  `endpoints.ts` (commented as legacy/unused) in case a real backend
  equivalent is ever confirmed — don't wire new code to them.
  `orders.scanHandoff`/`orders.scanCollection` remain live, undocumented,
  load-bearing call sites for Vendor/Rider scanning, untouched by this
  pass (out of scope — see "Out of scope for this file" below).
  **Resolved 2026-08-15 (cleanup pass)**: `riderOps.*` (all 5),
  `orders.scanHandoff` and `orders.scanCollection` have been **deleted
  from `endpoints.ts`**, along with the service methods and screens that
  called them. Nothing in the app targets an undocumented custody route
  any more. (An interim 2026-08-14 note here claimed nav no longer
  pointed at the superseded screens — that was true of `nav-config.ts`
  but not of the app: `RiderHomeScreen` and `NodeParcelRow` still linked
  to them, which is exactly why the cleanup was needed. Both repointed.) `orders.scanCollection` (recipient collection at
  the destination Node) is untouched and still the only path for that
  step — the handoffs module ends at `arrived_at_destination` and does
  not cover collection.
  **Superseded and removed 2026-08-15**: it does now.
  `POST /handoffs/orders/:id/collect` is the documented replacement,
  `CollectParcelScreen` implements it, and the old path
  (`ReleaseParcelScreen`, `use-release-parcel.ts`,
  `nodeService.releaseParcel`, `/vendor/parcels/[parcelId]/release`)
  has been deleted. It was the same 6-digit-code-at-the-counter shape
  but with a `qrNonce` and GPS the real contract has no concept of, a
  3-attempt limit instead of 5, and an auto-send-OTP-on-mount the
  documented flow must **not** have (resend costs a real email and is
  rate-limited 5/min) — and it was still reachable from the Node
  Dashboard, so the app was offering two different collection flows.
- **Genuine API gaps found in the Handoffs module** (2026-08-14, extended
  2026-08-15) — **both closed 2026-08-17**, when `docs/API.md` gained
  `GET /handoffs/my-orders` and `GET /handoffs/my-node/orders`:
  1. ~~No rider-scoped "my deliveries" endpoint.~~ **Closed.**
     `GET /handoffs/my-orders` returns every order this rider has ever
     been assigned, current and past. `store/rider-jobs.store.ts` (the
     localStorage bridge this gap used to require) is **deleted**; see
     `modules/rider/hooks/use-my-orders.ts`.
  2. ~~The origin/destination lookup asymmetry.~~ **Closed.**
     `GET /handoffs/my-node/orders` returns every order that's touched
     the caller's Node as *either* origin or destination, with `myRole`
     saying which — so the destination operator can now resolve the
     uuid `confirm-handoff`/`intake`/`collection-code/resend`/`collect`
     need, the same way the origin operator already could.
     `store/node-outgoing.store.ts` and `store/node-parcels.store.ts`
     (the two localStorage bridges this gap used to require) are
     **deleted**; see `modules/node/hooks/use-my-node-orders.ts`.
     `/vendor/rider-handoff` now shows the same pick-a-parcel flow for
     both directions — the arrival-blocked card described below in the
     2026-08-15 history is gone.
     For the record, both gaps were probed live pre-fix (2026-08-15) and
     confirmed absent at the time: `GET /handoffs/my-deliveries`,
     `/handoffs/orders`, `/handoffs/node-orders`,
     `/handoffs/incoming-orders`, `/handoffs/orders/at-node`,
     `/nodes/operator/parcels`, `/nodes/me/parcels`, and a code-only
     `POST /handoffs/confirm-handoff` all answered `Cannot GET/POST …`
     (nonexistent route) rather than `UNAUTHENTICATED` (real route, no
     session) — so neither client store had an undocumented server-side
     alternative at that time. `my-orders`/`my-node/orders` are the real
     routes that eventually shipped.
  2b. **`GET /nodes/operator/inventory` does not exist on the deployed
     backend** (confirmed 2026-08-15: `404 Cannot GET
     /api/v1/nodes/operator/inventory`). Still undocumented, still
     dead. **Closed for the Node Dashboard 2026-08-17**: `NodeHomeScreen`
     no longer touches this endpoint at all — rebuilt on
     `GET /node-operators/me` (Node identity/capacity) +
     `GET /handoffs/my-node/orders` (the live parcel snapshot, "occupied"
     derived client-side from which orders are currently physically at
     the Node — see `use-node-dashboard.ts`'s header). Verified live
     against the deployed backend: a fresh NodeOperator's `GET
     /node-operators/me` correctly 404s before onboarding and returns
     `status: "pending"` after, and `GET /handoffs/my-node/orders`
     returns an empty list with no error for a brand-new Node — see
     `docs/IMPLEMENTATION_LOG.md`'s 2026-08-17 (follow-up 2) entry.
     **Fully closed 2026-08-20**: the Flag Issue screen — its one
     remaining call site, and already unreachable from nav since
     2026-08-17 — is deleted entirely (screen, route, both hooks,
     `listParcels()`/`flagParcel()`/`mapInventoryResponse()`, the
     `ENDPOINTS.nodes.operatorInventory` constant, and every type that
     only existed for it). Nothing in the app targets this endpoint any
     more, documented or not.
  3. **`identityConfirmed` has nothing to check against** (2026-08-15).
     `POST /collect` asks the operator to attest they matched the
     receiver's name, but no destination-side endpoint returns receiver
     PII. `by-tracking-code` explicitly omits it with the note "that's
     only relevant at the destination Node, at collection" — yet nothing
     at collection supplies it either. `CollectParcelScreen` is worded to
     attest to a conversation rather than an on-screen match, since
     implying a verification the app didn't perform would be worse than
     admitting the limit. Either surface the receiver name to the
     destination operator, or narrow what the field claims to mean.
- ~~**Still no rider-facing payout figure anywhere in the API.**~~
  **Resolved 2026-08-20.** `GET /earnings/mine` (new in `docs/API.md`)
  is exactly this — the rider's own revenue-split entries.
  `riderService.getEarningsSummary()` now reduces it into today/total
  stats instead of throwing `NOT_IMPLEMENTED`; see the Earnings section
  above. `/handoffs/available-orders` still omits any payout figure
  pre-acceptance (a genuine, separate, and still-open gap — a rider
  can't see what a job is worth before claiming it), and
  `getJobHistory()` (declined/expired job history with a route/payout
  breakdown) still has no real endpoint at all and stays
  `NOT_IMPLEMENTED` — `MyEarningsScreen` (renamed from
  `MyDeliveriesScreen`) is now built on `listMyEarnings()` instead,
  which only covers completed orders' payout entries, not the fuller
  job-history concept the old screen implied.
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
- ~~**No screens import mock data directly** — one live mock-data
  fallback existed (`vendor.service.ts`'s `mapInventoryResponse()`
  defaulting to `MOCK_NODES[1]`).~~ **Resolved 2026-08-20** — deleted
  along with the rest of the dead Flag Issue feature (see item 2b
  above). `src/core/mocks/` now holds only `mock-utils.ts`
  (`generateId()`, a real still-used ID-generation helper, not fake
  data) — `mock-vendor.ts`/`mock-deliveries.ts`/`mock-nodes.ts`/
  `mock-rider.ts`/`mock-activity.ts` are all deleted, having been
  either fully unreferenced or reachable only from dead commented-out
  mock-service code.
- ~~**`riderService.getProfileDetails()` — a fabricated `VehicleDetails`
  shape (`type`/`plateNumber`/`isVerified`) with no backing route
  anywhere in `docs/API.md`** — `RiderProfileScreen`'s "Vehicle Details"
  card called it and had rendered `"—"`/blank in production since it was
  built, since the method only ever threw `NOT_IMPLEMENTED`.~~
  **Resolved 2026-08-21** — deleted, not left stubbed: the method, the
  `VehicleDetails`/`RiderProfileDetails` types, and their one caller
  (`use-rider-profile.ts`). The card now shows `licenseNumber` off the
  real, already-integrated `GET /riders/me` instead (see that row
  above) — the one license-shaped field that actually exists.
- **No duplicate services found.** Each domain (`auth`, `admin`, `nodes`,
  `node`, `rider`, `delivery`) has exactly one real service object.
  **2026-08-20**: the dead commented-out mock-service blocks that used
  to share `node.service.ts`/`rider.service.ts` (inert since before
  this project's AI-assisted work began) are deleted, not just
  ignored. `vendor.service.ts`/`vendorService` renamed to
  `node.service.ts`/`nodeService` throughout — a naming change, not a
  new service. The one legacy/duplicate-looking pair this file used to
  flag —
  `authService.submitRiderOnboarding` (→ `/identity/rider/:userId/onboarding`,
  undocumented) vs. `riderService.submitVerification` (→ `/riders/onboarding`,
  documented and real) — no longer exists: `submitRiderOnboarding` and
  the undocumented route it called were deleted 2026-08-07 (see
  `docs/HANDOFF.md`). `riderService.submitVerification` is the only
  Rider onboarding path now.

## Handoffs

New 2026-08-14, extended 2026-08-15. The full parcel custody chain:
consumer drop-off at the origin Node → rider claims it → rider collects
→ rider delivers to the destination Node → operator checks it in →
receiver collects. Three structural notes that explain most of the UI
decisions below:

- Custody transfers on a **6-digit code read aloud at the counter**, not
  a QR anyone scans. There is no `qrNonce` in this contract at all.
  **That code is the entire rider→operator payload** — `request-code`
  returns `{code, expiresAt}` with no order reference, and the code is
  neither emailed nor logged. `confirm-handoff` still needs the order
  uuid in its path, so the operator must resolve the parcel from their
  *own* records. No screen may ask a rider for a tracking code
  (corrected 2026-08-15, last session — `RiderHandoffScreen` used to).
- **No write endpoint takes GPS.** Only `available-orders` takes
  coordinates, purely to sort one response.
- **The two codes run in opposite directions**, which is the easiest
  thing to get backwards. Rider codes (`request-code`) are shown only to
  the rider and never emailed, 5-minute TTL. Collection codes (minted by
  `intake`) are emailed only to the receiver and never appear in any
  response the operator can see, 1-hour TTL.

This module supersedes the app's entire pre-existing scan-based custody
flow. `orders.scanHandoff` is no longer called; `orders.scanCollection`
(via `ReleaseParcelScreen`) is now superseded by `collect` but has not
yet been removed — see Inconsistencies.

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| GET | `/handoffs/available-orders` | Rider job board | ✅ | `AvailableJobsScreen` (`/rider/available-jobs`), `AvailableJobCard`; **new 2026-08-21**: `AvailableJobsPreview` on `RiderHomeScreen` (`/rider/home`), a read-only top-3 preview with no Accept action, linking through to the same screen | `riderService.listAvailableOrders` via `useAvailableOrders` (called twice now — `limit=20` on the Jobs screen, `limit=3` on Home's preview; same query, same hook, no new endpoint) | None functionally. Paginated with real controls. Note the screen hides all distance figures when `useGeolocation` has fallen back to its Lagos default (permission denied/unsupported) — the sort is meaningless from a position the rider isn't at, and showing the numbers anyway would present fiction as fact (the Home preview observes the same rule). Verification-gated client-side (`useRiderVerification`) since the route is a guaranteed `403 RIDER_NOT_ACTIVE` otherwise — the Home preview only mounts under the identical gate, rather than fetching and swallowing a doomed request. No payout shown — the contract carries no rider-facing figure (see Inconsistencies). |
| POST | `/handoffs/orders/:id/accept` | Rider claims an order | ✅ | Same screen, "Accept" per row | `riderService.acceptAvailableOrder` via `useAcceptOrder` | None. Handles both `409`s: the lost accept race (`ILLEGAL_ORDER_TRANSITION`) refetches the board rather than retrying, per `API.md`; the 3-delivery cap (`RIDER_CAPACITY_UNAVAILABLE`) is also enforced client-side so the rider learns the limit before eating the error. The hook takes the whole `AvailableOrder`, not just its id — the accept response is a minimal receipt with no node names or addresses, and there's no rider-scoped endpoint to fetch them back later, so this is the only moment they can be captured. |
| POST | `/handoffs/orders/:id/request-code` | Rider gets a handoff code | ✅ | `HandoffCodeScreen` (`/rider/active-deliveries/[orderId]/handoff`) | `riderService.requestHandoffCode` via `useHandoffCode` | None. Requested on tap, never on mount — a code issued at screen-open is usually dead by the time the rider reaches the counter, and each request supersedes the last, so an auto-firing query could invalidate a code mid-read-aloud. Live MM:SS countdown; expired codes are nulled at the hook boundary so the screen physically cannot display one. Digits rendered large enough for an operator to read across a counter. A `404` (rider not assigned — usually a stale store entry) prunes the entry and explains it. |
| GET | `/handoffs/orders/by-tracking-code/:code` | Operator previews a drop-off | ✅ | `DropOffPreviewScreen` (`/node/drop-off/[trackingCode]`), reached from `QrScannerScreen` | `nodeService.lookupOrderByTrackingCode` via `useHandoffLookup` | None. `retry: false` and a `404`-specific empty state ("no order with that code at this Node") kept distinct from real fetch errors, same pattern as `useRiderVerification`'s `notStarted`. Origin-scoped by design — this used to also be the reason the arrival flow was blocked (see Inconsistencies' history), but `GET /handoffs/my-node/orders` (2026-08-17) is now what resolves the destination side, so this endpoint's scoping is no longer load-bearing for anything but the drop-off preview it's actually for. |
| POST | `/handoffs/orders/:id/drop-off` | Operator confirms receipt | ✅ | Same screen, "Confirm Receipt" CTA | `nodeService.confirmDropOff` via `useHandoffLookup` | None. Server-side idempotent, but the button is still disabled in flight. Replaces the old scan-and-check-in-atomically flow: the operator now eyeballs the parcel against the description *before* accepting custody, which the previous `orders.scanHandoff` call site couldn't do. The confirm invalidates `GET /handoffs/my-node/orders` so the new order shows up on Home's Awaiting Pickup tab. |
| GET | `/handoffs/my-node/orders` | Operator's full Node order history, either side | ✅ | `NodeHomeScreen` (`/node/home`) — all three tabs, plus `HandoffDetailScreen` (`/node/handoff/[orderId]`), `CollectParcelScreen`, and `ActivityScreen`'s Order History tab | `nodeService.getMyNodeOrders` via `use-my-node-orders.ts` (`useMyNodeOrders`/`useNodeOrder`), `use-node-dashboard.ts` (Home's tab-derived lists) | None. Closes the origin/destination lookup asymmetry described in Inconsistencies. `myRole` on each item drives every filter (`isAwaitingPickup`/`isAwaitingArrival`/`needsIntake`/`isReadyForCollection`); requested at `limit=100`, no pagination UI yet. Also the Node Dashboard's "occupied capacity" source (item 2b, Inconsistencies) — `isAwaitingPickup`/`needsIntake`/`isReadyForCollection` orders count as physically on-site, `isAwaitingArrival` (`in_transit`) doesn't. **2026-08-17 (later — Inventory retired)**: the standalone `InventoryScreen`/`HandoffOrderList`/`CollectionList`/`HistoryList` that used to be the primary consumers here are deleted; every tab they had moved to `NodeHomeScreen` (Pickup/Incoming), `CollectParcelScreen` (Collection), or `ActivityScreen` (History) instead — same query, same filters, no new endpoint. |
| GET | `/handoffs/my-orders` | Rider's full order history | ✅ | `ActiveDeliveriesScreen` (`/rider/active-deliveries`, renamed "Activity" in nav 2026-08-21), `HandoffCodeScreen` | `riderService.getMyOrders` via `use-my-orders.ts` | None. Added 2026-08-17 — closes the "no rider-scoped my-deliveries endpoint" gap described in Inconsistencies. **2026-08-21**: `ActiveDeliveriesScreen` no longer pre-filters this response down to `isActiveDelivery` (`rider_assigned`/`in_transit`) before rendering — it now shows the full, unfiltered list behind four tabs (All / In Transit / Awaiting Collection / Completed), each a client-side filter over the same one query (`isActiveDelivery`, new `isAwaitingCollection`, new `isCompletedDelivery` — all in `use-my-orders.ts`). This is what surfaces `arrived_at_destination`/`ready_for_collection`/`completed` orders to the rider for the first time; previously this response's non-`rider_assigned`/`in_transit` items were fetched but never rendered anywhere. Not wired to `MyEarningsScreen`'s "Earnings" tab (`GET /earnings/mine` is, as of 2026-08-20 — see the Earnings section) — no payout field exists on this response. |
| POST | `/handoffs/orders/:id/intake` | Operator checks a parcel in at the destination | ✅ | `CollectParcelScreen`'s "needs check-in" branch (`/node/awaiting-collection/[orderId]/collect`, reached from Home's Ready for Collection tab) | `nodeService.confirmIntake` via `useParcelIntake` | None. One tap, "Check In & Email Receiver" — intake is what emails the receiver their code. **2026-08-17 (later — Inventory retired)**: moved here from `InventoryScreen`'s Collection tab, same hook, same call; the screen falls through to the "ready" branch on its own once the mutation invalidates `GET /handoffs/my-node/orders` and the order's status flips server-side — no manual navigation needed. |
| POST | `/handoffs/orders/:id/collection-code/resend` | Operator re-emails the collection code | ✅ | `CollectParcelScreen` (`/node/awaiting-collection/[orderId]/collect`) | `nodeService.resendCollectionCode` via `useCollectParcel` | None. Deliberately a manual action placed below the primary CTA and never auto-fired — it sends real email and is rate-limited 5/min, unlike the old `sendReleaseOtp` no-op it replaces, which fired on mount. Resetting the local attempt counter on success is correct: a fresh code supersedes the old one's lockout. Was 🟡 for the uuid gap; closed 2026-08-17. |
| POST | `/handoffs/orders/:id/collect` | Receiver collects; order completed | ✅ | Same screen | `nodeService.collectParcel` via `useCollectParcel` | None. `identityConfirmed` is asked as an explicit two-option question with **no default** and gates the CTA until answered — per `API.md` it's an audit-trail attestation that doesn't block completion when `false`, so pre-selecting "yes" would record something the operator never said. Note the app **cannot show the expected receiver name** (no destination-side endpoint returns receiver PII), so the wording attests to a conversation rather than an on-screen match — see Inconsistencies. Was 🟡 for the uuid gap; closed 2026-08-17. |
| POST | `/handoffs/orders/:id/confirm-handoff` | Operator confirms a rider handoff | ✅ | `HandoffDetailScreen` (`/node/handoff/[orderId]`, reached from Home's Awaiting Pickup and Awaiting Arrival tabs) | `nodeService.confirmRiderHandoff` via `useConfirmHandoff` | None — both directions work end to end. Type the rider's 6 digits, confirm — identical interaction either direction, no tracking-code field, since a code box here reads as something to ask the rider for. The order comes from `GET /handoffs/my-node/orders` via `useNodeOrder(orderId)`, direction (`rider_pickup`/`rider_arrival`) inferred from the order's own `myRole`. **2026-08-17 (later — Inventory retired)**: moved from `InventoryScreen`'s Pickup + Incoming tabs, where rows expanded in place, to this dedicated per-order details page — same hook (`useConfirmHandoff`), same call, same copy, just reached via Home instead of a list-row expand. The screen falls back to a read-only view (no code panel) if the order isn't actually in a pickup/arrival-pending state when loaded, since a stale link would otherwise offer an action the server would reject. Error handling unchanged: `INVALID_HANDOFF_CODE` copy deliberately doesn't hint whether the code was wrong/expired/used/locked-out (per `API.md`), the 5-attempt lockout is tracked as UX advice only and never gates the request, and `429`/`404`/`409` are distinguished. |

## Out of scope for this file

The app still calls `notifications.*` (`node.service.ts`'s
`listActivity()`, real but with no current caller — see Inconsistencies)
and the still-undocumented `orders.calculateFare`/`orders.book` routes
(both dead: unused constants kept only in case a real equivalent is
ever confirmed) — none of these appear in `docs/API.md`, so there's
nothing to check them against here. `riderOps.*`, `orders.scanHandoff`/
`orders.scanCollection`, and `maps.*` — all previously listed here as
live, undocumented call sites — are gone from `endpoints.ts` entirely
as of 2026-08-15 and 2026-08-20 respectively; nothing in the app
targets an undocumented route any more except the two dead `orders.*`
constants above. (`orders.list`/`orders.detail` moved **out** of this
note as of 2026-08-12 — `GET /orders`/`GET /orders/:id` are now
documented and audited in the Orders section above.)
