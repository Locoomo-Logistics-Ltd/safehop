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
app/(node)/layout.tsx    → AuthGuard → AppShell(navItems=NODE_NAV_ITEMS)   → page content
app/(rider)/layout.tsx   → AuthGuard → AppShell(navItems=RIDER_NAV_ITEMS)  → page content
```

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

### User (Consumer)
```
role-select → create-account (?role=user) → login
  → dashboard
  → delivery/new (parcel + receiver details)
  → delivery/select-nodes (pick origin Node on live map + type destination address)
  → delivery/method (standard/express)
  → checkout (server-calculated fare via useFareQuote → pay)
  → delivery/[id]/success → delivery/[id]/track  (or /track for the list view)
```

### Node Operator

Rewritten 2026-08-20 for the Vendor→Node rename (paths only — every
`/vendor/*` URL below became `/node/*`, `modules/vendor/` became
`modules/node/`) and the new Earnings screen. The immediately preceding
history: 2026-08-17 (later — Inventory retired into Home + Activity),
2026-08-17 (earlier the same day, standalone tabbed Inventory screen —
no longer exists), 2026-08-15 (scan/shelf/release supersession
cleanup).

```
role-select → create-account (?role=node_operator) → login
  → node/setup (self-service Node onboarding + approval status)
  → node/home (Node Dashboard — the operator's one summary screen.
                 Node identity/capacity: GET /node-operators/me.
                 "occupied" is derived client-side (see
                 use-node-dashboard.ts) since neither real endpoint
                 returns one. Gates on Node onboarding/approval state
                 before showing the dashboard. Three tabs, all sliced
                 from one GET /handoffs/my-node/orders query
                 (use-my-node-orders.ts) — every row is a pure summary,
                 tap-through only, nothing actionable inline:
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
  → node/activity (Activity Log — a single list, one card style
                      (`ActivityLogItem`), sourced from
                      GET /handoffs/my-node/orders, unfiltered, newest
                      first (2026-08-17, later still) — this *is* the
                      old Inventory "History" tab's data, mapped into
                      the Activity Log's card shape rather than kept as
                      a separate tab. GET /notifications/user/{userId}
                      (`listActivity()`/`useActivityLog`) is no longer
                      called from here — left in place, unused, not
                      deleted, pending a product decision on it.)
  → node/profile
      → node/earnings (this Node's revenue-split entries — GET
                      /earnings/my-node, only present for orders where
                      this Node was the origin. New 2026-08-20, reached
                      from a Profile row, no nav-bar slot — all four
                      are already spoken for.)
```

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
  → rider/home (Online/Offline toggle)
  → rider/available-jobs (GET /handoffs/available-orders, nearest-first)
  → accept → rider/active-deliveries (GET /handoffs/my-orders, filtered to active legs)
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
   unwraps this once; nothing downstream ever sees the envelope.
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
- `/node-scan` — full-screen camera overlay, chrome would get in the way. (`/rider-scan/[jobId]` was deleted 2026-08-15: nobody scans a rider in the real contract.)

Dynamic segments: `[id]` (delivery), `[orderId]` (handoffs, both
roles), `[trackingCode]` (drop-off preview), `[jobId]` (rider) — all
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
  (AppShell/Sidebar/BottomNav/TopBar) + AuthGuard.
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
  collect endpoint.)

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
