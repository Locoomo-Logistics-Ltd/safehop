# DECISIONS.md

> Technical decisions already present in the codebase, reconstructed
> from reading the code, comments, and root-level docs (`README.md`,
> `API_INTEGRATION.md`, `FRONTEND_API_INTEGRATION_MAP.md`). Where a
> decision's reasoning isn't stated anywhere in the repo, it's marked
> "Unknown - requires clarification" rather than invented.

---

### Zustand for global client state (not Redux/Context)

**Decision**: Use Zustand for the small set of values that must be
shared across the tree but aren't server data (session, in-progress
delivery draft, toast notification).

**Reason**: Small surface area (3 stores, each a handful of fields) —
Redux's boilerplate isn't justified; plain Context would re-render
more broadly and doesn't offer selector-based subscriptions the way
Zustand's hook API does (evidenced by consistent use of selectors like
`useAuthStore((s) => s.session)` throughout the codebase to scope
re-renders).

**Tradeoffs**: No dedicated devtools/time-travel debugging set up
(no Redux DevTools integration observed); no `persist` middleware in
use, so session durability across reloads is hand-rolled in
`auth.service.ts` via manual `localStorage` reads/writes rather than
Zustand's built-in persistence — an inconsistency worth resolving if
another store ever needs to survive a reload.

**Alternatives considered**: Not stated in the repo. React Context is
the most likely alternative given the stack; Redux Toolkit is a
plausible one for a team already familiar with it. Unknown - requires
clarification which was actually weighed.

---

### TanStack Query for server state, kept separate from Zustand

**Decision**: All network-fetched data goes through TanStack Query
(`useQuery`/`useMutation`); Zustand never makes network calls itself.

**Reason**: Explicitly documented in `FRONTEND_API_INTEGRATION_MAP.md`:
"[the auth store] never makes network calls — hooks push results in
via `setSession`." This gives caching, loading/error flags, and
request de-duplication for free, and keeps a clean rule for where new
code should live (`network data → TanStack; UI/session state →
Zustand`).

**Tradeoffs**: Two state systems to reason about instead of one — a
piece of server data that's also mirrored into a Zustand store (the
session) has to be kept in sync manually at each mutation's
`onSuccess` (`setSession(...)` *and* `queryClient.setQueryData(...)`
are both called, every time, by hand — see `use-auth.ts`). If one of
those calls is forgotten in a future hook, the two would drift.

**Alternatives considered**: Unknown - requires clarification. Storing
the session purely in TanStack Query's cache (no separate Zustand
store) was a viable alternative given `useSessionBootstrap` already
uses `useQuery` for it — not adopted, no reasoning documented for why.

---

### Cookie-based auth (`credentials: "include"`) over bearer tokens

**Decision**: The real auth mechanism is a server-set session cookie,
sent automatically via `credentials: "include"` on every request. No
`Authorization: Bearer <token>` header is attached.

**Reason**: Inferred from the code itself — `core/api/client.ts`
contains commented-out logic for resolving and presumably attaching a
bearer token (`resolvedToken`), suggesting a token-based approach was
started and then abandoned in favor of cookies.
`FRONTEND_API_INTEGRATION_MAP.md` confirms this is intentional: "auth
is cookie-based, so there is no bearer-token header to attach." Note
this **contradicts** `API_INTEGRATION.md`, which describes the client
as auto-attaching a bearer token — that document is stale on this
point (see `PROJECT_CONTEXT.md` discrepancy #2).

**Tradeoffs**: Requires the backend to set the cookie with correct
`SameSite`/`Secure`/domain attributes for cross-origin requests to
work in every deployment environment; the frontend keeps a *separate*,
manually-synced copy of `{user}` in `localStorage` purely for optimistic
UI on reload, since there's no `/auth/me` to re-validate against — if
the cookie expires server-side, the app won't know until some
authenticated call 401s (no proactive refresh-on-401 interceptor
exists in `httpClient` as of this analysis).

**Alternatives considered**: Bearer token in a header (started, then
abandoned per the commented code — see above).

---

### Service-layer indirection — components never call `fetch`/`httpClient` directly

**Decision**: Every network operation is a method on a service object
in `core/api/services/*.service.ts`; hooks call services, components
call hooks. Enforced by convention (documented explicitly in
`FRONTEND_API_INTEGRATION_MAP.md`'s "Never call fetch/httpClient from
a component" rule), not by a lint rule.

**Reason**: Single place to adjust a response mapping if the backend's
JSON shape doesn't match the frontend's domain type (see
`mapSessionResponse`, `mapFareResponse`, etc.); single swap point for
mock vs. real implementations — this was clearly the original intent
of the `mock<X>Service` / `real<X>Service` split still present (commented
out) in every service file.

**Tradeoffs**: Extra boilerplate per new endpoint (endpoint string +
type + service method + hook, minimum). Now that the mock
implementations are dead code (see `PROJECT_CONTEXT.md`), the pattern's
main remaining value is the response-mapping indirection and the
single-`fetch`-call-site guarantee, not the originally-intended
mock/real swap.

**Alternatives considered**: Calling `httpClient` directly from
TanStack Query hooks, skipping the service layer — not adopted,
presumably to keep the mock/real swap point intact (see above).

---

### Route groups per role, each with its own `layout.tsx`

**Decision**: `(user)`, `(vendor)`, `(rider)` are separate Next.js
route groups, each wrapping its pages in `AuthGuard` + `AppShell` with
a role-specific `navItems` array, rather than one shared layout with
conditional nav logic.

**Reason**: Not stated explicitly in any doc — inferred from the
structure itself. This keeps each layout trivial (a few lines wiring
`AuthGuard` + `AppShell(navItems=X)`) and keeps role-specific nav data
(`USER_NAV_ITEMS`/`VENDOR_NAV_ITEMS`/`RIDER_NAV_ITEMS` in
`nav-config.ts`) colocated and simple to read, at the cost of three
near-identical layout files instead of one parameterized one.

**Tradeoffs**: Some duplication across the three `layout.tsx` files
(same `AuthGuard`+`AppShell` wiring, different `navItems`/route group).
Auth screens, camera-scanner routes, and vendor-setup are deliberately
placed **outside** any group specifically to avoid the nav chrome
these layouts add — documented explicitly in `README.md`'s "Routing
structure note" sections for Vendor and Rider.

**Alternatives considered**: One shared authenticated layout with a
role read off the session to pick `navItems` conditionally — not
adopted; no reasoning given in the repo for why route groups were
preferred. Unknown - requires clarification.

---

### Dedicated Zustand store for the multi-step delivery draft

**Decision**: `delivery-draft.store.ts` holds `receiver`, `parcel`,
`destinationAddress`, `originNodeId`, `method` across the New Delivery
→ Select Nodes → Method → Checkout screen sequence, instead of URL
query params or lifting state into a shared parent route.

**Reason**: Documented in the store's own comment: "Holds in-progress
'New Delivery' form state across the multi-step flow... Cleared on
successful submission or when the user backs out entirely." Next.js
App Router route groups don't share a layout across these specific
screens the way a shared parent would need to for prop-drilling to
work cleanly, and URL params would leak potentially sensitive receiver
details into the address bar/history.

**Tradeoffs**: State is global (any component could theoretically read
it) even though it's conceptually scoped to one flow; must remember to
call `reset()` on both successful submission and on user
abandonment/back-out paths, or stale data leaks into the next attempt.

**Alternatives considered**: URL search params, React Context scoped
to a delivery-flow layout, lifting state into a wrapping component.
Unknown - requires clarification which were actually considered.

---

### Centralized response-envelope unwrapping + error-code-to-copy mapping

**Decision**: `httpClient` unwraps the `{success, data}` /
`{success:false, error}` envelope exactly once; every error becomes a
single `ApiError` class; user-facing copy is derived from
`error.code` via one `getFriendlyError()` switch statement
(`core/api/errors.ts`), used everywhere an error reaches the UI.

**Reason**: Stated in `FRONTEND_API_INTEGRATION_MAP.md`: keeps every
service method's return type the plain domain type (not the envelope),
and gives one place to add a new error code's UX copy so messaging
stays consistent regardless of which screen/mutation triggered it.

**Tradeoffs**: Any error `code` the backend introduces that isn't in
the `switch` falls through to a generic "we hit a small delay" message
— there's no build-time or runtime warning when this happens, so new
backend error codes can silently produce unhelpful UI copy until
someone notices and adds a case.

**Alternatives considered**: Unknown - requires clarification. Per-hook
error handling (each `onError` writing its own message) is the obvious
alternative — not adopted, in favor of centralization.

---

### Shared camera QR scanner (component "promotion" pattern)

**Decision**: `QrScannerView` and `OtpInputBoxes` were originally built
inside `modules/vendor/`, then moved to shared locations
(`components/scanner/`, `components/ui/`) once the Rider module needed
identical functionality — with the original files kept as one-line
re-export shims rather than deleted.

**Reason**: Documented in `README.md`'s "Promoted shared components"
table and in each shim file's own comment. Avoids duplicating
camera-permission handling and the custom corner-bracket viewfinder UI
across two modules; keeping the shim avoids a breaking-import cleanup
pass across the vendor module at promotion time.

**Tradeoffs**: Two valid import paths for the same component now exist
indefinitely (the shim was never scheduled for removal) — new code
should import from the shared location directly, but nothing enforces
this, so import paths could drift back toward the deprecated one over
time without a lint rule catching it.

**Alternatives considered**: Immediately updating every vendor-module
import to point at the new shared location and deleting the old file —
not done, presumably to minimize the diff at promotion time.

---

### Google Maps integration is optional / gracefully degrading

**Decision**: The Select Nodes map (`@vis.gl/react-google-maps`) only
activates if `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set; otherwise the
screen shows a "Map unavailable" card with the node list still fully
usable.

**Reason**: Documented in `README.md`: avoids the app breaking for
contributors/environments without a configured (and billed) Google
Cloud project — Maps JavaScript API requires billing even on the free
tier.

**Tradeoffs**: Distance sorting and "nearest node" UX are meaningfully
worse without a key (falls back to a static list), so this is a
genuine feature degradation, not just a cosmetic one — worth surfacing
to whoever owns deployment config that the key should be set for
production.

**Alternatives considered**: None documented — the fallback-over-crash
approach appears to have been the only path taken.

---

### Serwist for the PWA service worker (contradicts README's own description)

**Decision**: `next.config.ts` wraps the Next config with
`withSerwistInit` from `@serwist/next`, generating `public/sw.js` from
`src/app/sw.ts`.

**Reason**: Not stated — but `README.md` claims the opposite ("Hand-rolled
PWA... No third-party PWA plugin"), which is inaccurate given Serwist
is a third-party PWA toolkit and is in fact what's wired up. This is a
documentation error, not a hidden decision — see
`PROJECT_CONTEXT.md` discrepancy #3. Whoever adopted Serwist should
update the README's wording, or whoever wrote the README should
double check what `next.config.ts` actually does.

**Tradeoffs / alternatives considered**: Not documented, since the
README doesn't accurately acknowledge the decision was made in the
first place.
