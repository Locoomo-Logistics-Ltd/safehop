# API_INTEGRATION_STATUS.md

> Full audit of every endpoint documented in `docs/API.md` against the
> current frontend implementation. Verified by reading the live source
> (`core/api/endpoints.ts`, `core/api/services/*.ts`, the module hooks
> that wrap them, and the screens that call those hooks) — not assumed
> from prior documentation. Last audited 2026-08-12 (integration pass,
> later same day).
>
> **`docs/API.md` is maintained by the backend/project owner — read it,
> never edit it from a frontend session.** This file is the one that
> gets edited here, to track the frontend's side of the contract.

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
`orders.scanHandoff`. The Vendor scanner no longer calls
`orders.scanHandoff`; the Rider screens that call `riderOps.*` still
exist but are no longer reachable from nav. See that section for the
current state of each.

## Auth

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| POST | `/auth/register` | Consumer + Rider + NodeOperator self-registration | ✅ | `RoleSelectScreen` (`/role-select`) → `CreateAccountScreen` (`/create-account?role=`) | `authService.registerConsumer` via `useAuth().register` | None. **2026-08-07**: `RoleSelectScreen`'s Rider/NodeOperator options now route to `/create-account?role=rider` / `?role=node_operator` (previously routed to now-deleted undocumented-flow screens); `CreateAccountScreen` reads `?role=` and includes it in the payload — all three self-registerable roles now reachable through this one documented endpoint, exactly as `API.md` describes ("This is the same endpoint for all three allowed roles"). Also fixed the client-side password strength meter (uppercase/lowercase/number/special) that contradicted `API.md`'s explicit "don't build a strength meter" guidance — now length-only (≥12 chars), matching `ResetPasswordScreen`. Also fixed a bug where a successful registration was incorrectly treated as a login (`setSession()` called with no server-side cookie ever issued) — `API.md` states registration does not log the user in; the hook now just routes to `/login`. |
| POST | `/auth/login` | Consumer + Rider + NodeOperator + Admin login | ✅ | `LoginScreen`, `AdminLoginScreen` (`/admin-login`) | `authService.loginConsumer` / `loginAdmin` via `useAuth().login` | None — role-agnostic per `API.md`, all four roles correctly share the one real route with `credentials:"include"`. **2026-08-07**: post-login redirect is role-aware (`session.user.role`) — NodeOperator → `/vendor/node-setup`, Consumer → `/dashboard` — previously hardcoded to `/dashboard` for every role, and unreachable by Rider/NodeOperator anyway since they didn't go through this endpoint yet. **2026-08-07 (later, gating pass)**: Rider → `/rider/home` (changed from `/rider/verification`) — a not-yet-verified Rider now lands on Home with a dismissible verification reminder instead of being forced straight into the verification form; see the Riders section below and `docs/HANDOFF.md` for the product reasoning. |
| POST | `/auth/refresh` | Session refresh | ✅ | none directly (interceptor, not screen-driven) | `authService.refreshSession`, called internally by `core/api/client.ts` | **Fixed 2026-08-12 (later — live debugging session).** `httpClient`'s `request()` now catches any `401 UNAUTHENTICATED` (except on `/auth/*` routes and `skipAuth` calls), fires one refresh attempt, and retries the original call once. Concurrent 401s share one in-flight refresh (`refreshPromise`) so a second caller doesn't independently trigger `401 INVALID_REFRESH_TOKEN` against the now-rotated, single-use token. A failed refresh clears the session (`useAuthStore` + `localStorage`) and hard-redirects to `/login`, per `API.md`'s "treat as a hard sign-out" instruction. This was surfaced by a real user report: `GET /nodes/nearby` returning `401` for a logged-in Consumer testing the Select Nodes screen — an expired, never-refreshed 15-minute access token. |
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
| GET | `/nodes/nearby` | User picks a pickup Node | ✅ | `GoogleMapView`, Select Nodes (`/delivery/select-nodes`) | `nodesService.listNearby` via `useNodes` | **Fixed 2026-08-12.** Was sending `radiusInMeters` and parsing a flat array; now sends `radiusKm` and unwraps the paginated `{items,...}` envelope, mapping into a new `PickupNode` type (real fields: `city`/`state`/`capacity` as a raw number/`operatingHours`, no fabricated `isOpenNow`/`capacity.occupied`). Deliberately did **not** touch the pre-existing `LocoomoNode` type (kept as-is for `vendor.service.ts`'s separate, still-unconfirmed `/nodes/operator/inventory` endpoint) to avoid an unrelated blast radius. `MockMapView.tsx` (already `@deprecated`, unused by the active screen) still references the old `LocoomoNode` shape and was left untouched. |
| GET | `/nodes/:id` | Admin views Node detail | ✅ | Node Network's "View Details" expand | `adminService.getNodeDetail` | None. **2026-08-12**: also reused by `nodesService.getById` (Consumer side) — same route, any authenticated role per `API.md`, previously had a hacky "search nearby and filter" workaround instead. |
| PATCH | `/nodes/:id` | Admin approves/suspends/edits a Node | 🟡 | Node Network's "Manage" panel | `adminService.updateNode` via `useManageNode` | Correctly wired, but the UI only ever sends `{status}` (approve/suspend/reactivate). `name`/`address`/`capacity`/`operatingHours`/etc. are all editable per `API.md` but no form exposes them. Same generic-toast validation issue as above. |

## Node Operators

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| POST | `/node-operators/onboarding` | Vendor self-service Node setup | ✅ | `VendorNodeSetupScreen` (`/vendor/node-setup`) | `vendorService.onboardNode` via `useVendorNodeSetup` | None. Fields match the real required body exactly. |
| GET | `/node-operators/me` | Vendor checks Node approval status | ✅ | Same screen, reachable from Vendor Profile's "Node Setup" row | `vendorService.getMyNodeOperatorProfile` via `useVendorNodeSetup` | None. Drives all three states correctly (`404`→onboarding form, `pending`→waiting view, `active`→dashboard link), field-level errors via `getFriendlyError`. |
| GET | `/node-operators/pending` | Admin's NodeOperator review queue | ✅ | `ApprovalsScreen` (`/admin/approvals`, "Node Operators" tab) | `adminService.getPendingNodeOperators` via `useNodeOperatorApprovals` | None — new 2026-08-12. `/admin/approvals` has no home in the original 8-frame design; placed as a new nav item after "Team" (see `nav-config.ts`'s comment). |
| PATCH | `/node-operators/:id/approve` | Admin approves a NodeOperator | ✅ | Same screen, "Approve" button per row | `adminService.approveNodeOperator` via `useNodeOperatorApprovals` | None — new 2026-08-12. Closes the gap this row used to describe: an Admin can now approve a self-registered NodeOperator through the UI. |

## Riders

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| GET | `/riders/verification/upload-signature` | Rider KYC — get Cloudinary signature | ✅ | `RiderVerificationScreen` (`/rider/verification`) | `riderService.getVerificationUploadSignature` via `useRiderVerification` | None — only sends `documentType: "rating_screenshot"`, the one documented value. |
| POST | `/riders/onboarding` | Rider KYC — submit verification | ✅ | Same screen | `riderService.submitVerification` via `useRiderVerification` | None. Upload flows client-side straight to Cloudinary first (`uploadVerificationDocument`), then submits the resulting `public_id` — matches `API.md`'s "file bytes never pass through this API" instruction exactly. |
| GET | `/riders/me` | Rider checks verification status | ✅ | `RiderVerificationScreen`, `RiderHomeScreen`'s reminder sheet, `JobOfferScreen`'s gate, Rider Profile's "Verification" row | `riderService.getVerificationProfile` via `useRiderVerification` (called independently from each of those four screens/components, same query key — TanStack Query dedupes) | None. Drives all three states correctly (`404`→form, `pending`→under-review, `active`→dashboard link) on the verification screen itself. **2026-08-07**: also now gates `data.status !== "active"` on `JobOfferScreen` (blocks with "Verification required" + a link back to `/rider/verification`, instead of showing job-board content) and drives a dismissible reminder on `RiderHomeScreen`. Deliberately **not** gated on Home/Earnings/Profile — those stay browsable pre-approval (product decision, see `docs/HANDOFF.md`). |
| GET | `/riders/pending` | Admin's Rider review queue | ✅ | `ApprovalsScreen` (`/admin/approvals`, "Riders" tab) | `adminService.getPendingRiders` via `useRiderApprovals` | None — new 2026-08-12. Shows a "View screenshot" link to the pending Rider's signed `viewUrl` document alongside each row. |
| PATCH | `/riders/:id/approve` | Admin approves a Rider | ✅ | Same screen, "Approve" button per row | `adminService.approveRider` via `useRiderApprovals` | None — new 2026-08-12. Closes the gap this row used to describe: a Rider who completes verification can now be moved to `active` through the UI, reaching the job board. |

## Admin Pricing

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| POST | `/admin/pricing` | Admin sets a new pricing rule | ✅ | `AddPricingRuleForm`, `PricingScreen` (`/admin/pricing`) | `adminService.createPricingRule` via `useCreatePricingRule` | None — new 2026-08-12. Same generic-toast validation issue as `/users/invite`/`/nodes` above (`getErrorMessage`, not `getFriendlyError`). |
| GET | `/admin/pricing` | Admin views rate history | ✅ | Same screen — table below the form, newest-first, top row marked "Current" | `adminService.getPricingRules` via `usePricingRules` | None — new 2026-08-12. `/admin/pricing` has no home in the original 8-frame design; placed as a new nav item next to "Approvals" (see `nav-config.ts`'s comment). This closes the real gap the pre-2026-08-12 audit flagged: Consumer checkout (`POST /payments/intents`) depends on a pricing rule existing, and there was previously no Admin-facing way to create one. |

## Payments

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| POST | `/payments/intents` | Consumer places an order (fee calc + Node capacity reservation + Paystack checkout) | ✅ | `CheckoutScreen` (`/checkout`) | `deliveryService.createPaymentIntent` via `useCheckout` | **Rebuilt 2026-08-12.** `CheckoutScreen` now creates the intent once per visit (guarded against double-fire), shows the real `feeBreakdown`, and "Confirm & Pay" redirects to the returned `authorizationUrl`. Replaces the old `useCreateDelivery` → `ENDPOINTS.orders.book`/`orders.calculate-fare` flow (undocumented routes, never actually collected payment — `deliveryService.pay()` was a no-op re-fetch). No payment-method picker in-app anymore — Paystack's hosted page presents card/bank/USSD, the real payload has no such field; `PaymentMethodSelector.tsx` was deleted as genuinely dead code. **Not verified against a live backend** — no real Node capacity reservation or Paystack redirect has been exercised this session (see `docs/HANDOFF.md`). |
| GET | `/payments/intents/:id` | Consumer polls payment status after the Paystack redirect | ✅ | `PaymentCallbackScreen` (`/orders/payment-callback`) | `deliveryService.getPaymentIntent` via `usePaymentIntentStatus` | **New 2026-08-12.** Polls every 2.5s (capped at ~90s) while `status: "pending"`; on `"paid"` looks up the resulting Order via `GET /orders` (no dedicated "order by intent id" route exists) and forwards to the success screen; `"failed"`/`"expired"`/timeout each get a distinct retry state. The intent id is recovered from `sessionStorage` (set right before the Paystack redirect), not the callback URL's query string — `API.md` doesn't document what Paystack appends there. **Not verified against a live backend.** |
| POST | `/payments/webhooks/paystack` | Paystack → backend payment confirmation | ⚪ | n/a | n/a | Server-to-server only per `API.md` ("your frontend never does" this) — correctly has no frontend call site. Listed here for completeness, not a gap. |

## Orders

| Method | Endpoint | Feature/Module | Status | Related page(s)/component(s) | Service/hook | Missing work |
|---|---|---|---|---|---|---|
| GET | `/orders` | Consumer's own order list | ✅ | `TrackListScreen`, `PastDeliveriesSection`, `ActiveDeliveriesSection` | `deliveryService.list` via `useDeliveries` | **Rebuilt 2026-08-12.** `deliveryService.list()` now returns the real `Order` type (`core/types/payment.types.ts`) matching `API.md`'s documented shape exactly — no more mapping into the fictional `Delivery` type. Active/past split is a best-effort heuristic (`isTerminalOrderStatus`, keyword-matching on the status string) since `API.md` only confirms one status value (`"awaiting_drop_off"`) and doesn't enumerate the rest of the lifecycle. **Not verified against a live backend** — the heuristic and `OrderStatusBadge`'s fallback rendering are built to degrade gracefully for any status string, but haven't seen a real one beyond the single documented example. |
| GET | `/orders/:id` | Consumer's own order detail | ✅ | `TrackPackageScreen`, `OrderSuccessScreen`, `PaymentCallbackScreen` | `deliveryService.getById` via `use-delivery.ts` | **Rebuilt 2026-08-12**, same shape correction as the row above. `TrackPackageScreen`'s old "Tracking History" event-log section was removed rather than faked — the real Order response has no such field, only a single current `status`. |

## Summary

**30** endpoints documented in `API.md`. **27 ✅ Fully Integrated**, **2 🟡
Partially Integrated** (`/auth/verify-email`, `PATCH /nodes/:id`),
**0 ❌ Not Integrated**, **1 ⚪ No UI Required Yet**. (`/auth/refresh`
moved 🟡→✅ in a same-day follow-up — see its row in the Auth section.)

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
6. **Build a `/verify-email` route/screen** to actually call the
   already-wired `authService.verifyEmail` — currently dead code. Still
   open, unrelated to the 2026-08-12 pass.
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
     (`VendorNodeSetupScreen`) both required typing raw latitude/
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
  2026-08-12 — `orders.list`/`orders.detail` removed from this list, since
  `GET /orders`/`GET /orders/:id` are now documented; see the new Orders
  section above for why they're still only 🟡, not ✅): `/auth/consumer/request-otp`,
  `/auth/consumer/request-login-otp`,
  `/identity/consumer/:userId/onboarding`,
  `/corporate-ops/staff/elevate-superadmin`, `/nodes/onboard`,
  `/nodes/operator/inventory`, `/nodes/:id/status`, `/franchise-nodes/onboard-operator`,
  `orders.calculateFare` (`/orders/calculate-fare`), `orders.book`
  (`/orders/book`), `orders.scanHandoff`, `orders.scanCollection`, `maps.*`,
  `riderOps.*`, `notifications.*`, `/payments/webhook/:provider` (note:
  this is `endpoints.ts`'s `payments.webhook`, singular and
  provider-parameterized — distinct from `API.md`'s documented
  `POST /payments/webhooks/paystack`, plural and Paystack-fixed; nothing
  in the frontend calls either one, this is a naming mismatch worth
  flagging to backend docs, not a live gap). Of these, `/nodes/:id/status`
  and `/franchise-nodes/onboard-operator` are defined in `endpoints.ts` but
  **never called anywhere** — dead route definitions, safe to delete.
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
  `vendorService.releaseParcel`, `/vendor/parcels/[parcelId]/release`)
  has been deleted. It was the same 6-digit-code-at-the-counter shape
  but with a `qrNonce` and GPS the real contract has no concept of, a
  3-attempt limit instead of 5, and an auto-send-OTP-on-mount the
  documented flow must **not** have (resend costs a real email and is
  rate-limited 5/min) — and it was still reachable from the Node
  Dashboard, so the app was offering two different collection flows.
- **Genuine API gaps found in the Handoffs module** (2026-08-14,
  extended 2026-08-15), all needing a backend change:
  1. **No rider-scoped "my deliveries" endpoint.** `GET /orders` is
     Consumer-only and `/handoffs/available-orders` returns only
     *unclaimed* orders, so an accepted order vanishes from every list
     the rider can query — while they still need its `id` for
     `request-code` at both ends of the trip. Bridged client-side with
     `store/rider-jobs.store.ts` (localStorage, per-device, can drift
     from server state; never trusted for authorization). Requested:
     `GET /handoffs/my-deliveries`. Delete that store when it lands
     rather than keeping it as a cache.
  2. **The origin/destination lookup asymmetry.** `confirm-handoff`
     needs a uuid the destination operator has no documented way to
     obtain. Requested: widen `by-tracking-code` to match the
     destination Node too (its response carries no receiver PII, so the
     privacy rationale for the current scoping appears satisfied either
     way), or accept a tracking code as the path param.
     **Escalated 2026-08-15**: the three new collection endpoints
     (`intake`, `collection-code/resend`, `collect`) are keyed on the
     same uuid and scoped to the same destination Node, so this now
     blocks **four of the six operator endpoints**, not one. Mitigated
     by capturing the uuid from the `confirm-handoff` (`rider_arrival`)
     response into `store/node-parcels.store.ts` — the one moment it
     crosses the destination operator's session — but that store is
     per-device and clearing site data strands every parcel at the Node
     with no frontend recovery path. This is the single highest-value
     backend fix outstanding for this module.
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
- **No rider-facing payout figure anywhere in the API** (2026-08-14).
  `/handoffs/available-orders` omits `amountKobo` (that's the consumer's
  fare, not a rider fee) and no rider-earnings endpoint exists, so the
  job board shows route/size/distance and no money. Left out rather than
  invented; the intended rider-facing economics need confirming. Note
  this compounds the pre-existing `riderService.getEarningsSummary()`
  `NOT_IMPLEMENTED` gap.
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

## Handoffs

New 2026-08-14, extended 2026-08-15. The full parcel custody chain:
consumer drop-off at the origin Node → rider claims it → rider collects
→ rider delivers to the destination Node → operator checks it in →
receiver collects. Three structural notes that explain most of the UI
decisions below:

- Custody transfers on a **6-digit code read aloud at the counter**, not
  a QR anyone scans. There is no `qrNonce` in this contract at all.
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
| GET | `/handoffs/available-orders` | Rider job board | ✅ | `AvailableJobsScreen` (`/rider/available-jobs`), `AvailableJobCard` | `riderService.listAvailableOrders` via `useAvailableOrders` | None functionally. Paginated with real controls. Note the screen hides all distance figures when `useGeolocation` has fallen back to its Lagos default (permission denied/unsupported) — the sort is meaningless from a position the rider isn't at, and showing the numbers anyway would present fiction as fact. Verification-gated client-side (`useRiderVerification`) since the route is a guaranteed `403 RIDER_NOT_ACTIVE` otherwise. No payout shown — the contract carries no rider-facing figure (see Inconsistencies). |
| POST | `/handoffs/orders/:id/accept` | Rider claims an order | ✅ | Same screen, "Accept" per row | `riderService.acceptAvailableOrder` via `useAcceptOrder` | None. Handles both `409`s: the lost accept race (`ILLEGAL_ORDER_TRANSITION`) refetches the board rather than retrying, per `API.md`; the 3-delivery cap (`RIDER_CAPACITY_UNAVAILABLE`) is also enforced client-side so the rider learns the limit before eating the error. The hook takes the whole `AvailableOrder`, not just its id — the accept response is a minimal receipt with no node names or addresses, and there's no rider-scoped endpoint to fetch them back later, so this is the only moment they can be captured. |
| POST | `/handoffs/orders/:id/request-code` | Rider gets a handoff code | ✅ | `HandoffCodeScreen` (`/rider/active-deliveries/[orderId]/handoff`) | `riderService.requestHandoffCode` via `useHandoffCode` | None. Requested on tap, never on mount — a code issued at screen-open is usually dead by the time the rider reaches the counter, and each request supersedes the last, so an auto-firing query could invalidate a code mid-read-aloud. Live MM:SS countdown; expired codes are nulled at the hook boundary so the screen physically cannot display one. Digits rendered large enough for an operator to read across a counter. A `404` (rider not assigned — usually a stale store entry) prunes the entry and explains it. |
| GET | `/handoffs/orders/by-tracking-code/:code` | Operator previews a drop-off | ✅ | `DropOffPreviewScreen` (`/vendor/drop-off/[trackingCode]`), reached from `QrScannerScreen` | `vendorService.lookupOrderByTrackingCode` via `useHandoffLookup` | None at the origin Node. `retry: false` and a `404`-specific empty state ("no order with that code at this Node") kept distinct from real fetch errors, same pattern as `useRiderVerification`'s `notStarted`. **Origin-scoped by design, which breaks the arrival flow — see Inconsistencies.** |
| POST | `/handoffs/orders/:id/drop-off` | Operator confirms receipt | ✅ | Same screen, "Confirm Receipt" CTA | `vendorService.confirmDropOff` via `useHandoffLookup` | None. Server-side idempotent, but the button is still disabled in flight. Replaces the old scan-and-check-in-atomically flow: the operator now eyeballs the parcel against the description *before* accepting custody, which the previous `orders.scanHandoff` call site couldn't do. |
| POST | `/handoffs/orders/:id/intake` | Operator checks a parcel in at the destination | 🟡 | `RiderHandoffScreen`'s arrival success state (inline), `AwaitingCollectionScreen` (`/vendor/awaiting-collection`) | `vendorService.confirmIntake` via `useParcelIntake` | Wired correctly and chained straight off the arrival confirm, since that's the same physical moment and intake is what emails the receiver their code. 🟡 only because it inherits the uuid gap below — it works when reached from the arrival confirm that produced the id, and is unreachable otherwise. |
| POST | `/handoffs/orders/:id/collection-code/resend` | Operator re-emails the collection code | 🟡 | `CollectParcelScreen` (`/vendor/awaiting-collection/[orderId]/collect`) | `vendorService.resendCollectionCode` via `useCollectParcel` | Wired correctly. Deliberately a manual action placed below the primary CTA and never auto-fired — it sends real email and is rate-limited 5/min, unlike the old `sendReleaseOtp` no-op it replaces, which fired on mount. Resetting the local attempt counter on success is correct: a fresh code supersedes the old one's lockout. 🟡 for the uuid gap only. |
| POST | `/handoffs/orders/:id/collect` | Receiver collects; order completed | 🟡 | Same screen | `vendorService.collectParcel` via `useCollectParcel` | Wired correctly. `identityConfirmed` is asked as an explicit two-option question with **no default** and gates the CTA until answered — per `API.md` it's an audit-trail attestation that doesn't block completion when `false`, so pre-selecting "yes" would record something the operator never said. Note the app **cannot show the expected receiver name** (no destination-side endpoint returns receiver PII), so the wording attests to a conversation rather than an on-screen match — see Inconsistencies. 🟡 for the uuid gap only. |
| POST | `/handoffs/orders/:id/confirm-handoff` | Operator confirms a rider handoff | 🟡 | `RiderHandoffScreen` (`/vendor/rider-handoff`) | `vendorService.confirmRiderHandoff` via `useConfirmHandoff` | Wired correctly, and `rider_pickup` (origin) works end to end. **`rider_arrival` is only half-usable**: the endpoint is keyed on the order uuid, and the sole documented way to resolve a human-readable code into that uuid is the origin-scoped lookup above — so the destination operator has no documented way to obtain the id they must POST to. The screen asks them to type it directly as a stopgap, which means reading a uuid off the rider's phone. Backend fix needed, not a frontend one — see Inconsistencies. Error handling is otherwise complete: `INVALID_HANDOFF_CODE` copy deliberately doesn't hint whether the code was wrong/expired/used/locked-out (per `API.md`), the 5-attempt lockout is tracked as UX advice only and never gates the request, and `429`/`404`/`409` are distinguished. |

## Out of scope for this file

The app also calls `maps.*`, `riderOps.*`, `notifications.*`, and the
still-undocumented `orders.calculateFare`/`orders.book`/
`orders.scanHandoff`/`orders.scanCollection` routes — none of these
appear in `docs/API.md`, so there's nothing to check them against here.
Flag to whoever owns the backend docs if this file should expand to
cover them; several (`orders.scanHandoff`, `orders.scanCollection`,
`maps.riderTelemetryPing`, `riderOps.*`) are live, load-bearing call
sites for the Vendor scan-in/release and Rider job flows, not dead
code. (`orders.list`/`orders.detail` moved **out** of this out-of-scope
note as of 2026-08-12 — `GET /orders`/`GET /orders/:id` are now
documented and audited in the Orders section above.)
