# ARCHITECTURE.md

> Complete frontend architecture reference. Pairs with
> `PROJECT_CONTEXT.md` (the "what and why") and
> `FRONTEND_API_INTEGRATION_MAP.md` (root — the canonical, detailed API
> layering doc; this file summarizes and extends it with the parts
> that doc doesn't cover: component hierarchy, routing, and full app
> flow).

## Layer diagram (source of truth: `FRONTEND_API_INTEGRATION_MAP.md`)

```
core/api/endpoints.ts        Route string catalogue
core/api/client.ts           httpClient — the ONE fetch() call site
core/api/errors.ts           ApiError + getErrorMessage / getFriendlyError
core/api/types.ts            ApiResponse envelope
core/api/services/*.service  One object per domain, one method per operation
core/types/*.types.ts        Domain + payload interfaces
core/config/env.ts           All process.env reads, nowhere else
core/config/constants.ts     ROUTES + QUERY_KEYS
store/*.store.ts             Zustand — pure client state only
modules/<role>/hooks/*       useMutation/useQuery wrapping a service call
modules/<role>/components/*  Screens that call the hooks
app/**/page.tsx              Route entry points, no logic
app/providers/*              QueryProvider + AuthProvider mounted at root
```

## Component hierarchy

```
RootLayout (app/layout.tsx)
├── QueryProvider                       (TanStack QueryClientProvider)
│   ├── AuthProvider                    (runs useSessionBootstrap once)
│   │   └── {children}                  (the actual route tree below)
│   └── Notification                    (global toast, reads notification.store)
└── ServiceWorkerRegistration           (registers public/sw.js via Serwist)
```

Below `{children}`, each route group supplies its own layout:

```
app/(user)/layout.tsx    → AuthGuard → AppShell(navItems=USER_NAV_ITEMS)   → page content
app/(node)/layout.tsx    → AuthGuard → AppShell(navItems=NODE_NAV_ITEMS    → page content
                                                     | NODE_STAFF_NAV_ITEMS)
app/(rider)/layout.tsx   → AuthGuard → AppShell(navItems=RIDER_NAV_ITEMS)  → page content
```

`(node)` is the one group admitting **two** roles (2026-09-03):
`node_operator` and the `node_staff` its owners invite. Both work the
same counter screens — every `/handoffs/*` route accepts either — so
the difference is which nav list the layout picks and which owner-only
sections each screen renders, not what the guard lets through.

`(node)` was `(vendor)` until 2026-08-20 — renamed throughout (route
group, `/vendor/*` URLs, `modules/vendor/`, `vendor.service.ts`,
`VENDOR_NAV_ITEMS`, every `Vendor*` identifier) to match the real
backend role, `node_operator`. See `docs/HANDOFF.md`'s 2026-08-20 entry
if you're looking for something under the old name.

`AppShell` renders `Sidebar` (desktop, ≥768px) and `BottomNav`
(mobile), both fed the same `navItems` prop so they can't drift.

Screens outside any route group render with no shell at all — see
"Routing architecture" below.

## Application / user flow

**Profile, for all four roles (2026-08-21):** no longer a `Sidebar`/
`BottomNav` tab — reached only via the Profile button on `RootTopBar`
(root screens) / `AdminTopBar` (Admin desktop). Not re-stated under
every role's flow below; see "Shared component architecture"'s
`RootTopBar` entry for the mechanics.

### User (Consumer)
```
role-select → create-account (?role=user) → login
  → dashboard
  → delivery/new (parcel + receiver details)
  → delivery/select-nodes (pick origin Node on live map, or via either
                 picker below it — origin and destination are each a
                 `NodePickerField` trigger opening a `NodePickerSheet`
                 pull-up list, 2026-08-21, replacing two always-rendered
                 inline lists that turned into endless scrolling once
                 the Node network grew. Each sheet's search box either
                 text-filters by name/city, or geocodes a typed address
                 via `geocodingService` and re-sorts by distance to it —
                 independently per picker, so a destination search near
                 the receiver's address doesn't affect the origin list.)
  → delivery/method (standard/express)
  → checkout (server-calculated fare via useFareQuote → pay; redirects to
                 Paystack, which redirects back to orders/payment-callback)
  → delivery/[id]/success → delivery/[id]/track  (or /track for the list view)
```

### Node Operator (and Node Staff)

Rewritten 2026-09-03 for **multi-Node**: one account now runs many
Nodes (`docs/API.md`, 2026-09-02), and a second role — `node_staff`,
invited by a Node's owner — shares this same route group. The
immediately preceding history: 2026-08-20 (Vendor→Node rename, paths
only, plus the Earnings screen), 2026-08-17 (later — Inventory retired
into Home + Activity), 2026-08-17 (earlier the same day, standalone
tabbed Inventory screen — no longer exists), 2026-08-15
(scan/shelf/release supersession cleanup).

**The one concept to hold onto:** the account↔Node relationship is a
*membership*, not a profile — each carries a `roleAtNode`
(`owner`/`staff`), and everything Node-scoped keys off `node.id`:
approval, payout accounts, visibility, and staff are all per-Node.
`useMyNodes` (`modules/node/hooks/use-my-nodes.ts`) is the single
source for that list plus which Node the counter screens are currently
scoped to — `useNodeProfile`, `useNodeSetup` and `useNodeDashboard` are
all wrappers over it. The active selection lives in
`store/active-node.store.ts` (Zustand, manual localStorage persist) and
is changed by `NodeSwitcher`.

**It is not one endpoint for both roles**, despite how uniform the
result looks to every consumer above. `GET /node-operators/me/nodes`
is owner-only — confirmed `403` for `node_staff` on the live backend
(2026-09-09) — so `useMyNodes` reconstructs a staff session's list from
`GET /handoffs/my-node/orders` (the only place a staff session's Node
id(s) appear anywhere in this API) plus `GET /nodes/:id` per discovered
id (open to any role). See that hook's own header for the full story,
including the one real gap this leaves: a brand-new staff invite whose
station has never processed an order has no id to discover at all.

```
role-select → create-account (?role=node_operator) → login
  (post-login redirect: fetches GET /node-operators/me/nodes before
   deciding — any Node "active" → node/home directly; all pending, or
   an empty array meaning onboarding was never completed, → node/setup.
   `node_staff` goes straight to node/home with no lookup — they're
   invited to an already-active Node by definition, so there's no
   approval state to branch on. The Nodes list still loads on that
   screen like it does for an owner; skipping it here is a redirect
   shortcut, not an access limit.)
  → node/setup ("My Stations" — the list of every Node this account
                 has a membership at, each with its own approval status
                 and payout state; staff see the ones they were invited
                 to, read-only, with no "Add Another Station". An
                 OWNER's empty list → the first-Node onboarding form,
                 unchanged; a STAFF empty list → "waiting on an invite",
                 never that form. Keeps the /node/setup path because
                 Profile, the dashboard's empty states, and the switcher
                 all link to it.)
  → node/nodes/new (add a 2nd/3rd station — POST /node-operators/nodes.
                 Same NodeOnboardingForm as first-time onboarding;
                 useNodeSetup picks the endpoint off the list being
                 empty, so neither form encodes that rule.)
  → node/nodes/[nodeId] (one station: approval status; whether it takes
                 public drop-offs — PATCH /node-operators/nodes/
                 :nodeId/visibility; its OWN payout account — PATCH
                 .../payout-account; and its team — GET/POST/DELETE
                 .../staff... All owner-only, and all answer 404 rather
                 than 403 for a staff membership, so none of those
                 sections render for one.)
  → node/dispatch (send a parcel FROM the active station — POST
                 /node-operators/nodes/:nodeId/dispatch. Open to staff
                 as well as owners: membership-gated, not owner-gated,
                 because it's counter work. One screen, not the
                 Consumer's four-step wizard — no origin to pick, no
                 method step. Destination picker is GET /nodes/nearby
                 centred on the ORIGIN STATION's coordinates, so it
                 needs no geolocation permission. Ends in the same
                 Paystack redirect Checkout uses.)
  → node/home (Node Dashboard — the operator's one summary screen,
                 scoped to the station named in the NodeSwitcher at the
                 top. Node identity/capacity: GET
                 /node-operators/me/nodes.
                 "occupied" is derived client-side (see
                 use-node-dashboard.ts) since neither real endpoint
                 returns one. Gates on Node onboarding/approval state
                 before showing the dashboard. Three tabs, all sliced
                 from one GET /handoffs/my-node/orders query
                 (use-my-node-orders.ts) — which now returns EVERY Node
                 you're a member of, so the dashboard filters to the
                 active one first via myNodeId(). Four tabs since
                 2026-09-04 ("Expected" was added with dispatch — see
                 the note below the flow). Every row is a pure summary,
                 tap-through only, nothing actionable inline:
                   Expected             — origin side, paid but not yet
                                          handed in at the counter
                   Awaiting Pickup      — origin side, awaiting a rider
                   Awaiting Arrival     — destination side, rider en route
                   Ready for Collection — arrived: needs check-in, or
                                          awaiting the receiver (two
                                          sub-sections, CollectionSummaryList)
                 )
  ── the three custody moments at a counter ──
  → node-scan (full-screen camera QR, outside shell)
      → node/drop-off/[trackingCode]  (preview, then POST .../drop-off;
                                         invalidates the my-node/orders query)
  → node/handoff/[orderId]  (Awaiting Pickup/Arrival row → details page:
                      full order info + the rider's 6-digit code entry,
                      POST .../confirm-handoff — same endpoint, same
                      useConfirmHandoff hook, both directions, `type`
                      inferred from the order's own myRole. Reused
                      verbatim from the old Inventory Pickup/Incoming
                      tabs, just per-order instead of inline-expand on
                      a list row.)
  → node/awaiting-collection/[orderId]/collect  (Ready for Collection
                      row → details page, branches on the order's own
                      sub-state: "needs check-in" shows the check-in/
                      "Send" action, POST .../intake, which is what
                      emails the receiver's code; "ready" shows the
                      receiver's code entry + identity attestation,
                      POST .../collect, plus the existing resend action,
                      POST .../collection-code/resend. Supersedes the
                      old node/rider-handoff + node/awaiting-collection
                      split from 2026-08-15 — both already deleted.)
  → node/activity (scoped to the active station too, same NodeSwitcher
                      — Activity Log, a single list, one card style
                      (`ActivityLogItem`), sourced from
                      GET /handoffs/my-node/orders, unfiltered, newest
                      first (2026-08-17, later still) — this *is* the
                      old Inventory "History" tab's data, mapped into
                      the Activity Log's card shape rather than kept as
                      a separate tab. GET /notifications/user/{userId}
                      (`listActivity()`/`useActivityLog`) is no longer
                      called from here — left in place, unused, not
                      deleted, pending a product decision on it.)
  → node/earnings (this account's Node revenue-split entries — GET
                      /earnings/my-node. New 2026-08-20, reached from a
                      Profile row at first, no nav-bar slot — all four
                      were already spoken for; promoted to its own
                      NODE_NAV_ITEMS tab 2026-08-21, same route. The one
                      Node screen with NO switcher, deliberately: the
                      endpoint's rows carry no node id, so a per-station
                      filter can't be applied and offering one would
                      lie. Owner-only — a node_staff session gets 403,
                      which is why the tab is absent from
                      NODE_STAFF_NAV_ITEMS.)
  → node/profile (account rows + the list of stations this account
                      works at; the payout row is a per-station
                      "N of M still need one" summary now that payout
                      accounts are per-Node.)
```

**"Public drop-offs" is not a deactivation** (2026-09-04). A station
whose owner has switched `isPubliclyVisible` off disappears from
customer listings and can't be targeted by a Consumer booking — and
nothing else changes: it keeps running handoffs, keeps earning, keeps
its staff, and can still both dispatch parcels and receive ones another
operator dispatched to it. Genuine deactivation (`status: inactive`) is
Admin-only. The UI never uses the word "deactivate" for this, and its
off-state copy always names what keeps working, because an operator who
believes their station is off will stop checking a counter that parcels
keep arriving at.

**Why Home has an "Expected" tab** (2026-09-04). A dispatched order
starts at `awaiting_drop_off`, exactly like a Consumer's, and none of
the three original tabs matched that status — so before this tab
existed an operator could pay for a dispatch and then have no route to
the drop-off confirmation that releases it to riders. Its rows link to
the existing `node/drop-off/[trackingCode]` preview, and it's excluded
from the capacity bar's "occupied" count: the parcel isn't on the shelf
until `POST .../drop-off` says it is.

**An invited staff member takes charge of the station they were
invited to** (2026-09-08). This is the rule to hold onto, because
getting it wrong is subtle and the app got it wrong once: someone
invited to "Yaba Node" opens the app and sees *Yaba Node* — its name,
its capacity, its parcels, its activity. They do not get a second,
empty station of their own, and they are never shown the "set up your
first station" form (creating a Node needs the `node_operator` role).

**How `useMyNodes` actually gets there matters, and got revised once
already** (2026-09-09). The first fix made it call `GET
/node-operators/me/nodes` for every session, reasoning from the
response shape: every item carries `roleAtNode`, whose only two values
are `owner` and `staff`, so a list only an owner could call would seem
to never need the second one. That reasoning was wrong for the actual
deployed backend — the route `403`s a `node_staff` session outright,
confirmed live. The reliable signal was elsewhere the whole time: this
API says "NodeOperator **or** NodeStaff" explicitly on every route that
truly admits both (`GET /handoffs/my-node/orders`'s own doc entry does,
and explains why); `/node-operators/me/nodes` never does. So the
mechanism is now: never call that route for staff, and instead
reconstruct their station(s) from `GET /handoffs/my-node/orders` (the
only place a staff session's Node id ever appears) plus `GET
/nodes/:id` per discovered id (open to any role) — see
`use-my-nodes.ts`'s header for the full mechanism, including the one
real gap it can't close (a station with zero order history has no id
to discover). The *outcome* two paragraphs up is what to hold onto and
not regress; the mechanism underneath it is what changed.

`roleAtNode` gates only what a member may **change**, never what they
can see or operate:

| Both owner and staff | Owner only |
|---|---|
| The station on Home, Activity, the switcher, My Stations, Profile | Its payout account |
| Every handoff step — scan, drop-off, confirm, intake, collect | Its public-drop-offs toggle |
| `node/dispatch` (membership-gated, not owner-gated) | Its team (roster, invite, remove) |
| | Adding a station, and Earnings |

The three owner-only station routes answer `404` — not `403` — for a
staff membership, so their UI is hidden rather than rendered and
failing. A staff member with no stations at all is waiting on an
invite, which is a different empty state from an owner's
("`hasNoStationsYet`" vs. "`notOnboarded`" in `useMyNodes`).

**The old `vendor/parcels/[parcelId]/flag` (issue reporting) route is
deleted, not just unreachable** (2026-08-20). It called an undocumented
endpoint (`/nodes/operator/inventory`, 404s on the deployed backend)
and had zero nav entries anywhere in the app even before this — its own
submit action threw `NOT_IMPLEMENTED` unconditionally regardless. See
`docs/API_INTEGRATION_STATUS.md`'s Inconsistencies item 2b.

**`node/inventory` is retired, not hidden** (2026-08-17, later the
same day it shipped). Its four tabs were fully redistributed rather
than deleted with it: Pickup/Incoming → Home's Awaiting Pickup/Awaiting
Arrival tabs (interaction moved from inline-expand to a dedicated
details page, `node/handoff/[orderId]`); Collection → Home's Ready
for Collection tab (`node/awaiting-collection/[orderId]/collect`,
extended to cover both its sub-states); History → Activity's Activity
Log, which now runs on the same data (briefly a separate "Order
History" tab there, collapsed back into one list the same day).
`NODE_NAV_ITEMS` no longer has an "Inventory" entry — Home is now the
single place an operator sees everything at their counter, which is
what Inventory duplicated rather than fed.

### Rider

Rewritten 2026-08-15, same reason.

```
role-select → create-account (?role=rider) → login   (no separate rider-login route)
  → rider/verification (self-service KYC; jobs are hard-blocked until `active`)
  → rider/home (Online/Offline toggle; when online + verified `active`, a
                 read-only `AvailableJobsPreview` — top 3 rows of the same
                 GET /handoffs/available-orders query below, capped at
                 page 1/limit 3, no Accept action. Every row and "View
                 all" link to rider/available-jobs, which stays the only
                 place a job is inspected in full or claimed. 2026-08-21.)
  → rider/available-jobs (GET /handoffs/available-orders, nearest-first)
  → accept → rider/active-deliveries ("Activity" in nav since 2026-08-21 —
              GET /handoffs/my-orders, unfiltered, behind 4 tabs: All /
              In Transit (rider_assigned+in_transit, default tab, the
              only actionable one) / Awaiting Collection
              (arrived_at_destination+ready_for_collection) / Completed)
      → rider/active-deliveries/[orderId]/handoff
        (tapped at the counter: requests the 6-digit code, 5-minute countdown;
         used at both ends of the trip — pickup, then arrival)
  → rider/deliveries ("Earnings" nav tab — GET /earnings/mine, the
                      rider's own revenue-split entries. Rewritten
                      2026-08-20 from a job-history concept
                      (declined/expired jobs with a payout) that has no
                      backing endpoint at all and stays NOT_IMPLEMENTED
                      under a different method, getJobHistory(), now
                      unused)
  → rider/profile (stat row + Home's EarningsStatCards both read the
                      same GET /earnings/mine data via
                      getEarningsSummary(), reduced client-side into
                      today/total stats — real as of 2026-08-20, was
                      NOT_IMPLEMENTED before)
```

## Data flow (per request)

```
Component (screen)
  → calls a module hook's mutate()/refetch (e.g. useAuth().login(...))
  → hook is a useMutation/useQuery wrapping a service method
  → service method (core/api/services/*.service.ts) calls httpClient.get/post/patch/delete
  → httpClient (core/api/client.ts):
      - prefixes env.apiBaseUrl
      - sets Content-Type: application/json
      - sets credentials: "include" (cookie auth)
      - JSON.stringify()'s the body
      - awaits fetch(), catches network failure → throws ApiError(NETWORK_ERROR)
      - parses response text as JSON → ApiResponse<T>
      - if success:false → throws ApiError(code, message, status, correlationId, details)
      - if success:true  → returns .data
  → service maps the raw data into a domain type if needed (e.g. mapSessionResponse,
    mapFareResponse, mapInventoryResponse) and may persist to localStorage (auth only)
  → hook's onSuccess writes into Zustand (session) and/or TanStack Query cache
    (queryClient.setQueryData), and/or shows a toast (useNotificationStore)
  → hook's onError shows a toast via getErrorMessage(error) and/or exposes
    the error object for the component to render inline via
    getFriendlyError(error) + <ErrorAlert />
  → component re-renders off the hook's returned state (isLoading/isPending, data, error)
```

## API request lifecycle (detail)

1. **Route resolution** — `ENDPOINTS.<module>.<operation>` gives the
   path string (functions for path params, e.g.
   `ENDPOINTS.orders.detail(id)`).
2. **Transport** — `httpClient` is the only place `fetch()` is called
   anywhere in the app. `skipAuth` exists on `RequestOptions` but is
   presently a no-op (auth is cookie-based, nothing reads it to skip
   attaching a header — there's no header being attached in the first
   place). Passing it is harmless but does not currently change
   behavior.
3. **Envelope** — the backend always responds with
   `{success, data, meta}` or `{success:false, error:{code, message,
   correlationId, details?}}` (`core/api/types.ts`). `httpClient`
   unwraps this once; nothing downstream ever sees the envelope. The
   one exception is a `204 No Content` — `DELETE
   /node-operators/nodes/:nodeId/staff/:userId` is the only such route
   today — which has no envelope because it has nothing to return;
   `rawRequest` returns `undefined` for an empty *successful* body
   (2026-09-04). An empty or unparseable body on a *failed* response
   still throws, as before.
4. **Error normalization** — every failure becomes an `ApiError`
   (`core/api/errors.ts`) with `status`, `code`, `correlationId`,
   optional `details: ValidationDetail[]`. `getFriendlyError(error)`
   maps `code` → `{title, message, action, type}` for UI display;
   unmapped codes fall through to a generic "we hit a small delay"
   message. Extend this switch statement when the backend introduces
   a new error code that deserves specific copy.
5. **Response mapping** — a handful of services apply an extra mapping
   function because the real backend's exact response shape wasn't
   confirmed at integration time (`mapSessionResponse`,
   `mapFareResponse`, `mapInventoryResponse`,
   `mapNotificationToActivity`). These are the first place to look if
   a screen renders `undefined`/wrong data — see `API_INTEGRATION.md`'s
   table for the full list and what to verify.

## Authentication flow

```
App load
  → AuthProvider mounts → useSessionBootstrap()
      → authService.getSession() reads localStorage["locoomo_session"]
        (no network call — there is no /auth/me endpoint)
      → useAuthStore.setSession(session ?? null); setInitializing(false)

Protected route render
  → AuthGuard reads { session, isInitializing } from useAuthStore
      → isInitializing: render spinner, do nothing yet
      → !session: router.replace(ROUTES.login)
      → session present: render children

Login (role-specific, e.g. useAuth().login for Consumer)
  → authService.loginConsumer(payload) → httpClient.post(..., skipAuth:true, credentials:"include")
  → role === "admin"? (2026-08-22) POST /auth/logout to revoke the
    cookies just issued, then throw ApiError(INVALID_CREDENTIALS) — the
    same generic message every other wrong-login reason produces, since
    Admin has its own separate /admin-login → loginAdmin entry point
    and POST /auth/login is role-agnostic (an Admin's real credentials
    would otherwise succeed here too, then get silently bounced back to
    /login by (user)/layout.tsx's AuthGuard, allowedRoles:["consumer"])
  → mapSessionResponse(raw) builds AuthSession = { user }
  → persistSession(session) → localStorage["locoomo_session"]
  → hook's onSuccess: useAuthStore.setSession(session), queryClient.setQueryData(QUERY_KEYS.session, session),
    showNotification(success toast), router.push(role's post-auth route)

Logout
  → authService.logout() → POST /auth/logout (clears the server-side cookie)
  → clearPersistedSession() (removes localStorage copy)
  → onSuccess: setSession(null), queryClient.setQueryData(QUERY_KEYS.session, null),
    router.push(ROUTES.roleSelect)
```

There is **no automatic 401 → refresh-and-retry interceptor** in
`httpClient` — `authService.refreshSession()` exists
(`POST /auth/refresh`) but nothing currently calls it automatically on
a 401. A caller has to invoke it explicitly. This is a gap worth
knowing about if users start getting logged out mid-session on token
expiry.

## State management architecture

Two systems, deliberately scoped to different kinds of state:

- **Zustand** (`src/store/`) — client-only state that isn't "data from
  the server." No `persist` middleware is used on any store; the auth
  store's durability comes entirely from `authService` manually
  reading/writing `localStorage` (see above), not from Zustand itself.
  - `auth.store.ts` — `{ session, isInitializing }` + `useCurrentUser()` selector helper.
  - `active-node.store.ts` (2026-09-03) — which of a multi-Node
    operator's Nodes the counter screens are scoped to. Persisted to
    `localStorage` manually, same as the session; the read happens in a
    `hydrate()` action `useMyNodes` calls, **not** the store
    initializer, since an initializer reading `localStorage` would
    disagree with SSR's `null` and trip a hydration mismatch. A stale
    or foreign id is harmless — `useMyNodes` resolves it against the
    live list and falls back to the first active Node.
  - `delivery-draft.store.ts` — in-progress New Delivery form fields, `reset()` on submit.
  - `notification.store.ts` — single active toast, auto-clears via `setTimeout` after 4s
    (a second toast fired within 4s replaces the first rather than queuing).
  - **The three localStorage-backed stores that used to paper over
    missing order-list endpoints — `rider-jobs.store.ts`,
    `node-outgoing.store.ts`, `node-parcels.store.ts` — are deleted
    (2026-08-17).** `docs/API.md` gained `GET /handoffs/my-orders`
    (rider) and `GET /handoffs/my-node/orders` (NodeOperator, either
    side via `myRole`) that same day, exactly the endpoints each
    store's header asked for and said to delete-not-cache once they
    shipped. See `modules/rider/hooks/use-my-orders.ts` and
    `modules/node/hooks/use-my-node-orders.ts` — plain TanStack Query
    hooks, no Zustand involved, since this is now ordinary "data from
    the server."
- **TanStack Query** — anything fetched from `core/api/services`.
  Query keys are centralized in `QUERY_KEYS` (`core/config/constants.ts`)
  so cache invalidation/`setQueryData` calls can't typo a key. Global
  defaults: `staleTime: 30_000ms`, `retry: 1`, `refetchOnWindowFocus: false`.

## Routing architecture

App Router, three authenticated route groups
(`(user)`, `(node)`, `(rider)`), each with its own `layout.tsx`
providing `AuthGuard` + `AppShell` with role-specific nav items from
`components/layout/nav-config.ts`.

**Routes deliberately outside any group** (no nav chrome, by design,
per README):
- `/role-select`, `/create-account`, `/login`, `/forgot-password`, `/reset-password`, `/accept-invite` — public onboarding, shared by all three self-registerable roles via a `?role=` query param.
- `/admin-login` — Admin's separate entry point.
- `/orders/payment-callback` — where Paystack redirects after **any** checkout. Moved out of `(user)` 2026-09-04: that group is gated `allowedRoles={["consumer"]}`, and a Node dispatch now comes back through the same backend-controlled URL, so an operator was being bounced to `/login` before the screen could render. Keeps an `AuthGuard` with no role list (a session is still required; the screen branches on role itself) and no `AppShell`. The URL didn't change — `(user)` is a route group, not a path segment.
- `/node-scan` — full-screen camera overlay, chrome would get in the way. (`/rider-scan/[jobId]` was deleted 2026-08-15: nobody scans a rider in the real contract.)

Dynamic segments: `[id]` (delivery), `[orderId]` (handoffs, both
roles), `[trackingCode]` (drop-off preview), `[nodeId]` (a station's
detail page, 2026-09-03), `[jobId]` (rider) — all
string route params, no typed route helpers beyond the `ROUTES`
object's param-taking functions. (`[parcelId]` was the dead Flag Issue
route's segment — deleted along with it 2026-08-20, see the Node
Operator section above.)

## Shared component architecture

- **`components/ui/`** — role-agnostic design-system primitives
  (Button, Input, Card, PinPad, PinDots, OtpInputBoxes,
  StatusBadge, ProgressSteps, RouteRail, EmptyState, ErrorAlert,
  Notification).
- **`components/layout/`** — the responsive app shell
  (AppShell/Sidebar/BottomNav/TopBar) + AuthGuard. **`RootTopBar`**
  (2026-08-21) is the bar for every role's root/tab screens specifically
  — logo left (mobile only; `Sidebar` already carries it on desktop),
  a Profile button right, linking to that role's Profile screen. Added
  when "Profile" was pulled off every role's `Sidebar`/`BottomNav`
  nav-items list (`nav-config.ts`) and given exactly one entry point
  instead: this button. Sub-screens (detail pages, forms, Profile
  itself) are untouched — they keep the original `TopBar`
  (title + back button). Admin's desktop bar is `AdminTopBar` (already
  existed, unrelated component) — its avatar is now the same Profile
  link; Admin's root screens render `RootTopBar` with
  `hideOnDesktop` so the two bars never stack. `BottomNav` also gained
  an overflow mode this same session: past 4 tabs, the remainder (plus
  any `moreItems` passed in, e.g. Admin's pinned Settings) collapse into
  a "More" pull-up sheet — only Admin's nine-item `ADMIN_NAV_ITEMS`
  triggers this today.
- **`components/scanner/`** — `QrScannerView`, the real camera QR
  scanner shared by the Node Operator and Rider.
- **Promotion pattern**: `QrScannerView` was originally built inside
  `modules/vendor/` (now `modules/node/`) and later promoted to a
  shared location once a second role needed it. The original file was
  **not deleted** — it still just re-exports from the new location, so
  no existing import path broke:
  - `modules/node/components/scanner/QrScannerView.tsx` → re-exports `components/scanner/QrScannerView`

  If you need it, import from the new (shared) location directly — the
  old path still works but is a redirect, not the canonical source.
  (`modules/vendor/components/release/OtpInputBoxes.tsx`, the other
  half of this pattern, is gone — the whole `release` flow it belonged
  to was deleted 2026-08-15, superseded by the documented `handoffs`
  collect endpoint.) `HandoffStatusPill`/`getHandoffStatusLabel`
  followed the identical path 2026-08-21, once the Rider module's
  Activity screen needed the same status pill Node's screens already
  had: `modules/node/components/handoff/HandoffStatusPill.tsx` →
  re-exports `components/ui/HandoffStatusPill`.

## API service architecture

Every domain (`auth`, `delivery`, `node`, `rider`, `nodes`, `admin`)
exports a single `real<X>Service` object as `export const xService =
...`, **hardcoded to the real implementation** regardless of
`env.useMockApi`. The mock/real switch described in `README.md` does
not currently function — treat every service as always hitting the
real backend. Each service file used to also carry a fully
commented-out `mock<X>Service` object mirroring the real one — dead
scaffolding from before this project's AI-assisted work began (see
`PROJECT_CONTEXT.md` discrepancy #1). **Deleted from every file as of
2026-08-20** (along with the five now-orphaned `core/mocks/*.ts` fixture
files those blocks were the only remaining reference to) — if you find
a `mock<X>Service` block again, that's a regression, not something to
preserve.

Each service method:
1. Builds/validates a request payload (some client-side validation,
   e.g. `checkIn()` throwing `VALIDATION_ERROR` if `position`/`qrNonce`
   are missing).
2. Calls `httpClient.get/post/patch/delete`.
3. Optionally maps the raw response into a domain type.
4. Returns the domain type or throws `ApiError`.

Some methods are permanently unavailable in real mode because no
backend route exists yet — they throw `ApiError({code:"NOT_IMPLEMENTED"})`
immediately, on purpose (see `API_INTEGRATION.md` for the full list).

## Important design decisions

See `DECISIONS.md` for the full write-up with reasoning and
tradeoffs. Index:
- Zustand + TanStack Query split (client vs. server state)
- Cookie-based auth over bearer tokens
- Service-layer indirection (component never calls `fetch`/`httpClient` directly)
- Route groups per role vs. one shared layout with conditional nav
- Dedicated Zustand store for the multi-step delivery draft
- Centralized envelope unwrapping + error-code-to-copy mapping
- Shared camera scanner component (promotion pattern)
- Optional/degrading Google Maps integration
- Serwist for the PWA service worker

## Existing patterns / conventions

- **Naming**: hooks `use-kebab-case.ts` exporting `useCamelCase()`;
  components `PascalCase.tsx`; services `<domain>.service.ts`; types
  `<domain>.types.ts`; schemas `<domain>.schema.ts`.
- **Barrel exports**: most module/component folders have an `index.ts`
  re-exporting their public members (`components/ui/index.ts`,
  `core/types/index.ts`, `core/api/services/index.ts`, etc.) — import
  from the barrel, not the individual file, where one exists.
- **Single source of truth for strings**: never hardcode a route
  (`ROUTES`), a URL path (`ENDPOINTS`), a query key (`QUERY_KEYS`), or
  read `process.env` (`env`) outside their designated files — this
  rule is stated explicitly in `FRONTEND_API_INTEGRATION_MAP.md` and
  followed consistently in the code reviewed.
- **`cn()`** (`lib/utils.ts`) — every component that accepts a
  `className` prop merges it via `cn(...)` (clsx + tailwind-merge).
  - Tailwind v4, CSS-first theme: design tokens are CSS custom
  properties in `src/app/globals.css` (`--brand-blue`, `--bg-canvas`,
  `--text-primary`, etc.), consumed via `@theme inline` — there is no
  `tailwind.config.ts`.
- **Form handling is inconsistent**: the User module's auth/delivery
  schemas use React Hook Form + Zod
  (`modules/user/schemas/auth.schema.ts`), but some screens (e.g.
  `ForgotPasswordScreen.tsx`) use plain `useState` + manual
  `disabled={!email}` checks instead. Don't assume every form in the
  app goes through RHF — check the specific screen.
- **Optimistic/graceful-degradation UI**: Google Maps (missing API
  key → fallback card) and the QR scanner (camera denied/unavailable →
  manual code entry sheet) both follow the same "never hard-crash on a
  missing capability" pattern.
