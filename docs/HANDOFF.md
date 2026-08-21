# HANDOFF.md

> Always describes the *current* project state. Overwrite this file's
> contents each session (unlike `IMPLEMENTATION_LOG.md`, which is
> append-only).

## Current objective

**Latest session (2026-08-22 — the "Payment Processing" Dashboard
section, added 2026-08-21, has been fully removed):** explicit call:
"since user will not logout, it will give displaying pending and that
is not good." The concern — the localStorage record this feature kept
had no expiry, so a payment that never resolved (backend never
confirmed, or the Consumer just never revisited) would show "Payment
processing... check back shortly" indefinitely, for as long as that
browser's storage lived, however many sessions that spanned. Rather
than patch that (e.g. an expiry window), the decision was to remove the
feature outright.

**Fully reverted, not just hidden**: deleted
`modules/user/lib/pending-payments.ts`,
`modules/user/hooks/use-pending-payments.ts`, and
`modules/user/components/dashboard/PendingPaymentsSection.tsx`
outright. `DashboardScreen.tsx`, `use-checkout.ts`'s
`redirectToPaystack()`, `CheckoutScreen.tsx`'s "Confirm & Pay" button,
`PaymentCallbackScreen.tsx`'s two cleanup effects, and
`STORAGE_KEYS.pendingPayments` in `constants.ts` are all back to their
exact pre-2026-08-21 state — confirmed via `git diff` showing zero
diff against the last-committed version of each file. A repo-wide grep
for every symbol the feature introduced
(`pendingPayments`/`addPendingPayment`/`removePendingPayment`/
`usePendingPayments`/`PendingPaymentsSection`) returns nothing.

**What this means going forward**: a Consumer who closes the app
mid-payment or outlasts `PaymentCallbackScreen`'s ~90s poll window is
back to the pre-2026-08-21 state — no Dashboard indication either way
until the real Order eventually appears via `GET /orders` once the
webhook resolves it. That's a real gap (the original panic scenario
this feature was built for), left open by explicit choice rather than
oversight. If it's worth solving differently later — e.g. an expiring
record, or a "Payment Processing" state that ages out after a fixed
window instead of persisting forever — that's a fresh design, not a
revival of this exact implementation.

**Verified**: `npx tsc --noEmit` clean, `npx eslint src` clean, a
cleared-`.next` `npx next build` succeeds (45 routes, back to the
pre-feature count). Dev-server smoke test: `/dashboard`, `/checkout`,
`/orders/payment-callback` all return `200`, dev log grepped clean of
errors. Full detail in `docs/IMPLEMENTATION_LOG.md`'s matching entry.

**Previous session (2026-08-21 → 2026-08-22 span —
production-readiness pass: removed every dead/undocumented endpoint,
listed the 14 permanently-`NOT_IMPLEMENTED` Admin stubs for the backend
team, and added an animated launch splash screen):** three asks in one
sitting, described here together since they touched overlapping files.

**Dead-code removal.** Deleted every endpoint constant, service method,
and hook that didn't correspond to a real `docs/API.md` route *and* had
zero live callers (confirmed by tracing each one up to its hook and
screen, not just grepping for the string): the entire abandoned
Consumer OTP signup/login design (`/auth/consumer/request-otp`,
`/auth/consumer/request-login-otp`, the two `use-auth.ts` mutations,
`OtpChannel`/`RequestOtpPayload` types, and the ~120 lines of commented-
out OTP form JSX still sitting in `CreateAccountScreen.tsx` — that last
one is now cleaned up too, in a follow-up pass after the day's earlier
session left it in place), `/identity/consumer/:userId/onboarding`
(`submitConsumerOnboarding`/`ConsumerOnboardingPayload`),
`/notifications/user/:userId` (`nodeService.listActivity()`, its mapper,
and the orphaned `use-activity-log.ts` hook — deleted outright, not
left as "real but unused" the way a prior session chose to), the
pre-2026-08-12 `orders.calculateFare`/`orders.book` constants, a stale
`payments.webhook(provider)` constant that never matched the real
webhook path, and two long-`@deprecated` auth types
(`SignUpPayload`/`LoginPayload`) explicitly marked "kept for the mock
service" — the mock service itself was deleted 2026-08-20, so these
were just forgotten. `docs/API_INTEGRATION_STATUS.md`'s Inconsistencies
section needs a pass to reflect all of this — not yet done, see below.

**Admin backend gap list.** Read `admin.service.ts` fully and handed
the user a per-screen table of all 14 (not 13 — the Analytics trend
chart is a separate stub from the three counted initially) permanently-
`NOT_IMPLEMENTED` methods, each with a suggested route and the response
shape the frontend type already expects, for their backend engineer.
No code changed for this part — purely a reading/reporting task.

**Animated PWA splash screen.** New `components/splash/SplashScreen.tsx`,
mounted once in the root `layout.tsx` (persists across client-side
navigation in the App Router, so it only plays on an actual page load,
never mid-session). Logo (`LogoMark`) fades/scales in, "LOCOOMO"
wordmark follows ~220ms later, holds briefly, then the whole thing
fades out — new `@keyframes splash-logo-in`/`splash-wordmark-in` in
`globals.css`, no animation library added. Background is `--bg-canvas`
(`#F7F9FC`) deliberately matching `manifest.webmanifest`'s own
`background_color` — that's what Android already paints behind the app
icon on a standalone-installed launch, so this avoids a color flash
between the OS's native splash and this custom one taking over.
`prefers-reduced-motion` needed no separate handling — `globals.css`
already had a blanket rule collapsing all animation/transition
durations sitewide, which covers this too. Shows on every load
(browser tab or installed PWA) rather than being gated to `(display-
mode: standalone)` — a deliberate default, easy to add if only the
installed-PWA case should get it.

**Verified**: `npx tsc --noEmit` clean, `npx eslint src` clean, a
cleared-`.next` `npx next build` succeeds (45 routes, unchanged count).
Dev-server smoke test confirms the splash markup renders in the SSR
output for `/role-select` with no runtime errors. **Not verified**: no
browser was available, so the actual animation timing/feel, and
whether it reads as "cool" rather than sluggish or too brief, hasn't
been seen — worth a real look before calling it done. Also not done:
`docs/API_INTEGRATION_STATUS.md` hasn't been re-diffed against this
session's removals yet. Full detail in `docs/IMPLEMENTATION_LOG.md`'s
matching entry.

**Previous session (2026-08-21, most recent — a "Payment Processing" card
on the Consumer Dashboard for a payment stuck between Paystack and a
real Order):** the panic scenario this closes: a Consumer pays via
Paystack, then either closes the app before `PaymentCallbackScreen`'s
poll resolves, or outlasts its ~90s window — landing back on Dashboard
to a screen that shows neither a failure nor their new order, because
`GET /orders` only ever returns real, already-`paid`-and-recorded
Orders. Ask: log the pending payment, show it to the Consumer as
pending with a "come back later" message, and let it become the real
order once it resolves.

**No new endpoint** — `GET /payments/intents/:id` (already real,
already used by `PaymentCallbackScreen`) is the only network call
involved. The actual gap was that nothing outside that one screen ever
remembered a payment intent existed at all.

**New durable, cross-session record** (`src/modules/user/lib/pending-payments.ts`):
a small localStorage-backed list (`STORAGE_KEYS.pendingPayments`, new —
deliberately `localStorage`, not the existing tab-scoped `sessionStorage`
slot `PaymentCallbackScreen` already used for the intent id, since
"come back later" implies surviving a closed tab). `addPendingPayment()`
is called right before the Paystack redirect (`use-checkout.ts`'s
`redirectToPaystack`, which now also takes the origin/destination Node
names from `CheckoutScreen` — the intent itself only carries their ids)
— this is the "log it" step, plus a genuine `console.log` trace.
`removePendingPayment()` is called the moment a record's real status
stops being `"pending"`, from two places: `PaymentCallbackScreen` (for
whoever stays on that screen through failed/expired/paid) and a new
`use-pending-payments.ts` hook (for whoever doesn't).

**New Dashboard section**: `PendingPaymentsSection.tsx`, mounted in
`DashboardScreen.tsx` between the header and Active Deliveries. Reads
`use-pending-payments.ts`, which checks each on-file record's live
status once per visit (not a background poll — matches "come back
later to check," not nagging the API) and drops whichever ones have
resolved; a resolution to `"paid"` also invalidates
`QUERY_KEYS.deliveries` so the now-real Order shows up in Active
Deliveries immediately rather than waiting out its own staleTime.
Renders nothing when there's nothing pending — the overwhelming
majority of Dashboard visits.

**Verified**: `npx tsc --noEmit` clean, `npx eslint src` clean (one real
finding fixed along the way — a `react-hooks/set-state-in-effect`
violation in the first draft of `use-pending-payments.ts`, resolved by
moving the resolution/cleanup logic into the query function itself
rather than a follow-up effect, same category of fix this repo's log
already has precedent for), a cleared-`.next` `npx next build` succeeds
(45 routes, unchanged count — `/dashboard` and `/checkout` grew
reflecting the new code). Dev-server smoke test: `/dashboard`,
`/checkout`, `/orders/payment-callback` all return `200`, dev log
grepped clean of errors. **Not verified**: no live payment (real or
sandboxed Paystack) was available, so an actual pending → paid
transition, the card's real rendering, and the "no need to try again"
copy landing correctly for someone genuinely worried has not been seen
end to end. Full detail in `docs/IMPLEMENTATION_LOG.md`'s matching
entry.

**Previous session (2026-08-21, absolute latest — Select Nodes: both
pickers become searchable pull-up sheets instead of endless inline
lists, plus address-proximity search):** feedback: with a growing Node
network, `/delivery/select-nodes`'s design (both the origin and
destination pickers' full lists always rendered inline, one below the
other) forces the Consumer to keep scrolling. Ask: put the lists behind
something you open on demand ("a drop down"), and let searching find
Nodes near an arbitrary address, not just Nodes whose own name/city
text happens to match what's typed.

**No new endpoint.** `GET /nodes/nearby` (`useNodes`) and the existing
`geocodingService` (Geoapify, already used by Admin's/Node's own
`AddressGeocodeButton` for Node onboarding) are both reused as-is. The
node list is already fetched once at the API's max radius (100km) and
kept in memory — an address search re-sorts that same in-memory list by
distance to the geocoded point, it doesn't refetch.

**New files**:
- `src/modules/user/components/delivery/NodePickerField.tsx` — the
  collapsed trigger shown on the main screen in place of what used to
  be a full list: an icon, a label ("Pickup Station"/"Destination
  Station"), the selected Node's name + live distance (or a
  placeholder), and a chevron. Tapping it opens the sheet.
- `src/modules/user/components/delivery/NodePickerSheet.tsx` — the
  actual list, in a pull-up sheet (same overlay/handle pattern as
  `VerificationReminderSheet`/`BottomNav`'s "More" sheet). One search
  box does two jobs: typed text instantly filters the list by
  name/city (unchanged behavior from before, just relocated); tapping
  the pin button next to it (hidden entirely when
  `geocodingService.isConfigured()` is false — same graceful-
  degradation convention `AddressGeocodeButton` already established)
  geocodes whatever's typed and re-sorts every Node by distance to that
  address instead, with a "Showing stations near {address} · Clear"
  banner to get back to normal.

**Files changed**:
- `src/modules/user/components/delivery/SelectNodesScreen.tsx` —
  rewritten. The map (origin-only, tap-a-marker-to-select) is untouched
  — it's genuinely a different, already-good interaction. Below it, the
  two always-rendered list+search sections are replaced by two
  `NodePickerField`s, each opening its own `NodePickerSheet`. Origin and
  destination each carry independent address-search state (`{point,
  label, isSearching, error}`) — searching near the receiver's address
  for the destination picker doesn't touch the origin picker's list at
  all, and vice versa. New `useNodesForPicker()` local hook centralizes
  the per-picker sort/filter logic (reference point = searched address
  point, falling back to the user's own live position; text-filtered in
  normal mode, unfiltered — just sorted — once an address is searched)
  so origin and destination don't duplicate it.

**Verified**: `npx tsc --noEmit` clean, `npx eslint src` clean (whole
repo), a cleared-`.next` `npx next build` succeeds (45 routes,
unchanged count — `/delivery/select-nodes`'s bundle grew reflecting the
two new components). Dev-server smoke test: `/delivery/select-nodes`
returns `200`, dev log grepped clean of errors. **Not verified**: no
browser session and no configured `NEXT_PUBLIC_GEOAPIFY_API_KEY` in
this environment, so neither sheet's open/search/select interaction nor
an actual address-geocode-and-resort has been seen rendered or
exercised against a real response. Full detail in
`docs/IMPLEMENTATION_LOG.md`'s matching entry.

**Previous session (2026-08-21, very latest — Node's Earnings moves to a
nav tab; login lands an already-approved Node straight on its
dashboard):** two Node-module fixes, both explicit product asks.

**Earnings promoted from a Profile row to its own nav tab.**
`NODE_NAV_ITEMS` gains "Earnings" (`ROUTES.nodeEarnings`, unchanged
route) alongside Home/Scan/Activity — same tap-once pattern the Rider
module's own Earnings tab already has. `NodeProfileScreen`'s "Earnings"
row (a `Link` to the same route) is removed — Profile still keeps its
"Business" (Node Setup) row, only Earnings moved. `NodeEarningsScreen`
switches from a back-button `TopBar` to `RootTopBar` accordingly, since
it's now a root/tab screen rather than a Profile drill-down (matching
`RootTopBar`'s existing convention for every other role's tab screens).

**Node login no longer always lands on Setup.** Previously every
`node_operator` login redirected to `/node/setup` unconditionally,
regardless of approval status — so an operator whose Node had been
approved days ago still saw the onboarding/status screen first on
every single login. Fixed in the one place this decision is made,
`modules/user/hooks/use-auth.ts`'s shared `loginMutation` (the same
role-agnostic `POST /auth/login` every role's login goes through): for
`node_operator` specifically, the login success handler now fetches
`GET /node-operators/me` (`nodeService.getMyNodeOperatorProfile()`,
already real/confirmed) before deciding where to redirect —
`status: "active"` → `nodeHome` (the real dashboard); anything else
(`pending`, or a 404 meaning onboarding was never completed) → still
`nodeSetup`, which already renders the correct state either way (the
onboarding form, or a "waiting for approval" view). This is one extra
request only at login, not on every navigation — `AuthGuard`/
`(node)/layout.tsx` were already confirmed to have no redirect logic of
their own, so this was the single spot controlling it.

**Verified**: `npx tsc --noEmit` clean, `npx eslint src` clean, a
cleared-`.next` `npx next build` succeeds (45 routes, unchanged count).
Dev-server smoke test: `/node/home`, `/node/profile`, `/node/earnings`,
`/node/activity`, `/login` all return `200`, dev log grepped clean of
errors. **Not verified**: no live NodeOperator account (one already
`active`, one still `pending`) was available to click through the
actual post-login redirect branching, so the "already-approved Node
lands on Home" behavior hasn't been exercised end to end against a real
session — only the code path and its fallback have been read/traced.
Full detail in `docs/IMPLEMENTATION_LOG.md`'s matching entry.

**Previous session (2026-08-21, newest — Rider's "Active" screen widens
into "Activity": every order, not just what's still in transit):**
follow-up to the same-day `RIDER_CAPACITY_UNAVAILABLE` debugging
session (see below) — once that was traced to a backend capacity-count
bug (confirmed: a rider with 2 `completed` + 1 `in_transit` order was
still rejected), the explicit ask was to give the rider a real way to
see all three (and every other status) themselves: "pull all orders
for the rider, completed, collect, in transit all... use the active
page... tab or bar that can be clicked or slide."

**No new endpoint** — this is entirely a new consumer of `GET
/handoffs/my-orders` (already ✅, real, confirmed), which was already
being fetched by `ActiveDeliveriesScreen` but immediately filtered down
to only `rider_assigned`/`in_transit` before anything else in the
response ever reached the screen. Widened the same screen instead of
building a new one, per the explicit "use the active page for this"
instruction — route (`/rider/active-deliveries`) and file
(`ActiveDeliveriesScreen.tsx`) both unchanged; only the nav label
(`RIDER_NAV_ITEMS`, "Active" → "Activity") and the screen's own content
changed.

Four tabs (`ActivityFilterTabs`, new): **All**, **In Transit**
(`rider_assigned`/`in_transit` — the screen's entire previous content,
unchanged behavior, still the default tab), **Awaiting Collection**
(new: `arrived_at_destination`/`ready_for_collection` — handed off,
out of the rider's hands, waiting on the receiver), **Completed** (new:
`completed`). Tappable (matching `EarningsFilterTabs`' existing pill
pattern) **and** swipeable — a plain touch-delta handler on the content
area, no new dependency, satisfying the "click or slide" ask.

Every row now shows a real `HandoffStatusPill` (promoted from
`modules/node/components/handoff/HandoffStatusPill.tsx` to
`components/ui/HandoffStatusPill.tsx` — same promotion pattern as
`QrScannerView`, old path re-exports so nothing in the Node module
broke — plus two status configs it never needed before,
`ready_for_collection`/`completed`, since Node's own screens branch
away before reaching a status pill for those). Only the two
still-actionable statuses keep the "Get handoff code" + navigate
controls; everything else is a read-only record.

**Verified**: `npx tsc --noEmit` clean, `npx eslint src` clean (whole
repo), a cleared-`.next` `npx next build` succeeds (45 routes,
unchanged count). Dev-server smoke test: `/rider/active-deliveries`,
`/rider/home`, `/rider/available-jobs`, `/node/home`, `/node/activity`
(the last two exercise the promoted/re-exported status pill) all
return `200`, no runtime errors in the dev log. **Not verified**: no
live Rider session with a real mix of in-transit/awaiting-collection/
completed orders was available, so the four populated tabs and the
swipe gesture haven't been seen rendered against real data. Full detail
in `docs/IMPLEMENTATION_LOG.md`'s matching entry.

**Previous session (2026-08-21, later — Consumer delivery cards get a
real progress bar instead of the dashed route line):** feedback: the
Consumer dashboard/checkout cards' route indicator looked like a
decorative dashed sketch, not an actual progress bar. Root cause:
`RouteRail`'s dashed "route" texture (a `repeating-linear-gradient`
overlay, the app's documented "signature visual motif") rendered on
both its variants — `compact` (delivery/order-summary cards) and
`full` (the tracking screen, Admin's Order Details). Scoped the fix to
`compact` only, since that's what "the cards" meant and `full`'s dotted
line is an intentional, documented motif for the dedicated tracking
view, not something flagged here: the dashed overlay now renders only
when `variant="full"`; `compact` is a clean solid `bg-brand-blue` fill
in a slightly thicker (`h-1.5` vs. the old shared `h-[2px]`) rounded
track, plus real `role="progressbar"`/`aria-value*` attributes it
didn't have before. No caller changed — `DeliveryCard`
(`/dashboard`, `/track`) and `OrderSummaryCard` (`/checkout`) both use
`RouteRail`'s default `compact` variant already, so this is a one-file
fix. **Verified**: `tsc`/`eslint` clean, a cleared-`.next` build
succeeds (45 routes, unaffected), dev-server smoke test on
`/dashboard`, `/track`, `/checkout` all `200`. **Not verified**: no
browser session, so the actual visual result hasn't been seen rendered.

**Previous session (2026-08-21, later still — Rider Profile's "Vehicle
Details" shows a real license number; Verification screen shows full
details + the uploaded image + a "Verified" tag):** two Rider-module
fixes, no new endpoint — both reuse `GET /riders/me`
(`useRiderVerification`), already fetched on both screens involved.

`RiderProfileScreen`'s "Vehicle Details" card used to read
`useRiderProfile()` → `riderService.getProfileDetails()`, a permanent
`NOT_IMPLEMENTED` stub — no vehicle type/plate/verified endpoint exists
anywhere in `docs/API.md`, so that card had silently rendered `"—"`/
blank in production since it was built. **Deleted, not left stubbed**:
`getProfileDetails()`, the `VehicleDetails`/`RiderProfileDetails` types
it returned, and `use-rider-profile.ts` (its one caller, confirmed via
grep). The card now shows `licenseNumber` off the already-fetched
verification profile instead — the one real, license-shaped field that
actually exists — with a "Verified" pill keyed off real
`status === "active"`, not the deleted fake `vehicle.isVerified`.

`RiderVerificationScreen`'s "You're verified" state used to show a bare
`EmptyState` with none of the rider's own details, while the *pending*
state right next to it already showed employer/license/a document
link — so approval made your own submission *less* visible, not more.
Rewrote `VerificationStatusView` as one shared layout for both states:
a status banner (icon + heading + copy, "Verified" pill added for
`active` only), a Verification Details card (employer, license number),
and — the part that needed the image, not just a link to it — the
uploaded document now renders inline as an `<img src={doc.viewUrl}>`
(still wrapped in the same `<a target="_blank">` for full-size), for
both approved and pending riders.

**Verified**: `npx tsc --noEmit` clean, `npx eslint src` clean (whole
repo — confirms no stray reference to anything deleted), a
cleared-`.next` `npx next build` succeeds (45 routes, no route added/
removed, just `/rider/profile` and `/rider/verification`'s sizes
shifting slightly). Dev server: both routes return `200`. **Not
verified**: no live, verified Rider account was available, so the
populated license number, "Verified" pill, and — most worth checking
first — whether the signed Cloudinary `viewUrl` actually renders as an
`<img>` without a CORS/hotlink issue, haven't been seen against real
data. Full detail in `docs/IMPLEMENTATION_LOG.md`'s matching entry.

**Previous session (2026-08-21, later — Profile moved to the top bar
across all four roles, Admin gets a Profile screen, Admin's bottom nav
gets a "More" sheet):** explicit product ask: every role's navbar
should be logo-left/Profile-right, with "Profile" removed as a tab from
both `Sidebar` (desktop) and `BottomNav` (mobile). Scoped down after
clarifying with the user: the new bar applies only to each role's
root/tab screens (Home, Track, Activity, Jobs, Active, Earnings, and
Admin's nine Sidebar tabs) — sub-screens (detail pages, forms, Profile
itself) keep the existing back-button `TopBar` unchanged. Admin needed
two follow-on decisions: it had no Profile screen at all (only
Settings, a different destination) — user asked for a real one to be
built, matching the other three roles' pattern; and Admin's mobile
`BottomNav` was asked to cap itself at 4 visible tabs with a "More"
pull-up sheet for the rest, since `ADMIN_NAV_ITEMS` has nine entries.

**New shared component**: `components/layout/RootTopBar.tsx` — logo
(mobile only; `Sidebar` already shows it on desktop) + a Profile button
(initials avatar, falls back to a generic `UserIcon` with no session)
linking to `profileHref`. An optional `hideOnDesktop` prop lets Admin's
root screens render it mobile-only, since Admin already has its own
persistent desktop bar (`AdminTopBar`) — the two never stack. Mounted
on: User's `DashboardScreen`/`TrackListScreen`; Node's
`NodeHomeScreen`(all five branches)/`ActivityScreen`; Rider's
`RiderHomeScreen`/`AvailableJobsScreen`/`ActiveDeliveriesScreen`/
`MyEarningsScreen`; all nine Admin root screens
(`AdminDashboardScreen`, `OrderListScreen`, `NodeNetworkScreen`,
`TeamManagementScreen`, `ApprovalsScreen`, `PricingScreen`,
`DisputeCenterScreen`, `AnalyticsScreen`, `RevenueSplitScreen`) with
`hideOnDesktop`. Everywhere a screen's only title source used to be the
old `TopBar`'s `title` prop and its in-page `<h1>` was `hidden md:block`
(`TrackListScreen`, `ActivityScreen`, `MyEarningsScreen`, plus
`NodeHomeScreen`'s node-name heading), that `hidden` was dropped so the
heading now shows on mobile too — otherwise those screens would have
silently lost their title on small screens once the bar stopped
carrying one.

**`nav-config.ts`**: "Profile" removed from `USER_NAV_ITEMS`,
`NODE_NAV_ITEMS`, `RIDER_NAV_ITEMS` (Admin's `ADMIN_NAV_ITEMS` never had
one — Admin's account destination was always "Settings", a separate
thing). `Sidebar`/`BottomNav` consume these arrays directly, so removing
the entries there was sufficient — neither component needed a code
change to stop rendering a Profile tab.

**New Admin Profile screen**: `modules/admin/components/profile/AdminProfileScreen.tsx`
at `/admin/profile` (`ROUTES.adminProfile`, new) — avatar/name/role,
email/phone rows, logout. Same shape as the other three roles'
`ProfileScreen`s; logout is inline (`authService.logout()` +
`useAuthStore`), same pattern `AdminSidebar`'s existing logout button
already uses, not a shared hook (no `useAdminAuth().logout` existed to
reuse). `AdminTopBar`'s previously-decorative avatar is now a `Link` to
this screen — the desktop half of "Profile on the right" for Admin.

**`BottomNav`'s "More" overflow**: new `moreItems` prop and a
`MAX_VISIBLE_TABS = 4` threshold — past four `items`, the remainder
(plus anything in `moreItems`) collapse into a "More" tab that opens a
pull-up sheet (`MoreNavSheet`, same overlay/handle pattern as
`VerificationReminderSheet`). Only Admin (`AdminShell`, nine
`ADMIN_NAV_ITEMS`) triggers this — User (2 items)/Node (3)/Rider (4) all
still fit within four tabs post-Profile-removal, so their `BottomNav`
renders exactly as before. `AdminShell` passes
`moreItems={[ADMIN_SETTINGS_NAV_ITEM]}` so Settings — pinned only in
the desktop `AdminSidebar` before this session — is finally reachable
from mobile too, in the same sheet as the overflow tabs.

**Verified**: `npx tsc --noEmit` clean, `npx eslint src` clean, a
cleared-`.next` `npx next build` succeeds (45 routes, up from 44 —
`/admin/profile` is new). A dev-server smoke test `curl`'d every touched
route (`/dashboard`, `/track`, `/profile`, `/node/home`,
`/node/activity`, `/node/profile`, `/rider/home`,
`/rider/available-jobs`, `/rider/active-deliveries`,
`/rider/deliveries`, `/rider/profile`, `/admin/dashboard`,
`/admin/profile`, `/admin-login`) and confirmed `200` on all of them.
**Not verified**: no live session (any role) or browser was available,
so the actual bar layout, the initials-avatar rendering, and the "More"
sheet's open/close/tap-through haven't been seen rendered — same
standing caveat as most sessions in this log.

**Previous session (2026-08-21, earlier — Rider Home gets a Jobs preview
section):** the ask: Rider Home should show a taste of the job board
directly on the dashboard, but viewing the full list or actually
accepting a job stays on the dedicated Jobs screen
(`/rider/available-jobs`) — Home never gets an Accept action of its
own. Read `docs/ARCHITECTURE.md`, `docs/HANDOFF.md`,
`docs/IMPLEMENTATION_LOG.md`, `docs/API_INTEGRATION_STATUS.md`,
`docs/API.md`, and the existing Rider screens before writing anything,
per standing instruction.

**No new endpoint involved** — this reuses `GET
/handoffs/available-orders` (already ✅ integrated, see
`docs/API_INTEGRATION_STATUS.md`'s Handoffs section) through the
existing `useAvailableOrders` hook, just called a second time with
`limit=3`. New component
`modules/rider/components/dashboard/AvailableJobsPreview.tsx`: a
"Jobs near you" header + "View all" link (→
`ROUTES.riderAvailableJobs`), up to 3 compact rows (route,
parcel size, distance when `isSortTrustworthy`), a "+N more waiting"
line when `total` exceeds 3, a skeleton while loading, and a quiet
"No jobs available right now" card on a genuine empty list. Every row
is a `Link` to `/rider/available-jobs` — there's no per-order detail
route for an unclaimed order to deep-link into, and no Accept button
here on purpose, so a rider can't half-commit to a job from a summary
card that doesn't carry the full picture (age, both node addresses,
capacity warnings) `AvailableJobCard` shows on the real screen. On a
real fetch error the component renders nothing (`return null`) rather
than a second copy of `AvailableJobsScreen`'s `ErrorAlert` — Home is a
summary, not a duplicate of that screen's error handling.

`RiderHomeScreen.tsx` mounts it only when `availability === "online"`
**and** `verification?.status === "active"` — the same gate
`AvailableJobsScreen` itself enforces, since the real endpoint answers
`403 RIDER_NOT_ACTIVE` otherwise. An online-but-not-yet-verified rider
still sees the previous plain "View Job Offers" banner (unchanged),
which routes to the Jobs screen's own "Verification required" gate —
so nothing regressed for that state, it just doesn't fetch a list that
was always going to 403. Offline keeps the existing "You're offline"
card, unchanged.

**Verified**: `npx tsc --noEmit` clean, `npx eslint` clean on every
changed/new file, a cleared-`.next` `npx next build` succeeds (44
routes, `/rider/home` grew 157 B → 3.99 kB reflecting the new
component, `/rider/available-jobs` unaffected). A dev server smoke
test confirms `/rider/home` and `/rider/available-jobs` both return
`200` with the expected `AuthGuard` spinner markup (no live Rider
session in this environment). **Not verified**: no live Rider session
(verified-`active`, online, with real unclaimed orders at a nearby
Node) was available, so the populated preview — real rows, the
"+N more" line, the empty and skeleton states — has not been seen
rendered against a live backend. Same standing caveat as most Rider-
module work in this log.

**Previous session (2026-08-20 — full endpoint/mock audit, Revenue Split
feature, Vendor→Node rename):** a complete re-audit of every API call
against the current `docs/API.md` (now 47 documented endpoints, up
from 39), a mock-data sweep, and — at the user's explicit mid-session
request — a full rename of "Vendor" to "Node"/"Node Operator"
throughout the codebase. Full detail in
`docs/IMPLEMENTATION_LOG.md`'s 2026-08-20 entry and
`docs/API_INTEGRATION_STATUS.md`'s matching update; short version:

- **Deleted, undocumented and dead**: the Flag Issue screen (whole
  feature — `/nodes/operator/inventory` 404s and was never in
  `docs/API.md`; the screen had zero nav entries anywhere, fully
  unreachable), Super Admin's elevation form
  (`/corporate-ops/staff/elevate-superadmin` — no `super_admin` concept
  exists in the role enum), rider GPS telemetry ping
  (`/maps/rider/telemetry-ping` — undocumented *and* never actually
  called from anywhere, despite `rider.service.ts`'s header implying it
  was), and three more undocumented-and-unused endpoint constants
  (`franchiseNodes.onboardOperator`, `nodes.onboard`,
  `nodes.updateStatus`). **Not touched**, per the user's explicit
  instruction: the Consumer OTP signup/login flow
  (`/auth/consumer/request-otp`/`request-login-otp`) — also
  undocumented (current `API.md` only has plain register/login), but
  live and load-bearing; flagged, not rebuilt. See
  `docs/API_INTEGRATION_STATUS.md`'s Inconsistencies section, item 9 on
  its priority list.
- **New real integrations — Earnings (revenue split)**: `docs/API.md`
  gained a whole section (`GET /earnings/mine`, `GET /earnings/my-node`,
  `admin/revenue-split` group) with zero prior frontend integration.
  Built all three: Rider's Home/Profile stat cards and "Earnings" nav
  tab now read real data (`riderService.getEarningsSummary`/
  `listMyEarnings`) instead of throwing `NOT_IMPLEMENTED` — and no
  longer show a fabricated `rating` field, since nothing in the real
  API supplies one. New `NodeEarningsScreen` (`/node/earnings`,
  reached from Node Profile). New `RevenueSplitScreen`
  (`/admin/revenue-split`) replaces the old `RiderEarningsScreen`,
  which had been wired to `/admin/rider-earnings` — an endpoint that
  never appeared in `docs/API.md`.
- **Mock-data audit**: `src/core/mocks/` is down to one file
  (`mock-utils.ts`, kept for `generateId()` — a real ID-gen helper, not
  fake data). The other five were deleted: either fully unreferenced,
  or reachable only through dead commented-out mock-service blocks
  (also deleted) and one live fallback (`node.service.ts`'s
  `mapInventoryResponse()` defaulting to `MOCK_NODES[1]`) that went
  away along with the Flag Issue feature above. Also deleted
  `SurgeAlertBanner` (Rider Home) — a hardcoded fake "surge" card,
  already commented out of use but still in the tree.
- **Vendor→Node rename** (user's explicit request — "vendor and node
  describe the same thing, use node"): `src/modules/vendor/` →
  `src/modules/node/`, `vendor.service.ts`/`vendorService` →
  `node.service.ts`/`nodeService`, `vendor.types.ts` → `node.types.ts`,
  every `Vendor*` screen/hook → `Node*`, every `ROUTES.vendor*`/
  `QUERY_KEYS.vendor*` → `ROUTES.node*`/`QUERY_KEYS.node*` **including
  the URL paths** (`/vendor/home` → `/node/home`,
  `/vendor-scan` → `/node-scan`, `/vendor/node-setup` → `/node/setup`,
  etc. — not just internal identifiers), `VENDOR_NAV_ITEMS` →
  `NODE_NAV_ITEMS`, and user-facing copy ("Shop Owner" → "Node
  Operator" on the Node Profile screen). **If you're looking for
  anything under `modules/vendor`, `vendor.service.ts`, or a
  `/vendor/*` route and can't find it, this is why — it's under
  `modules/node`/`node.service.ts`/`/node/*` now.**

**Verified**: `npx tsc --noEmit` clean, `npx eslint src` clean, and —
unlike most prior sessions in this log — a full `npx next build` was
run and succeeded (47 routes generated, including the new
`/admin/revenue-split` and `/node/earnings`), specifically because a
rename this size is exactly what a type-checker alone can miss (Next's
route-group folder resolution in particular). **The app was not run in
a browser against a live backend this session** — the new Earnings/
Revenue Split screens are built strictly from `docs/API.md`'s
documented contract and share the same "not live-verified" caveat as
every other screen flagged that way below.

---

**Previous session (2026-08-17, follow-up 5 — dummy activity toast
removed, icon reflects real status):** the Activity screen's top card
(`RiderHandoffToast`) was hardcoded demo data ("LC-482TX picked up by
Rider — Tunde A., 2 mins ago") sitting above the real Activity Log.
Deleted, not just unused — `GET /handoffs/my-node/orders` is already
newest-first per docs/API.md, so the real most-recent order now sits
in the exact spot the fabricated card used to occupy, with no re-sort
needed. Also widened icon selection from a plain origin/destination
split to a status-driven one (`activityEntryType()` in
`ActivityScreen.tsx`, switching on the order's real `status`) — same
existing `ActivityEventType` set, no invented icon.

**Verified**: `npx tsc --noEmit` and `npx eslint src` clean across the
repo. Per standing instruction, the app was not run, built, or tested
this session.

**Previous session (2026-08-17, follow-up 4 — Activity Log and Order
History collapsed into one list):** follow-up 3 (below) gave
`ActivityScreen` two tabs — the original notification-backed "Activity
Log" and a new "Order History" tab for the data moved off the retired
Inventory screen. Asked for one list instead, reusing the Activity
Log's card for the history data.

`ActivityScreen` now has no tabs. Its single list is sourced from
`useMyNodeOrders()` (`GET /handoffs/my-node/orders`) instead of
`useActivityLog()` (`GET /notifications/user/{userId}`) — a genuine
data-source swap. A new mapper turns each order into the existing
`ActivityLogEntry` shape so `ActivityLogItem` renders it unchanged:
title = tracking code, description = parcel + destination/origin
(direction from the real `myRole`), `type` picked from `myRole` for a
representative icon, `tag` = the order's status label via a new
exported `getHandoffStatusLabel()` on `HandoffStatusPill.tsx` (reuses
its `STATUS_CONFIG` map rather than duplicating one).
`ActivityTabs.tsx`/`OrderHistoryList.tsx` (both introduced earlier the
same day) are deleted — fully superseded, no remaining caller.

**The notification-backed integration is left in place, not deleted.**
`useActivityLog()`/`vendorService.listActivity()`
(`GET /notifications/user/{userId}`) now have no caller, but it's a
real, working integration losing its only call site — not dead code
from a broken endpoint like everything deleted in earlier sessions.
Flagged in the service file's header and in
`IMPLEMENTATION_LOG.md`'s matching entry; needs a product decision
(remove it, or reserve it for a future notifications surface), not a
silent removal.

**Verified**: `npx tsc --noEmit` and `npx eslint src` clean across the
whole repo; grep confirms no remaining reference to
`ActivityTabs`/`OrderHistoryList`. Per standing instruction, the app
was not run, built, or tested this session.

**Previous session (2026-08-17, follow-up 3 — Inventory retired, its four
tabs redistributed into Home and Activity):** the user asked for the
standalone Inventory screen (shipped earlier the same day, then given
inline rider-code entry in follow-up 2 below) to be retired — Pickup
and Incoming into Home's Awaiting Pickup and a new Awaiting Arrival
section, Collection into Home's Ready for Collection section, History
into Activity. Home is now a pure summary/dashboard: every row just
navigates to a dedicated details page for that order, which is where
all the interaction (rider-code entry, check-in, collection) now lives
— no more inline expand-in-place on Home's own rows.

Read `docs/API.md` again before writing anything, per the user's
explicit "do not invent, hardcode, or assume any data or actions not
provided by the endpoints" instruction. Confirmed: **no endpoint
anywhere in the Node Operator's API surface returns rider identity**
(name/phone/anything) — the 6-digit code is the entire protocol — and
**no destination-side endpoint returns receiver PII** (already true,
already documented in `CollectParcelScreen`'s own header comment before
this session). Neither is shown on the new details pages.

New route `/vendor/handoff/[orderId]` (`HandoffDetailScreen`) — one
screen for both Awaiting Pickup and Awaiting Arrival, direction
inferred from the order's own `myRole` rather than two near-identical
routes. Shows every `NodeOrderSummary` field, plus the rider-code entry
reusing `useConfirmHandoff` verbatim (same hook, same
`confirm-handoff` call, same copy) — just targeted at one order via a
mount-time effect instead of a list-row expand. Falls back to a
read-only view if the order isn't actually pickup/arrival-pending when
loaded, since a stale link would otherwise offer an action the server
would reject.

`CollectParcelScreen` extended (not replaced) to cover Ready for
Collection's other sub-state too: a new "needs check-in" branch shows
full parcel info plus the check-in/"Send" action (`useParcelIntake`,
the same hook Inventory's Collection tab used) — the exact action the
task asked to preserve. On success the screen falls through to the
existing "ready" branch on its own, since the intake mutation
invalidates the same cached query the screen reads from. The "ready"
branch's info card is also enriched with parcel/route/status details it
didn't show before (previously just the tracking code).

History moved into Activity as a second tab (`ActivityTabs`, new),
fed by `useMyNodeOrders()` — already fetched elsewhere in the app, so
TanStack Query dedupes rather than firing an extra request.

**Inventory is deleted, not hidden**: the whole
`src/modules/vendor/components/inventory/` directory and
`src/app/(vendor)/vendor/inventory/` route are gone, along with the
"Inventory" nav item. `ROUTES.vendorInventory` removed;
`ROUTES.vendorHandoffDetail` added. Three stale `ROUTES.vendorInventory`
references in `CollectParcelScreen` fixed to `ROUTES.vendorHome`.

**Verified**: `npx tsc --noEmit` and `npx eslint` clean on every file
touched; a full-repo grep confirms no remaining source reference to
`vendorInventory`/`InventoryScreen`/`InventoryTabs`/`HandoffOrderList`/
the old `CollectionList`/`HistoryList`. Per explicit instruction, **the
app was not run, built, or tested this session** — `tsc`/`eslint` were
treated as static verification, not as "running" anything; nothing has
been seen rendered in a browser. Full detail in
`IMPLEMENTATION_LOG.md`'s 2026-08-17 (follow-up 3) entry.

**Previous session (2026-08-17, follow-up 2 — Node Dashboard rebuilt off
real endpoints):** closed the gap the previous session flagged below as
"the best next task": `VendorHomeScreen` (`/vendor/home`) read the
undocumented `GET /nodes/operator/inventory`, which 404s on the
deployed backend, and rendered the error identically to a genuine
empty list — the app's own Home tab was a dead endpoint wearing a UI
that looked fine.

Rebuilt on the two real routes already wired elsewhere: `GET
/node-operators/me` (Node identity/capacity — same route
`useVendorNodeSetup` already polls) and `GET /handoffs/my-node/orders`
(the live parcel snapshot, already built earlier the same day for
Inventory). Neither returns an "occupied capacity" figure, so
`use-node-dashboard.ts` derives it: any order currently physically at
the Node on either side of the custody chain (`isAwaitingPickup`/
`needsIntake`/`isReadyForCollection`; `in_transit` excluded — not
physically here yet).

UI now distinguishes three states the old build silently collapsed
into "empty": **not onboarded** (404 → prompt to `/vendor/node-setup`),
**onboarded but not yet Admin-approved** (`status !== "active"` →
"waiting for approval", link back to Node Setup), and **active** (the
real dashboard). `NodeParcelRow` (rendered the dead `NodeParcel` shape)
is deleted; `NodeOrderRow` (new) renders `NodeOrderSummary` instead,
using the same `HandoffStatusPill` Inventory already uses, and
ready-for-collection rows deep-link straight to the collect screen now
that the ids are real order uuids. The Flag Issue screen
(`ROUTES.vendorFlag`) is no longer linked from Home — it was the
non-ready rows' destination before, but `flagParcel()` throws
`NOT_IMPLEMENTED` unconditionally (no backend route); routing a
now-functional screen into a guaranteed-failure flow would be a
regression.

**Verified live against the deployed backend**: registered a
throwaway NodeOperator account through the dev server's own API proxy
and drove `GET /node-operators/me` (404 before onboarding, `200` with
`status: "pending"` after), `POST /node-operators/onboarding`, and
`GET /handoffs/my-node/orders` (empty list, no error) — confirming
every branch `useVendorNode`/`useNodeDashboard` handles fires on real
responses, not just assumed shapes. **Not verified**: no Admin session
existed to approve the test Node, so the "active" happy path (real
`CapacityBar` numbers, populated tabs) wasn't seen rendered — no
browser automation tool was available in this session's environment,
so this rests on `npx tsc --noEmit` / `npx eslint` / `next build`
(all clean) plus the live API checks above, not a screenshot. Full
detail in `IMPLEMENTATION_LOG.md`'s matching entry.

**Previous session (2026-08-17, follow-up — the Node operator's three
fragmented screens become one tabbed Inventory):** the user's framing:
a screen-per-step design (a dedicated `RiderHandoffScreen` for pickup,
another for arrival, then a separate `AwaitingCollectionScreen` for the
shelf) doesn't scale, especially now that all three read the exact same
underlying data (`GET /handoffs/my-node/orders`, shipped earlier the
same day — see below). Asked for a single, tabbed, mobile-first
Inventory view instead.

**Built `InventoryScreen` at `/vendor/inventory`**, four tabs over one
`useMyNodeOrders()` query:
- **Pickup** — origin side, awaiting a rider (`isAwaitingPickup`).
- **Incoming** — destination side, rider en route (`isAwaitingArrival`).
- **Collection** — destination side, arrived: "needs check-in"
  (`needsIntake`, one-tap email) or "ready for collection"
  (`isReadyForCollection`, routes to the dedicated `CollectParcelScreen`
  — code + identity attestation is a different shape of task, kept as
  its own screen rather than another expandable row).
- **History** — every order, unfiltered, newest first. New: no prior
  screen showed this. Read-only by design (it's a record, not a queue).
  Each row's timestamp is `createdAt` (order placement) labeled
  "Placed" — `my-node/orders` carries no per-transition timestamp, so
  "arrived X ago"/"checked in X ago" aren't shown anywhere anymore
  (they weren't reliable after the stores were deleted earlier the same
  day either — see below).

Pickup/Incoming rows **expand in place** for the 6-digit code entry
(mobile-first: the single most frequent counter action shouldn't need a
page navigation). `useConfirmHandoff` is reused as-is, just consumed by
Inventory instead of the old dedicated screen — its `handoffType` is
kept in sync with whichever of Pickup/Incoming is the active tab via one
effect. A toast (`useNotificationStore`) confirms success, since the
confirmed row simply disappears from its tab once the query refetches
rather than showing a dedicated success screen.

**`RiderHandoffScreen` and `AwaitingCollectionScreen` are deleted, not
deprecated** — along with their routes
(`/vendor/rider-handoff`, `/vendor/awaiting-collection` as a list page).
`/vendor/awaiting-collection/[orderId]/collect` (`CollectParcelScreen`)
stays, reached from Inventory's Collection tab instead. `VENDOR_NAV_ITEMS`
now has one "Inventory" entry (`ArchiveIcon`) where "Handoff" and
"Collect" used to be two — net one fewer bottom-nav item, not one more.
Two remaining cross-links fixed: `NodeParcelRow` (Node Dashboard) and
`CollectParcelScreen`'s "Back to Counter" buttons now point at
`ROUTES.vendorInventory`.

**Explicitly out of scope this pass** (at the time — **closed in the
follow-up 2 session above**): `VendorHomeScreen`'s own parcel list
(`ParcelFilterTabs`/`NodeParcelRow`/`useNodeParcels`) was untouched
and still silently empty in production — it was fed by the
undocumented, 404ing `GET /nodes/operator/inventory`, a different,
older gap than the one this session closed. Pointing Home's list at
`use-my-node-orders.ts` instead was the natural next step and is
exactly what the later session did; the "product decision on what the
row should show" this paragraph flagged as blocking a straight
data-source swap was resolved by dropping the sender/receiver fields
`NodeOrderSummary` doesn't carry and showing origin/destination Node
name instead, matching every other handoff-module row.

**Verification**: `npx tsc --noEmit` clean, `npx eslint src` clean
(one `react-hooks/set-state-in-effect` violation caught and fixed by
keying the expanded code-entry panel per order id instead of resetting
its state in an effect), `next build` from a cleared `.next` succeeds —
`/vendor/rider-handoff` and `/vendor/awaiting-collection` are gone from
the route table, `/vendor/inventory` and
`/vendor/awaiting-collection/[orderId]/collect` are both present.
`/vendor/inventory`, `/vendor/home`,
`/vendor/awaiting-collection/[orderId]/collect` all return `200` from a
dev server with no error markers. **Not verified**: no NodeOperator
session available, so the expand-in-place confirm flow, the tab counts,
and the History tab's real data have not been seen in a browser.

**Earlier the same session (2026-08-17 — `docs/API.md` gained `GET
/handoffs/my-orders`, `GET /handoffs/my-node/orders`, `GET
/admin/rider-earnings`, and `licenseNumber` on rider onboarding; wired
all four and used the first two to finally close the arrival gap):**

The user pointed out that the previous session's "arrival is backend-
blocked" conclusion was reasonable given what the API documented *at
the time*, but `docs/API.md` had since been updated with exactly the
endpoints that close it. This session re-read the whole doc rather than
trusting the earlier summary, confirmed the new endpoints, and
implemented against them:

- **`GET /handoffs/my-node/orders`** — every order that's ever touched
  the caller's Node, either as origin or destination, `myRole` on each
  item saying which. This is what `confirm-handoff`/`intake`/
  `collection-code/resend`/`collect` needed all along and never had: a
  server-side way for the *destination* operator to resolve an order
  uuid, the same way `by-tracking-code` already let the origin operator
  do it. New hook `modules/vendor/hooks/use-my-node-orders.ts` wraps it
  with four filters (`isAwaitingPickup`/`isAwaitingArrival`/
  `needsIntake`/`isReadyForCollection`) derived from one query.
- **`GET /handoffs/my-orders`** — every order a rider has ever been
  assigned, current and past. Same fix on the rider side, closing the
  "no rider-scoped my-deliveries endpoint" gap. New hook
  `modules/rider/hooks/use-my-orders.ts`.
- **`GET /admin/rider-earnings`** — read-only payout-readiness report,
  one row per rider with a `completed` order. New screen
  `RiderEarningsScreen` at `/admin/rider-earnings`, added to
  `ADMIN_NAV_ITEMS` next to "Analytics".
- **`licenseNumber`** added to `POST /riders/onboarding`'s request and
  `RiderVerificationProfile`'s response. Added as a required field to
  `RiderVerificationScreen`'s form and shown in the status view when
  present (`null` for riders who onboarded before this field existed).

**What this closed, concretely: `/vendor/rider-handoff` now works
identically in both directions.** Pickup and arrival are the same
pick-a-parcel shape — tap a row from `GET /handoffs/my-node/orders`
(filtered by `myRole` + the status that direction expects), type the
rider's 6 digits, confirm. The "arrival is blocked, here's a card
explaining why" design from the last two sessions is gone, not just
hidden — there's no code path left that renders it, because there's
finally a real list to pick from.

**Three localStorage stores deleted, not deprecated**:
`store/rider-jobs.store.ts`, `store/node-outgoing.store.ts`,
`store/node-parcels.store.ts`. Each one's own header said "delete this
when the matching endpoint lands" — this is that. Everything that read
them now reads a TanStack Query hook instead:
`use-confirm-handoff.ts`, `use-handoff-lookup.ts`,
`use-awaiting-collection.ts`, `use-collect-parcel.ts`,
`use-parcel-intake.ts` (vendor side), `use-active-deliveries.ts`,
`use-accept-order.ts`, `use-handoff-code.ts` (rider side). One
consequence worth knowing: `AwaitingCollectionScreen` and
`CollectParcelScreen` used to show "arrived X ago" / "checked in X ago"
timestamps from the old stores' own bookkeeping (`arrivedAt`/
`intakeAt`) — `NodeOrderSummary` doesn't carry per-transition
timestamps, only `createdAt` (order placement), so those relative-time
lines were dropped rather than backed by a stale/wrong value. If that
granularity matters, it needs a real field on the API response, not a
client-side guess.

**Deliberately not wired to the new endpoints**: `MyDeliveriesScreen`
("My Deliveries" earnings tab). Its `DeliveryHistoryRow` needs a
`payout` amount per job — `GET /handoffs/my-orders` doesn't return one
(no rider fee/payout field exists anywhere in `docs/API.md`), and
`riderService.getEarningsSummary()`/`getJobHistory()` both stay
`NOT_IMPLEMENTED` for that reason. Wiring `getMyOrders()` into that
screen would mean inventing numbers; see `rider.service.ts`'s header.

**Verification**: `npx tsc --noEmit` clean, `npx eslint src` clean,
`next build` from a cleared `.next` succeeds (`/admin/rider-earnings`
appears in the route table). `/vendor/rider-handoff`,
`/vendor/awaiting-collection`, `/rider/active-deliveries`,
`/rider/verification`, and `/admin/rider-earnings` all return `200`
with no `Application error`/`__next_error__` markers from a dev server.
**Not verified**: no NodeOperator/Rider/Admin session was available, so
none of the new list endpoints, the arrival pick-list, or the earnings
table have been seen against real data — same open item every session
in this module has left.

**Previous session (2026-08-16 — finished wiring `RiderHandoffScreen` to
the hooks the previous session already rebuilt):** the previous
session's design below (pick-list for pickup, blocked card for arrival)
was correct and already lived in `use-confirm-handoff.ts`,
`use-handoff-lookup.ts`, `use-outgoing-parcels.ts` and
`store/node-outgoing.store.ts` — but `RiderHandoffScreen.tsx` itself
never finished the migration to match it. The component on disk still
destructured removed hook exports (`resolveByTrackingCode`,
`resolvedOrder`, `isResolving`, `lookupNotFound`, `lookupError`) behind
comments, never called the hook's `selectOrder`, and its confirm button
called `confirmHandoff(code)` unconditionally. Since the hook only
mutates when `selectedOrderId` is set, **pickup could not actually
complete** despite the doc below (and `API_INTEGRATION_STATUS.md`)
describing it as working end to end — nothing in the UI ever set that
id. This session rebuilt the screen body to actually use
`outgoingParcels`/`isOutgoingHydrated`/`selectedOrderId`/`selectOrder`
for the pickup pick-list, render the arrival-blocked card in place of
any form, and gate the confirm button on `isPickup && selectedOrderId &&
code.length === HANDOFF_CODE_LENGTH`. No hook/store/type changed —
`docs/API.md` was re-read and the existing design already matched it.
`npx tsc --noEmit`, `npx eslint src`, and a cleared-`.next` `next build`
all pass; `/vendor/rider-handoff` returns `200` from both prod build
output and a dev server. Still no NodeOperator session available, so the
pick-list, scan-to-recover, and prune-on-409 paths remain unexercised
against a live backend — see the previous session's note below, which
still applies unchanged.

**Previous session (2026-08-15, last — the operator stops asking the rider
for a tracking code):** `RiderHandoffScreen` required a tracking code
*and* the 6-digit code before an operator could confirm a handoff, and
hinted the tracking code could be read off the rider's screen. The
contract has no such step: `request-code` returns `{code, expiresAt}`
and nothing else, the code is neither emailed nor logged, so six digits
is the entire rider→operator payload. The endpoints were wired
correctly all along — the mistake was expecting the rider to supply the
order identity that `confirm-handoff` needs in its path.

**`/vendor/rider-handoff` now has exactly one input: the 6 digits.**
There is no tracking-code field on it at all, in either direction. That
was a deliberate second pass — a code box on this screen reads as
something to ask the rider for, which is the whole confusion being
removed.

**How the operator gets the uuid now:**
- **Pickup (origin).** From their own drop-off confirms. `POST /drop-off`
  returns the uuid, and `use-handoff-lookup.ts` records it into a new
  `src/store/node-outgoing.store.ts`. The handoff screen shows that as a
  pick-list: tap the parcel, type six digits, confirm.
- **Recovery, when a parcel isn't on the list** (drop-off taken on
  another device, storage cleared): scan its label at `/vendor-scan`.
  The drop-off preview's *lookup alone* now re-adds it to the outgoing
  list — no state change implied — because `by-tracking-code` is scoped
  to exactly this Node's outgoing orders. So unlike the destination
  store, **this list is rebuildable**, and the rebuild lives on the
  scanner where a code box means "read the label", not "ask the rider".
- **Arrival (destination).** Backend-blocked, and the screen now says so
  instead of showing a form. There is no list to pick from and no lookup
  that resolves one (`by-tracking-code` is origin-scoped, so it 404s
  here by design). **This is a real loss of a maybe-working path**: if
  the deployed backend is laxer than its docs, the old field might have
  worked. Reinstating arrivals properly needs the backend fix below —
  a destination-scoped lookup or an inbound-orders list — after which
  arrival becomes the same pick-a-parcel flow as pickup.

The rider screen says the same thing from its side ("These 6 digits are
all the operator needs"), so nobody starts reciting a tracking code at a
counter.

**Confirmed live against the deployed backend this session** (route
probes; the API distinguishes `Cannot GET …` from `UNAUTHENTICATED`):
**`GET /nodes/operator/inventory` does not exist — 404.** The Node
Dashboard renders its error state as the same "No parcels here" empty
state as a genuine empty list, so **that list is silently always empty
in production.** Not fixed here (out of scope) and the best next task
for whoever picks this up. Also confirmed absent: `my-deliveries`, every
node-scoped orders list guessed at, and any code-only confirm endpoint —
so neither localStorage store has an undocumented server-side
alternative.

`npx tsc --noEmit`, `npx eslint src` and a cleared-`.next` `yarn build`
all pass, and `/vendor/rider-handoff` + `/vendor/drop-off/[trackingCode]`
both return 200 from a dev server. **No browser click-through and no
NodeOperator session**, so the pick-list, the scan-to-recover path and
the prune-on-409 path are unexercised.

**Previous session (2026-08-15, latest — maps moved to Geoapify):** both
maps and address→coordinate geocoding now run on Geoapify (Leaflet for
rendering) instead of Google, behind a `NEXT_PUBLIC_MAPS_PROVIDER`
switch. Google needs a billing account even on its free tier; Geoapify's
doesn't, which unblocks the geocode buttons that keep Nodes from being
saved with placeholder coordinates — the failure mode where a Node looks
fine in the Admin list and is invisible to every Consumer.

**You need to paste a key.** `.env.local` has
`NEXT_PUBLIC_GEOAPIFY_API_KEY=` waiting — get a free one at
myprojects.geoapify.com (no card). Until then maps show the "Map
unavailable" fallback and the geocode buttons stay hidden; nothing
crashes. **Restrict the key by HTTP referrer in Geoapify's project
settings before going live** — it ships to the browser.

Only two files know the provider: `core/api/services/geocoding.service.ts`
and `components/maps/MapView.tsx`. Everything else uses the neutral
`MapMarker[]` / `GeocodeResult` contracts. Moving back to Google is real
work in both, not just the env flag — `geocodeWithGoogle()` is a
deliberate `NOT_IMPLEMENTED` throw because Google's Geocoding web
service sends no CORS headers, so it needs the Maps JS SDK or a backend
proxy route.

`GoogleMapView` was renamed `NodeMapView`; `@vis.gl/react-google-maps`
is gone, `leaflet` is in. Bundles shrank (select-nodes 192→178 kB
first-load JS).

**Unverified**: no real Geoapify key was available, so live tiles and a
real geocode response haven't been seen. Parsing is defensive but the
happy path is unexercised — that's the first thing to check once the key
is in.

**Previous session (2026-08-15, later — supersession cleanup):** deleted
the screens, hooks, routes, service methods and endpoint definitions the
two Handoffs passes superseded (28 files). The app now has exactly one
flow per custody moment.

This was not tidying. The earlier passes left the old screens in place
as "a separate decision," but several were still reachable, so the app
was running two parallel flows over two different backends — a vendor
could reach the old `orders.scanCollection` release screen from the Node
Dashboard while the new `collect` flow lived one nav tab away, showing a
different list of the same parcels. A rider's home screen CTA still
opened the old undocumented job board. **The 2026-08-14 note below
claiming "nav no longer points at any of them" was true of
`nav-config.ts` only and wrong about the app** — that's corrected now.

Gone: `JobOfferScreen`, `ActiveJobScreen`, `RiderScanScreen`,
`DeliveryCompleteScreen`, `ReleaseParcelScreen`, `ScanSuccessScreen`,
`ShelfLocationPicker` and their hooks/routes; `ENDPOINTS.riderOps.*`,
`orders.scanHandoff`, `orders.scanCollection`; the six superseded
`riderService` methods and six `vendorService` ones; the dead `ROUTES`
and `QUERY_KEYS` entries.

**Shelf assignment no longer has any UI.** `ScanSuccessScreen` was its
only home. Nothing was lost functionally — `listShelves()` returned `[]`
and `assignShelf()` always threw NOT_IMPLEMENTED, and the feature
appears nowhere in `docs/API.md` — but if it's wanted back it needs a
real endpoint first, not a rebuilt screen.

`src/core/mocks/*` and the commented-out mock service blocks were left
untouched, per `PROJECT_CONTEXT.md`'s standing instruction.

`npx tsc --noEmit`, `npx eslint src` and a cleared-`.next` `yarn build`
all pass.

**Previous session (2026-08-15 — Handoffs part two: collection):** the
three new destination-side endpoints (`intake`,
`collection-code/resend`, `collect`) are wired, closing the parcel
lifecycle at `completed`. New screens: `/vendor/awaiting-collection`
(what's on this Node's shelves, split into "needs check-in" and "ready
for collection") and `/vendor/awaiting-collection/[orderId]/collect`
(code entry, identity attestation, resend). New Vendor nav item
"Collect" — Scan / Handoff / Collect are now the three custody moments
at a counter.

Two things worth knowing before touching this code:

- **The two 6-digit codes run in opposite directions.** Rider codes are
  shown only to the rider and never emailed (5-min TTL); collection
  codes are emailed only to the receiver and never appear in any
  response the operator can see (1-hour TTL). `intake` is what mints and
  emails the collection code, so deferring it strands the receiver —
  which is why arrival confirmation now chains straight into it on the
  same screen.
- **`identityConfirmed` is not defaulted, deliberately.** It's an audit
  attestation that per `API.md` doesn't block completion when `false`
  (proxy pickup is normal). Pre-selecting "yes" would record something
  the operator never said. Don't "improve" it into a checkbox.

`yarn build` (from a cleared `.next`), `npx tsc --noEmit` and
`npx eslint src` all pass. **Still nothing exercised against a live
backend.**

**The one backend fix that matters most**: the destination operator
cannot resolve an order uuid. All three new endpoints are keyed on it
and scoped to the destination Node, and the only documented lookup is
origin-scoped — so this now blocks **four of the six operator
endpoints**. Mitigated by capturing the uuid from the `rider_arrival`
confirm response into `src/store/node-parcels.store.ts`, the one moment
it crosses the operator's session. That store is per-device; clearing
site data strands every parcel at the Node with no frontend recovery.
Both client stores (`rider-jobs`, `node-parcels`) should be **deleted**
when destination- and rider-scoped endpoints land, not kept as caches.

**A second, smaller gap**: `identityConfirmed` asks the operator to
confirm the receiver's name, but no destination-side endpoint returns
it — so there's nothing on screen to check against. The UI is worded
honestly about that rather than implying a verification it didn't do.

**Also superseded, not deleted**: `ReleaseParcelScreen` /
`use-release-parcel.ts` / `vendorService.releaseParcel` (the
undocumented `orders.scanCollection`) is the old version of exactly this
collection flow and is still routable at
`/vendor/parcels/[parcelId]/release`. Same follow-up as the `riderOps.*`
screens below.

**Previous session (2026-08-14 — Handoffs module integration):** the six
`/handoffs/*` endpoints added to `docs/API.md` the same day are wired
end to end, with new screens on both the Rider and NodeOperator sides.
This is the parcel custody chain — consumer drop-off → rider claims →
rider collects → rider delivers — and it is the documented replacement
for the undocumented `riderOps.*` / `orders.scanHandoff` routes the app
had been built against.

Two structural differences from the old model drove most of the work,
and anyone touching these screens needs them front of mind:

1. **Nobody scans a rider.** Custody transfers on a 6-digit code the
   rider requests and states to the Node operator, who types it in.
   There is no `qrNonce` in this contract.
2. **No write endpoint takes GPS.** Only `available-orders` takes
   coordinates, and only to sort that one response.

The Vendor QR scanner was repointed accordingly: scanning a consumer's
code no longer mutates anything, it routes to a new drop-off preview
screen that does an origin-scoped lookup and owns the separate confirm.
Better counter UX too — the operator eyeballs the parcel against the
description before accepting custody.

`yarn build`, `npx tsc --noEmit` and `npx eslint src` all pass.
**Nothing here has been exercised against a live backend** — every
response shape, status transition and error path is wired from
`docs/API.md` alone.

**Three things need the backend team**, all documented in full in
`docs/IMPLEMENTATION_LOG.md`'s 2026-08-14 entry and
`docs/API_INTEGRATION_STATUS.md`'s new Handoffs section:

1. **No rider-scoped "my deliveries" endpoint** — an accepted order
   disappears from every list the rider can query, while they still need
   its `id` to request handoff codes. Bridged with a localStorage store
   (`src/store/rider-jobs.store.ts`) that is per-device and can drift.
   Delete it when `GET /handoffs/my-deliveries` (or equivalent) lands.
2. **`confirm-handoff` is unusable at the destination Node** — it needs
   the order uuid, and the only lookup that resolves one is scoped to
   the *origin* Node. `rider_arrival` currently asks the operator to
   type a uuid read off the rider's phone. This is the most
   user-visible thing wrong with the module right now.
3. **No rider-facing payout figure exists anywhere in the API** — the
   job board shows route, size and distance but no money.

**Not done, deliberately**: `JobOfferScreen`, `ActiveJobScreen`,
`RiderScanScreen` and their three hooks still exist and still target the
undocumented `riderOps.*` routes. Nav no longer points at any of them
and the documented equivalents are live, so they're dead in practice —
but deleting them is a separate call, not incidental cleanup.

**Previous session (2026-08-13 — live debugging session, continued):**
same debugging thread as the entry below, continued live with the
reporting user. Two more things resolved: (1) confirmed the
`(user)/layout.tsx` role-gate fix (below) was in fact the fix for the
`/orders` 404 — it was a non-Consumer session hitting a Consumer-only
route, not a missing backend route; **`GET /orders` is live**, the
docs-vs-deployment gap flagged below was a misdiagnosis. (2) Checkout
was permanently stuck on "Calculating your delivery fee…" despite
`POST /payments/intents` succeeding — root cause was a `useRef`-based
"fire once" guard that could desync from the mutation's actual state;
fixed by deriving the guard from the mutation's own `isIdle` instead.
**This is the first piece of the whole 2026-08-12/13 integration to be
confirmed working end-to-end against the live backend by a real user**
— Checkout now correctly shows a real fee breakdown and enables
"Confirm & Pay". The Paystack redirect → payment-callback → Order flow
downstream of that is still unverified. Full detail in
`docs/IMPLEMENTATION_LOG.md`'s 2026-08-13 entry.

**Previous session (2026-08-12, later still — live debugging session):**
a real user testing the previous session's Checkout rebuild reported
"no stations available" on Select Nodes despite Admin having created
one `active` Node. Root cause was three stacked issues, all fixed:
(1) `SelectNodesScreen` silently swallowed fetch errors into the same
"No stations match" text as a genuine empty result — now shows an
`ErrorAlert`. (2) The real error was a stale, expired access token
hitting `401` with no retry — closed the standing "wire a 401→refresh
interceptor" gap in `core/api/client.ts`. (3) The Node's coordinates
were almost certainly wrong because both Node-creation forms required
typing raw lat/lng by hand — added a new shared
`AddressGeocodeButton` (`src/components/maps/`) that resolves them
from the address via Google's Geocoding API instead (needs a real
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to work; currently unset in this
repo's env files). **Separately confirmed and flagged, not
fixable from the frontend**: the live backend returns a raw "Cannot
GET /api/v1/orders" 404 — `GET /orders` isn't actually deployed on the
live backend yet despite being documented in `docs/API.md`. Full
detail in `docs/IMPLEMENTATION_LOG.md`'s matching entry.

**Previous session (2026-08-12 — full integration pass: Admin Approvals,
Admin Pricing, Consumer Checkout rebuild):** every endpoint
`docs/API_INTEGRATION_STATUS.md` had flagged ❌ as of that morning's
audit is now wired, plus a fix to the already-broken `GET
/nodes/nearby`. In order: (1) `GET/PATCH node-operators/pending`+
`/:id/approve` and the Rider equivalent, both landing in one new
tabbed screen, `ApprovalsScreen` (`/admin/approvals`) — this closes the
gap this file used to call "the single biggest functional gap in the
app": a self-registered NodeOperator/Rider who finished onboarding had
no path to ever reach `active`. (2) Admin Pricing (`POST`/`GET
/admin/pricing`), a new `PricingScreen` (`/admin/pricing`) with an
append-only "Add Rule" form over a rate-history table. (3) The big one:
Checkout rebuilt on the real `POST /payments/intents` (fee calc + Node
capacity reservation + Paystack `authorizationUrl`, one call) —
replacing the old `orders/calculate-fare`/`orders/book` flow that
targeted undocumented routes and, per this file's own long-standing
"Potential risks" note, never actually collected real payment. This
required a new `/orders/payment-callback` screen (polls `GET
/payments/intents/:id` after the Paystack redirect), a real
`destinationNodeId` in place of the old free-text destination address
(so `SelectNodesScreen` now picks two Nodes, not one Node + an
address), fixing `GET /nodes/nearby`'s wrong query param and response
parsing (a standing 🟡 from a prior audit, now blocking this work
directly), and rebuilding every screen that renders an order
(`DeliveryCard`, `TrackPackageScreen`, `OrderSuccessScreen`, both
dashboard sections) against the real `Order` shape (`GET
/orders`(/:id)) instead of the old, fictional `Delivery` type. Full
detail — every file touched and every design decision — is in
`docs/IMPLEMENTATION_LOG.md`'s matching 2026-08-12 entry;
`docs/API_INTEGRATION_STATUS.md` has the endpoint-by-endpoint
before/after. **Not verified against a live backend or a real Paystack
account** — see "Potential risks" below.

**Previous session (2026-08-07, most recent before the above — Rider
Verification gating pass):** a prior session (see the "Rider-scoped
session" note below)
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

- **The Consumer order model changed shape entirely on 2026-08-12.**
  The real `POST /payments/intents` requires a `destinationNodeId` (a
  real Node), not the free-text `destinationAddress` the app used to
  collect — delivery is Node-to-Node, same as the rest of the app's
  Node-network model, not Node-to-arbitrary-address. `core/types/payment.types.ts`
  (new file) has the real `PaymentIntent`/`Order` types;
  `core/types/delivery.types.ts`'s `Delivery`/`DeliveryQuote`/
  `CreateDeliveryDraft`/`CalculateFarePayload`/`BookOrderPayload` are
  now dead in real-mode code (kept, `@deprecated`-tagged, only because
  the commented-out mock delivery service still assumes their shape —
  don't build new real-mode code against them). If you see a screen
  importing `Delivery` from `core/types`, that's a regression — the
  real type is `Order`.
- **`Order.status` only has one confirmed value** (`"awaiting_drop_off"`,
  per `docs/API.md`) — the full lifecycle enum isn't documented.
  `OrderStatusBadge`/`getOrderProgress`/`isTerminalOrderStatus`
  (`modules/user/components/tracking/OrderStatusBadge.tsx`) render any
  status string via keyword heuristics rather than a fixed lookup
  table, so an unrecognized value degrades gracefully (neutral
  "in-progress" styling) instead of crashing. Replace the heuristic
  with a real table once the backend's full enum is confirmed — don't
  invent the rest of it speculatively.
- **`LocoomoNode` (old, fabricated `isOpenNow`/`capacity.occupied`+`.total`
  fields) and `PickupNode` (new, real `GET /nodes`/`GET /nodes/nearby`
  shape) are two different types on purpose** — `LocoomoNode` is still
  load-bearing for `vendor.service.ts`'s separate, still-unconfirmed
  `/nodes/operator/inventory` endpoint (`VendorNodeProfile extends
  LocoomoNode`), which this session didn't touch. The Consumer's node
  picker (`SelectNodesScreen`, `GoogleMapView`, `NodeListItem`,
  `nodesService`) uses `PickupNode` exclusively now. Don't merge the
  two types without also fixing (or confirming) the Vendor inventory
  endpoint's real shape first.
- **No in-app payment-method picker anymore.** Paystack's hosted
  checkout page (reached via `authorizationUrl`) presents card/bank
  transfer/USSD itself — `POST /payments/intents`'s request body has
  no field for it. `PaymentMethodSelector.tsx` was deleted as
  genuinely dead code, not just unused.
- **`/admin/approvals` and `/admin/pricing` have no home in the
  original 8-frame `admin_UI.png` design** — both endpoint groups were
  added to `docs/API.md` after that design reference was built. Placed
  as new sidebar items (`ShieldCheckIcon`/`CreditCardIcon`) after
  "Team", reusing `NodeNetworkScreen`'s tab pattern and
  `TeamManagementScreen`'s table pattern rather than inventing new
  visual language — see `nav-config.ts`'s comment on the placement
  reasoning.

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

**2026-08-12 (integration pass — Approvals, Pricing, Checkout rebuild):**
- [x] Read `docs/API.md`, `docs/ARCHITECTURE.md`, `docs/PROJECT_CONTEXT.md`,
      this file, and `docs/API_INTEGRATION_STATUS.md` before writing
      any code, per instructions.
- [x] Built `ApprovalsScreen` (`/admin/approvals`) and wired
      `GET/PATCH node-operators/pending`+`/:id/approve` and the Rider
      equivalent — see `docs/IMPLEMENTATION_LOG.md` for the full file
      list.
- [x] Built `PricingScreen` (`/admin/pricing`) and wired `POST`/`GET
      /admin/pricing`.
- [x] Fixed `GET /nodes/nearby` (`radiusKm`, paginated-envelope
      unwrapping, new `PickupNode` type) — a prerequisite for the
      Checkout rebuild below, since destination Node selection depends
      on it.
- [x] Rebuilt Checkout end-to-end on `POST /payments/intents` +
      `GET /payments/intents/:id`: new `/orders/payment-callback`
      screen, `destinationNodeId` replacing the old free-text
      destination address throughout `SelectNodesScreen`/
      `delivery-draft.store.ts`, and every order-rendering screen
      (`DeliveryCard`, `TrackPackageScreen`, `OrderSuccessScreen`, both
      dashboard sections) rebuilt against the real `Order` type.
- [x] Updated `docs/API_INTEGRATION_STATUS.md` — 26 ✅ / 3 🟡 / 0 ❌ /
      1 ⚪ (was 15 ✅ / 6 🟡 / 8 ❌ / 1 ⚪ that same morning, before the
      seven new endpoints from the earlier docs-only pass were folded
      in).
- [x] `npx tsc --noEmit`, `npx eslint src`, `npm run build` all pass
      (build succeeded on retry after two unrelated Google Fonts
      network timeouts in this sandbox). Dev-server smoke test:
      `/checkout`, `/delivery/select-nodes`, `/delivery/method`,
      `/orders/payment-callback`, `/track`, `/admin/approvals`,
      `/admin/pricing` all `200`.
- [ ] **Not performed**: any verification against a live backend or a
      real Paystack account — no live session or Paystack test account
      was available this session. In particular unconfirmed: the real
      `GET /nodes/nearby` response actually matching the new
      `PickupNode` mapping; a real capacity reservation → Paystack
      redirect → webhook → `GET /orders` round trip actually producing
      a `paymentIntentId` the callback screen can match; and whether
      `Order.status` ever takes a value beyond the one documented
      example. Do a real browser + Paystack test-mode pass (place a
      real order as a Consumer, approve a real NodeOperator/Rider as
      Admin, add a real pricing rule) before treating any of this as
      production-ready.

## Remaining work

**From previous sessions** (unchanged, not touched this session —
still open):
1. Resolve doc/code drift in root-level docs (`README.md`,
   `API_INTEGRATION.md` bearer-token claim, mock/real API claim).
2. Backend response-shape verification for `mapSessionResponse` /
   `mapFareResponse` / `mapInventoryResponse` /
   `mapNotificationToActivity`.
3. ~~Payment SDK integration (`deliveryService.pay()` is a no-op).~~
   **Done (2026-08-12)** — Checkout now creates a real
   `POST /payments/intents` and redirects to Paystack's hosted
   checkout; `deliveryService.pay()` no longer exists. **Not verified
   against a live backend/real Paystack account** — see this file's
   2026-08-12 entry under "Current progress" and "Potential risks"
   below.
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
   - ~~`elevateSuperAdmin` (Super Admin screen) is still wired to the
     unconfirmed `/corporate-ops/staff/elevate-superadmin`~~ **Removed
     2026-08-20** — `API.md` has no `super_admin` role concept at all,
     so there's no real equivalent to correct it to. The elevation form
     is deleted; `SuperAdminScreen` now shows an Admin-facing "isn't
     available yet" notice in its place. The overview stat cards (a
     separate, still-real gap) are untouched.
   - ~~`GET /node-operators/pending` + `PATCH /node-operators/:id/approve`
     and `GET /riders/pending` + `PATCH /riders/:id/approve` are real,
     confirmed routes with no screen in the current 8-frame design~~
     **Done (2026-08-12)** — `ApprovalsScreen` (`/admin/approvals`)
     covers both.
   - ~~`GET /nodes/nearby` (used by the User role's node-selection
     screen, not Admin) sends `radiusInMeters` but `API.md` requires
     `radiusKm`~~ **Done (2026-08-12)** — see the matching
     `IMPLEMENTATION_LOG.md` entry; also fixed the response-shape
     parsing (paginated envelope, not a bare array) in the same pass.
8. **No backend route exists at all** (confirmed against `API.md`,
   not just `endpoints.ts`) for: Dashboard summary stats, network-wide
   recent orders, network status/telemetry, admin-scoped order
   list/detail, Dispute Center (anything), Analytics (anything), and
   "elevate to super admin" (`API.md`'s role enum has no `super_admin`
   concept — only `consumer` / `node_operator` / `rider` / `admin`; the
   elevation form itself is deleted as of 2026-08-20, see above).
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
create/manage), `Team Management`'s invite, `Approvals`
(NodeOperator + Rider, new 2026-08-12), and `Pricing` (new 2026-08-12)
are now all fully on real routes. `Super Admin`'s elevation is the
last "wired but unconfirmed" one left — `API.md` has no `super_admin`
concept at all, so it may have no real equivalent.

## Potential risks

- ~~**`GET /orders` is documented in `docs/API.md` but not actually
  deployed on the live backend**~~ **Misdiagnosed, corrected
  2026-08-13.** The raw `"Cannot GET /api/v1/orders?limit=100"` 404 was
  actually the backend's response to a **non-Consumer session** hitting
  a Consumer-only route — `(user)/layout.tsx` had no `allowedRoles`
  gate (see below), so an Admin session testing the app could reach
  `/dashboard`/`/track` and fire this call. `GET /orders` is confirmed
  live and working once called with a real Consumer session. Worth
  noting for future debugging: this backend's 404 for
  "wrong role, right route" reads identically to "route doesn't
  exist" — don't assume the latter from message text alone.
- **`AddressGeocodeButton` (2026-08-12) needs a real
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** to actually resolve coordinates —
  this repo's `.env`/`.env.local` both leave it empty, so right now
  every Node-creation form still falls back to manual lat/lng entry
  (with a hint explaining why). This was very likely why the Node that
  triggered this session's bug report couldn't be found by any nearby
  search in the first place.
- **The Checkout → Paystack → payment-callback → Order round trip is
  now *partially* confirmed live (2026-08-13)**: `POST
  /payments/intents` has been exercised against the real backend by an
  actual Consumer session and correctly returns `feeBreakdown`,
  `amountKobo`, `authorizationUrl`, etc. — `CheckoutScreen` renders it
  correctly and enables "Confirm & Pay". **Still unverified**: the
  actual Paystack redirect, a real payment completing, the
  server-to-server webhook firing, and `/orders/payment-callback`
  successfully matching the resulting Order via `paymentIntentId` — no
  real payment was carried through to completion this session. Also
  now fixed (2026-08-13): the intent-creation effect used to guard
  against double-firing with a separate `useRef` that could desync
  from the mutation's real state, permanently stalling the "Calculating
  your delivery fee…" screen despite a successful backend response —
  now derives the guard from the mutation's own `isIdle` state instead
  (`use-checkout.ts`/`CheckoutScreen.tsx`).
- **`GET /nodes/nearby`'s fix (2026-08-12) hasn't been confirmed
  against a live response either** — the new `PickupNode` mapping
  (`city`/`state`/`capacity`/`operatingHours`, no `isOpenNow`) is a
  direct reading of `docs/API.md`'s documented Node shape, not a
  verified one. If the real response has different field names, the
  Select Nodes screen will render blank/`undefined` values rather than
  crashing (no `.map()`-on-non-array risk like before, since the
  paginated-envelope unwrapping is now correct either way).
- **`Order.status`'s real full enum is still unknown** — `OrderStatusBadge`/
  `getOrderProgress`/`isTerminalOrderStatus` fail safe (unrecognized
  status → neutral "in-progress" styling, treated as still-active in
  the dashboard split) but haven't been checked against any status
  value beyond the one `docs/API.md` documents
  (`"awaiting_drop_off"`). Confirm the full lifecycle with backend
  before trusting the active/past dashboard split or the status pill
  colors as accurate.
- **The `AuthGuard` role gap is now closed for `/admin/*`** — a
  non-admin session (or none) is redirected to `/login`, and
  `authService.loginAdmin` rejects+revokes a login attempt from a
  non-admin account. This has not been verified in a real browser
  against a live backend session yet (see #9 above) — treat it as
  implemented, not as verified.
- ~~Super Admin's elevation form still points at an endpoint unconfirmed
  against `API.md`~~ **Removed 2026-08-20** — see "Current objective"
  above; `SuperAdminScreen` no longer offers this action at all.
- **New 2026-08-20, not live-verified**: the Earnings/Revenue Split
  screens (`NodeEarningsScreen`, `MyEarningsScreen`'s rebuilt
  "Earnings" tab, `RevenueSplitScreen`, and `getEarningsSummary()`'s
  new real implementation) are built strictly from `docs/API.md`'s
  documented `earnings`/`admin/revenue-split` contract — none of it has
  been exercised against a live backend session with an actual
  `completed` order to produce a real entry. Same caveat as every other
  "not live-verified" item in this list.
- Carried over, still true: fragile session trust model (no
  `/auth/me`, no auto-refresh-on-401), reachable `NOT_IMPLEMENTED`
  throws in several Node Operator/Rider screens, no real payment
  collection.
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
| `src/core/api/services/admin.service.ts` | Read this first for any Admin data question — its header comment lists real vs. `NOT_IMPLEMENTED`. `elevateSuperAdmin` (unconfirmed route) removed 2026-08-20; `createRevenueSplitRatio`/`getRevenueSplitRatios`/`getRevenueSplitEntries`/`markRevenueSplitEntryPaid` (all real, confirmed) added the same day |
| `src/core/api/services/auth.service.ts` | `loginAdmin` — the one Admin auth method that exists, added this session |
| `src/components/layout/AuthGuard.tsx` | Now supports `allowedRoles`; `(admin)/layout.tsx` is the only current caller that passes it |
| `src/modules/admin/components/auth/AdminLoginScreen.tsx`, `src/app/admin-login/page.tsx` | New this session — the only way into `/admin/*` |
| `docs/API_INTEGRATION_STATUS.md` | Living checklist of every `API.md` endpoint's real integration status — check/update this whenever you touch any endpoint, Admin or otherwise |
| `src/core/types/admin.types.ts` | Node types (`AdminNodeRecord`/`AdminNodeStatus`/`NodeLifecycleStatus`) now match the real backend; everything else here is still provisional |
| `docs/design/admin_UI.png` | Source design — a single low-resolution 8-frame sprite sheet; doesn't include node-operator/rider approval queues (see "Remaining work" #7) |
| `src/modules/user/components/auth/AcceptInviteScreen.tsx`, `src/app/accept-invite/page.tsx` | New this session — the invitee-facing half of `POST /users/invite`; modeled on `ResetPasswordScreen` |
| `src/modules/user/components/auth/ResetPasswordScreen.tsx` | The template `AcceptInviteScreen` was built from — read this first if extending either one, they should stay in sync stylistically |
| `src/core/api/services/node.service.ts` | **Renamed from `vendor.service.ts` 2026-08-20** (`vendorService` → `nodeService`). Node Operator's data layer — `onboardNode`/`getMyNodeOperatorProfile`/`getMyNodeEarnings` (all real routes) alongside the handoffs custody-chain methods; header comment lists the real API gaps |
| `src/modules/node/hooks/use-node-setup.ts`, `src/modules/node/components/setup/NodeSetupScreen.tsx`, `src/app/(node)/node/setup/page.tsx` | **Renamed from `use-vendor-node-setup.ts`/`VendorNodeSetupScreen.tsx`/`/vendor/node-setup` 2026-08-20.** Node Operator's self-service Node onboarding + approval-status screen |
| `src/core/api/services/rider.service.ts` | Rider's data layer — `getVerificationUploadSignature`/`uploadVerificationDocument`/`submitVerification`/`getVerificationProfile` (new, real routes) live alongside the existing job-board/manifest/scan methods; header comment lists the real API gaps (availability, earnings, job history, profile) |
| `src/modules/rider/hooks/use-rider-verification.ts`, `src/modules/rider/components/verification/RiderVerificationScreen.tsx`, `src/app/(rider)/rider/verification/page.tsx` | Rider's self-service KYC verification + approval-status screen, modeled directly on `NodeSetupScreen`/`useNodeSetup` (same three-state shape: form / pending / approved; both renamed from `Vendor*` 2026-08-20) |
| `src/modules/rider/components/verification/VerificationReminderSheet.tsx` | New 2026-08-07 (gating pass) — dismissible bottom-sheet nudge shown on `RiderHomeScreen` for an unverified Rider, modeled on `ManualCodeEntrySheet`'s overlay pattern |
| `src/modules/rider/components/dashboard/RiderHomeScreen.tsx` | New 2026-08-07: reads `useRiderVerification()` and renders `VerificationReminderSheet` when not yet `active`; this is now the Rider's post-login landing page |
| `src/modules/rider/components/job-offer/JobOfferScreen.tsx` | New 2026-08-07: the one Rider screen that hard-blocks on verification status — reads `useRiderVerification()` before rendering job-board content |
| `src/core/types/payment.types.ts` | New 2026-08-12 — the real `PaymentIntent`/`Order` types (`POST /payments/intents`, `GET /orders`(/:id)); read this before trusting the old `Delivery`/`DeliveryQuote` in `delivery.types.ts`, which are now dead in real-mode code |
| `src/core/api/services/delivery.service.ts` | Rewritten 2026-08-12 — `createPaymentIntent`/`getPaymentIntent`/`list`/`getById` against the real routes; `calculateFare`/`create`/`pay` no longer exist |
| `src/core/api/services/nodes.service.ts` | Rewritten 2026-08-12 — `listNearby` now sends `radiusKm` and unwraps the paginated envelope into `PickupNode`; `getById` calls the real `GET /nodes/:id` directly |
| `src/modules/user/hooks/use-checkout.ts`, `use-payment-intent-status.ts` | New 2026-08-12 — Checkout's intent-creation hook and the payment-callback screen's polling hook |
| `src/modules/user/components/checkout/CheckoutScreen.tsx` | Rewritten 2026-08-12 — creates the payment intent once per visit, redirects to Paystack; no more in-app payment-method picker |
| `src/modules/user/components/tracking/PaymentCallbackScreen.tsx` | New 2026-08-12 — where Paystack redirects after checkout (`/orders/payment-callback`); polls the intent, then forwards to the real Order |
| `src/modules/user/components/tracking/OrderStatusBadge.tsx` | New 2026-08-12 — status pill + progress/terminal heuristics for the real, mostly-unconfirmed `Order.status` string; read this before adding any new Order-status-dependent UI |
| `src/modules/admin/components/approvals/ApprovalsScreen.tsx`, `src/modules/admin/hooks/use-admin-approvals.ts` | New 2026-08-12 — NodeOperator + Rider approval queues (`/admin/approvals`), no design reference existed for this screen |
| `src/modules/admin/components/pricing/PricingScreen.tsx`, `AddPricingRuleForm.tsx`, `src/modules/admin/hooks/use-admin-pricing.ts` | New 2026-08-12 — pricing rule history + append-only creation form (`/admin/pricing`), no design reference existed for this screen |
| `src/core/types/user.types.ts` | 2026-08-07: `UserRole` corrected to the real backend enum — read this before trusting any `role` comparison elsewhere in the codebase against the old `"user"`/`"vendor"` values |
| `src/modules/user/hooks/use-auth.ts` | 2026-08-07: the one hook driving Consumer + Rider + NodeOperator register/login; `loginMutation`'s role-redirect map is the thing to edit if a new role or a new post-login destination is ever needed |
| `src/modules/user/components/auth/CreateAccountScreen.tsx` | 2026-08-07: now shared by all three self-registerable roles via `?role=`; `ROLE_COPY` is the place to add per-role heading/subheading copy |
| `src/modules/user/components/auth/RoleSelectScreen.tsx`, `src/modules/user/constants/roles.ts` | 2026-08-07: `ROLE_OPTIONS`' `role` values now match the real backend enum and route into `/create-account?role=` |
| `src/core/types/handoff.types.ts` | The custody-chain contract in one file — lifecycle transitions, both 6-digit codes and which direction each travels. **Read its header before touching any handoff screen**; point 1 is the rule that the rider's code is the whole rider→operator payload |
| `src/store/node-outgoing.store.ts`, `src/store/node-parcels.store.ts`, `src/store/rider-jobs.store.ts` | **Deleted 2026-08-17.** Each held order uuids client-side because no server-side list existed yet; `GET /handoffs/my-node/orders`/`GET /handoffs/my-orders` landed in `docs/API.md` that day, exactly what each store's header asked for. If you find any of these three filenames again (a stale branch, a bad merge), that's a regression — the replacement is `use-my-node-orders.ts`/`use-my-orders.ts` below. |
| `src/modules/node/hooks/use-my-node-orders.ts` | New 2026-08-17, **renamed from `modules/vendor/` 2026-08-20**. `GET /handoffs/my-node/orders`, wrapped in a TanStack Query hook with four `myRole`+`status` filters. Source of truth for every screen that used to read `node-outgoing.store.ts`/`node-parcels.store.ts` |
| `src/modules/rider/hooks/use-my-orders.ts` | New 2026-08-17 — `GET /handoffs/my-orders`, same pattern, rider side. Supersedes `rider-jobs.store.ts` |
| `src/modules/node/hooks/use-confirm-handoff.ts` | **Renamed from `modules/vendor/` 2026-08-20.** Owns the whole operator-side handoff decision: direction, which order, prune-on-stale. Rewritten 2026-08-17 to source `pickableOrders` from `use-my-node-orders.ts` instead of `node-outgoing.store.ts`; its header is the canonical write-up of where the order uuid comes from in each direction now that both directions have one |
| `src/modules/vendor/components/handoff/RiderHandoffScreen.tsx`, `src/modules/vendor/components/collection/AwaitingCollectionScreen.tsx`, `src/modules/vendor/components/inventory/` | **Deleted 2026-08-17, before the 2026-08-20 Vendor→Node rename** — these paths never existed under `modules/node`, they're purely historical. Both screens' entire job — "the rider gives you six digits and nothing else," and the destination-side shelf list — became one tab each on `InventoryScreen` (also deleted the same day, see the next entry down for what replaced it: Home's tabs + `CollectParcelScreen`, now at `src/modules/node/components/collection/CollectParcelScreen.tsx`) |
| `src/modules/admin/components/rider-earnings/`, `src/modules/admin/hooks/use-rider-earnings.ts` | **Deleted 2026-08-20** — wired to `GET /admin/rider-earnings`, an endpoint that never appeared in `docs/API.md`. Replaced by `src/modules/admin/components/revenue-split/RevenueSplitScreen.tsx` (`/admin/revenue-split`) and, for the Rider/NodeOperator sides of the same underlying data, `MyEarningsScreen`/`NodeEarningsScreen` below |
| `src/core/types/earnings.types.ts` | New 2026-08-20 — shared revenue-split types (`MyRevenueSplitEntry`, `RevenueSplitRatio`, `AdminRevenueSplitEntry`, etc.) used by Rider, NodeOperator, and Admin's earnings screens alike |
| `src/modules/admin/hooks/use-admin-revenue-split.ts`, `src/modules/admin/components/revenue-split/` | New 2026-08-20 — Admin's split-ratio config form + payout-readiness entries table with a per-row "Mark Paid" action (`/admin/revenue-split`) |
| `src/modules/node/hooks/use-node-earnings.ts`, `src/modules/node/components/earnings/NodeEarningsScreen.tsx` | New 2026-08-20 — this Node's own revenue-split entries (`GET /earnings/my-node`), reached from Node Profile (`/node/earnings`) |
| `src/modules/rider/hooks/use-my-earnings.ts`, `src/modules/rider/components/history/MyEarningsScreen.tsx` | **Renamed from `use-job-history.ts`/`MyDeliveriesScreen.tsx` 2026-08-20** — the "Earnings" nav tab (`/rider/deliveries`) now lists real `GET /earnings/mine` entries instead of a job-history concept (declined/expired jobs with a payout) that has no backing endpoint at all |

## Context another AI engineer needs before continuing

- Everything from previous sessions' equivalent sections still applies
  (mock/real API switch is dead, no bearer-token attachment, Serwist
  not hand-rolled PWA, stale API base URL in `.env.example` — see
  `PROJECT_CONTEXT.md`'s discrepancy list).
- **Before wiring any more Admin endpoints, check the route against
  `docs/API.md` directly** — don't assume an entry already present in
  `core/api/endpoints.ts` is real just because it compiles and has a
  plausible-looking name. A full re-audit 2026-08-20 found and removed
  six more undocumented call sites beyond the original three
  (`corporateOps.elevateSuperAdmin` included — deleted, not just
  flagged, since `API.md`'s role enum has no `super_admin` concept to
  correct it to) — see `docs/API_INTEGRATION_STATUS.md`'s
  Inconsistencies section for the full list and what replaced each.
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
