# PROJECT_CONTEXT.md

> Persistent memory for future Claude Code sessions. Read this first.
> Last built from a full repo analysis on 2026-08-06. No application
> code was modified to produce this document.

## Project purpose

**Locoomo** is a parcel logistics PWA for the Nigerian market (NGN
currency, Lagos-centered map defaults). It connects three roles around
a network of physical pickup/drop-off points called **Nodes**:

- **User (Consumer)** — sends a parcel: pick an origin Node, enter a
  destination address, get a server-calculated fare, pay, track.
- **Node Operator (Vendor, renamed 2026-08-20)** — runs a physical Node: scans
  parcels in via camera QR, assigns shelf space, releases parcels to
  recipients via OTP, flags issues, views an activity log.
- **Rider** — delivers between Nodes and/or to recipients: goes
  online, receives job offers, accepts, scans pickup/dropoff QR codes,
  navigates via the device's native maps app, views job history.

An **Admin** module is planned but not yet built (mentioned in
README.md, no code exists for it yet).

## Main user problems solved

- Affordable, trackable parcel delivery without needing a personal
  vehicle or courier account — drop at a nearby Node, someone else
  relays it.
- Real-time job dispatch for riders (job board, accept/decline,
  live location telemetry).
- In-person operational tooling for Node staff (inventory, check-in,
  shelf management, OTP-gated release to the correct recipient).

## Major features (by role)

See `README.md` (root) for the full, currently-accurate feature/folder
breakdown — it is well-maintained and this document doesn't duplicate
it wholesale. Highlights:

- Real camera-based QR scanning (`@yudiel/react-qr-scanner`) for both
  Node Operator check-in and Rider pickup/dropoff — no mock, real camera API.
- Live Google Maps on the User "Select Nodes" screen
  (`@vis.gl/react-google-maps`), with graceful "Map unavailable"
  fallback when no API key is configured.
- Installable PWA (manifest + service worker via **Serwist** — see
  "Things future engineers must know" below for a correction to the
  README's description of this).
- Responsive shell: `BottomNav` on mobile, `Sidebar` on desktop
  (≥768px), same hooks/services underneath both.

## Tech stack

- **Next.js 15.5** (App Router) + **React 19.2** + **TypeScript 5**
- **Tailwind CSS v4** — CSS-based theme via `@theme inline` in
  `src/app/globals.css`, no `tailwind.config.ts` file
- **Zustand 5** — small global client state (session, delivery draft,
  toast notifications)
- **TanStack Query 5** — server-state cache, loading/error flags
- **React Hook Form + Zod** — form state and validation (partially
  adopted — see ARCHITECTURE.md)
- **next-auth 5 (beta)** — installed, scaffolded for Google OAuth, not
  wired up yet (`loginWithGoogle` throws `NOT_IMPLEMENTED`)
- **@serwist/next** — PWA service worker tooling (wraps `next.config.ts`)
- **@vis.gl/react-google-maps**, **@yudiel/react-qr-scanner** — maps
  and camera QR scanning
- **date-fns**, **idb**, **clsx** + **tailwind-merge** (via `cn()`)

## Frontend architecture (one-paragraph version)

Routing lives in `src/app/` and contains **no business logic** — every
route's `page.tsx` renders a "screen" component from `src/modules/<role>/components/`.
Screens call **hooks** in `src/modules/<role>/hooks/`, which wrap
**service** objects in `src/core/api/services/*.service.ts` inside
TanStack Query's `useMutation`/`useQuery`. Services are the only code
that talks to `src/core/api/client.ts`, the single `fetch()` call site
in the app. Cross-role UI primitives live in `src/components/`. Global
client state (not server data) lives in `src/store/` (Zustand). See
`ARCHITECTURE.md` for the full data-flow diagram.

## Folder explanations

| Folder | Purpose |
|---|---|
| `src/app/` | Routes only. Route groups `(user)/`, `(node)/`, `(rider)/` each have a `layout.tsx` that wraps children in `AuthGuard` + `AppShell` with role-specific nav items. Several routes sit **outside** the groups deliberately (see ARCHITECTURE.md § Routing). |
| `src/modules/<role>/` | Feature/business logic per role: `components/` (screens, grouped by sub-feature), `hooks/` (TanStack Query wrappers), `schemas/` (Zod, User module only currently), `constants/` (User module only). |
| `src/core/api/` | `client.ts` (fetch wrapper), `endpoints.ts` (route string catalogue), `errors.ts` (`ApiError` + friendly-message mapping), `services/` (one file per domain: auth, delivery, node, rider, nodes, admin). |
| `src/core/mocks/` | Mock data fixtures. **Mostly dead code as of this analysis** — see the discrepancy noted below. |
| `src/core/types/` | Canonical domain + payload types, barrel-exported via `index.ts`. |
| `src/core/config/` | `env.ts` (all `process.env` reads — the only place that should touch it) + `constants.ts` (`ROUTES`, `QUERY_KEYS`, a couple of business constants). |
| `src/components/ui/` | Design-system primitives (Button, Input, Card, PinPad, OtpInputBoxes, StatusBadge, etc.), shared by every role. |
| `src/components/layout/` | `AppShell`, `Sidebar`, `BottomNav`, `TopBar`, `AuthGuard`, `nav-config.ts` (per-role nav item lists). |
| `src/components/scanner/` | `QrScannerView` — shared real camera QR scanner (Node Operator check-in + Rider pickup scan). |
| `src/store/` | Zustand stores: `auth.store.ts`, `delivery-draft.store.ts`, `notification.store.ts`. |
| `src/lib/` | Pure utilities: `cn()` (Tailwind class merge), `format.ts`, `geo.ts` (haversine distance). |

## Important components

- **`AppShell`** (`components/layout/AppShell.tsx`) — top-level
  responsive frame for every authenticated screen; takes `navItems` so
  each role supplies its own set.
- **`AuthGuard`** (`components/layout/AuthGuard.tsx`) — renders a
  spinner while the session is initializing, redirects to `/login` if
  there's no session, otherwise renders children. Wraps every
  `(user|node|rider)/layout.tsx`.
- **`QrScannerView`** (`components/scanner/QrScannerView.tsx`) — real
  camera QR scanning shared by the Node Operator and Rider; the two modules'
  original copies now just re-export it (see DECISIONS.md).
- **`GoogleMapView`** (`modules/user/components/delivery/GoogleMapView.tsx`) —
  live map with graceful no-API-key fallback.
- **`ErrorAlert`** / **`Notification`** (`components/ui/`) — the two
  UI surfaces for `getFriendlyError()` output and toast messages.

## Important pages/routes

Full route table is in `README.md`'s folder-structure section and
`core/config/constants.ts`'s `ROUTES` object — treat `ROUTES` as the
single source of truth for path strings; never hardcode a route string
in a component.

## API integration overview

- Every request goes through `httpClient` (`core/api/client.ts`), a
  thin `fetch` wrapper: JSON body, `credentials: "include"` (cookies),
  unwraps the backend's `ApiResponse<T>` envelope
  (`{success, data, meta}` / `{success:false, error}`), throws a typed
  `ApiError` on failure.
- Base URL: `env.apiBaseUrl`, currently defaulting to
  `https://locoomo-api.up.railway.app/api/v1` if
  `NEXT_PUBLIC_API_BASE_URL` isn't set (note: this differs from the
  `dev.locoomo.com` URL referenced throughout `API_INTEGRATION.md` and
  `.env.example` — see discrepancies below).
- All route strings live in `core/api/endpoints.ts`, grouped by
  backend module (`auth`, `identity`, `nodes`, `orders`, `maps`,
  `riderOps`, `notifications`, `payments`, plus admin/corporate-ops
  groups the app doesn't call).
- Full endpoint-by-endpoint status (what's confirmed working, what
  response shapes are guessed, what has no backend route yet) is
  maintained in **`API_INTEGRATION.md`** (root) — read that alongside
  this file, it's detailed and current as of the last integration
  pass.

## Authentication overview

**Rewritten 2026-08-07** — this section originally described three
structurally different flows (temp-password NodeOperator provisioning,
phone/password Rider login, separate undocumented routes per role).
None of that is current; `FRONTEND_API_INTEGRATION_MAP.md`'s
description is now stale too, don't trust it on this point. Consumer,
Rider, and NodeOperator all share the same two documented routes:

- **Consumer, Rider, NodeOperator** — `POST /auth/register` (role
  field: `consumer`/`rider`/`node_operator`) to sign up,
  `POST /auth/login` (role-agnostic) to log in. Registration does
  **not** log the user in — the frontend always routes to `/login`
  after a successful `register` call. Role-specific onboarding
  (Rider KYC, NodeOperator Node setup) happens post-login, as separate
  documented steps — see the Riders/Node Operators sections of
  `docs/API_INTEGRATION_STATUS.md`.
- **Admin** — accounts are backend-provisioned only
  (`POST /users/invite` by an existing Admin), never self-registered;
  logs in via the same `POST /auth/login` every other role uses.
- **Consumer's `/auth/consumer/request-otp`/`request-login-otp`** — an
  OTP step that doesn't appear anywhere in `docs/API.md`. Live,
  load-bearing, and — as of a 2026-08-20 audit — deliberately left
  unresolved at the user's explicit direction rather than rebuilt
  against the plain register/login flow above. Flagged, not fixed; see
  `docs/API_INTEGRATION_STATUS.md`'s Inconsistencies section.

Session state: `AuthSession = { user: User }` — **no access/refresh
token field**. `useAuthStore` (Zustand) holds it in memory;
`authService` also writes a copy to `localStorage`
(`locoomo_session`) so the app can render optimistically on reload.
There is no `/auth/me` endpoint, so `getSession()` just reads that
local copy and trusts it until some call 401s. `useSessionBootstrap`
(mounted once via `AuthProvider` at the root) reads it into the store
on load and flips `isInitializing` off; `AuthGuard` gates protected
routes on that flag + session presence.

## State management approach

- **Zustand** for pure client state that isn't fetched from a server:
  `auth.store.ts` (session), `delivery-draft.store.ts` (multi-step
  New Delivery form state, survives route navigation, reset on
  submit), `notification.store.ts` (toast, auto-clears after 4s).
- **TanStack Query** for anything that comes from the network — cache
  keys centralized in `QUERY_KEYS` (`core/config/constants.ts`).
  Default `staleTime: 30_000`, `retry: 1`, `refetchOnWindowFocus: false`.
- **React Hook Form + Zod** — only confirmed in the User module
  (`modules/user/schemas/*.schema.ts`). Several screens (e.g.
  `ForgotPasswordScreen`) use plain `useState` instead of RHF — form
  handling is not fully consistent across the app (see
  ARCHITECTURE.md).

## Things future AI engineers must know

These are discrepancies between what the existing root-level docs
claim and what the current code actually does. They were found by
reading the live source, not assumed — verify against the code before
trusting either side if more time has passed since 2026-08-06.

1. ~~**The mock/real API switch is dead.**~~ **Mock code removed
   2026-08-20** — this item described a 2026-08-06 snapshot; the
   situation it warned about (don't delete mocks until feature-complete)
   has since been resolved, not just re-flagged. `env.useMockApi`
   (`NEXT_PUBLIC_USE_MOCK_API`) is still read in `core/config/env.ts`
   and still does nothing — every service file (`auth`, `delivery`,
   `node`, `rider`, `nodes`, `admin`) exports its `real<X>Service`
   directly, no mock variant exists to switch to any more. The
   commented-out `mock<X>Service` blocks that used to sit in every
   service file are deleted, along with the `src/core/mocks/*` fixture
   files they were the last reason to keep — `mock-vendor.ts`,
   `mock-deliveries.ts`, `mock-nodes.ts`, `mock-rider.ts`,
   `mock-activity.ts` are gone. `src/core/mocks/mock-utils.ts` is the
   one survivor — `generateId()` is a real, still-used ID-generation
   helper (`node.service.ts`), not fake data. Don't trust README
   instructions about developing against mock data — the app always
   hits the real API now, and there's no mock path left to fall back
   to even in theory.

2. **No bearer-token attachment exists**, despite
   `API_INTEGRATION.md` stating "every request goes through
   `src/core/api/client.ts`, which now auto-attaches the session's
   bearer token to every call." Reading `client.ts` directly: that
   logic is present only as **commented-out** code. Auth is entirely
   `credentials: "include"` cookie-based. This makes
   `API_INTEGRATION.md`'s auth section stale — trust
   `FRONTEND_API_INTEGRATION_MAP.md`'s description instead, which
   correctly describes the cookie-based model.

3. **README's PWA description is inaccurate.** It says: "Hand-rolled
   PWA... No third-party PWA plugin — full control, no Next 15
   compatibility risk." The code actually uses **Serwist**
   (`@serwist/next`, `@serwist/precaching`, `@serwist/sw` in
   `package.json`; `next.config.ts` wraps the config with
   `withSerwistInit`, `swSrc: "src/app/sw.ts"`). This *is* a
   third-party PWA plugin. Not a functional problem, just don't repeat
   the "hand-rolled, no plugin" claim.

4. **API base URL — resolved.** `core/config/env.ts`'s hardcoded
   fallback, `https://locoomo-api.up.railway.app/api/v1`, is the
   **confirmed live URL** (per the project owner, 2026-08-06).
   `.env.example` and `API_INTEGRATION.md` both still reference
   `https://dev.locoomo.com/api/v1` — that's the stale value; update
   those two files (or at minimum don't trust them) whenever they're
   next touched.

5. **Payment collection is not implemented.** `deliveryService.pay()`
   just re-fetches the already-booked order; no payment SDK
   (Paystack/Flutterwave/etc.) is integrated. Do not treat the
   checkout flow as production-ready for real money.

6. **A few Node Operator/Rider features still throw `NOT_IMPLEMENTED`**
   in real mode, by design, because the backend has no endpoint yet:
   rider availability toggle (no dedicated endpoint), rider job
   history with a payout figure (`GET /handoffs/my-orders` carries no
   `amountKobo`), and rider/node profile details beyond onboarding.
   This is intentional (surfaces the gap loudly rather than faking
   success) — see `docs/API_INTEGRATION_STATUS.md` for the current,
   authoritative list; this item's earlier mention of shelf assignment
   and flag-issue is stale, both features are deleted entirely as of
   2026-08-15 and 2026-08-20 respectively, not just left
   `NOT_IMPLEMENTED`. Rider/NodeOperator's own earnings summary is
   **no longer** on this list — `GET /earnings/mine`/`GET
   /earnings/my-node` landed in `docs/API.md` and are wired as of
   2026-08-20.

7. **`AGENTS.md` (this repo's root instructions) tells engineers to
   read `node_modules/next/dist/docs/` before writing code.** That
   path **does not exist** in this project's installed `next` package
   (verified: `ls` returns "No such file or directory"). Treat that
   instruction with skepticism — it does not correspond to reality in
   this codebase as of this analysis. Don't waste time hunting for it.

8. **Minor cosmetic issues noticed, not fixed** (out of scope for this
   analysis pass, flagged for whoever next touches these files):
   `tsconfig.json`'s `include` array has a stray
   `"src/app/forgot-password"` entry appended after the glob patterns
   (looks like an accidental paste); `ForgotPasswordScreen.tsx` has
   leftover `console.log`/`console.error` debug statements.
