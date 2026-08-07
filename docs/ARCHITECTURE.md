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
app/(vendor)/layout.tsx  → AuthGuard → AppShell(navItems=VENDOR_NAV_ITEMS) → page content
app/(rider)/layout.tsx   → AuthGuard → AppShell(navItems=RIDER_NAV_ITEMS)  → page content
```

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

### Vendor (Node Staff)
```
role-select → create-account (?role=vendor) → login
  → [if temp password] vendor-setup (first-login-reset)
  → vendor/home (Node Dashboard: capacity, parcel list)
  → vendor-scan (full-screen camera QR, outside shell)
  → vendor/scan-success/[parcelId] (shelf assignment — NOT persisted server-side yet)
  → vendor/parcels/[parcelId]/release (OTP-gated release to recipient)
  → vendor/parcels/[parcelId]/flag (issue reporting — throws NOT_IMPLEMENTED in real mode)
  → vendor/activity (Activity Log, sourced from GET /notifications/user/{userId})
  → vendor/profile
```

### Rider
```
rider-login (phone → password, styled as a 2-screen OTP-like flow)
  → rider/home (Online/Offline toggle; polls getCurrentJobOffer every 15s while online)
  → rider/jobs (Job Offer screen, countdown auto-declines)
  → accept → rider/jobs/[jobId] (active job, 3-step stepper: Pickup → Transit → Delivered)
  → rider-scan/[jobId] (full-screen camera QR, outside shell — pickup then dropoff scan)
  → rider/jobs/[jobId]/complete
  → rider/deliveries (job history — throws NOT_IMPLEMENTED in real mode, no backend route)
  → rider/profile (also NOT_IMPLEMENTED — no backend route)
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
- **TanStack Query** — anything fetched from `core/api/services`.
  Query keys are centralized in `QUERY_KEYS` (`core/config/constants.ts`)
  so cache invalidation/`setQueryData` calls can't typo a key. Global
  defaults: `staleTime: 30_000ms`, `retry: 1`, `refetchOnWindowFocus: false`.

## Routing architecture

App Router, three authenticated route groups
(`(user)`, `(vendor)`, `(rider)`), each with its own `layout.tsx`
providing `AuthGuard` + `AppShell` with role-specific nav items from
`components/layout/nav-config.ts`.

**Routes deliberately outside any group** (no nav chrome, by design,
per README):
- `/role-select`, `/create-account`, `/login`, `/forgot-password`, `/reset-password` — public onboarding, shared by User + Vendor signup via a `?role=` query param.
- `/vendor-setup` — pre-onboarding, no nav yet.
- `/vendor-scan`, `/rider-scan/[jobId]` — full-screen camera overlays, chrome would get in the way.
- `/rider-login` — Rider's own dedicated auth entry (structurally different from User/Vendor's shared signup).

Dynamic segments: `[id]` (delivery), `[parcelId]` (vendor), `[jobId]`
(rider) — all string route params, no typed route helpers beyond the
`ROUTES` object's param-taking functions.

## Shared component architecture

- **`components/ui/`** — role-agnostic design-system primitives
  (Button, Input, Card, PinPad, PinDots, OtpInputBoxes,
  StatusBadge, ProgressSteps, RouteRail, EmptyState, ErrorAlert,
  Notification).
- **`components/layout/`** — the responsive app shell
  (AppShell/Sidebar/BottomNav/TopBar) + AuthGuard.
- **`components/scanner/`** — `QrScannerView`, the real camera QR
  scanner shared by Vendor and Rider.
- **Promotion pattern**: two components were originally built inside
  `modules/vendor/` and later promoted to a shared location once a
  second role needed them. The original files were **not deleted** —
  they now just re-export from the new location, so no existing import
  path broke:
  - `modules/vendor/components/scanner/QrScannerView.tsx` → re-exports `components/scanner/QrScannerView`
  - `modules/vendor/components/release/OtpInputBoxes.tsx` → re-exports `components/ui/OtpInputBoxes`

  If you need either component, import from the new (shared) location
  directly — the old path still works but is a redirect, not the
  canonical source.

## API service architecture

Every domain (`auth`, `delivery`, `vendor`, `rider`, `nodes`) follows
the same file shape: a `mock<X>Service` object (currently fully
commented out in every file — see `PROJECT_CONTEXT.md` discrepancy #1)
and a `real<X>Service` object, with `export const xService = ...`
**hardcoded to the real implementation** regardless of
`env.useMockApi`. The mock/real switch described in `README.md` does
not currently function — treat every service as always hitting the
real backend.

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
