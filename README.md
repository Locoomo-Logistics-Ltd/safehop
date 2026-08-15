# Locoomo Platform

Next.js 15 + TypeScript PWA for the Locoomo logistics platform. This
codebase covers three roles end-to-end:

- **User** — onboarding → send a parcel → checkout → track.
- **Vendor (Shop Owner)** — PIN setup → Node Dashboard → scan parcels
  in via real camera QR → shelf assignment → OTP-gated release to
  recipients → flag issues → activity log.
- **Rider** — phone + OTP login → go online → receive & accept job
  offers → navigate to pickup → scan parcel QR → navigate to dropoff
  → delivery complete → earnings/job history → profile.

Admin module will be added the same way, alongside `modules/user/`,
`modules/vendor/`, and `modules/rider/`.

---

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** (CSS-based theme, no `tailwind.config.ts`)
- **Zustand** — lightweight global state (auth session, delivery draft)
- **TanStack Query** — data fetching, caching, loading/error states
- **React Hook Form + Zod** — form state and validation
- **next-auth** (installed, scaffolded) — ready for real OAuth
- **@fontsource** — self-hosted Sora + DM Sans (no runtime Google Fonts dependency — works fully offline as a PWA)
- **leaflet** + **Geoapify** tiles/geocoding — maps on Select Nodes and Node Network, plus address→coordinate lookup (graceful fallback if no API key is set; see below)
- **@yudiel/react-qr-scanner** — real camera-based QR scanning on the Vendor "Scan" screen
- Hand-rolled **PWA**: `public/manifest.webmanifest` + `public/sw.js` + a tiny registration component. No third-party PWA plugin — full control, no Next 15 compatibility risk.

---

## Folder structure & separation of concerns

```
src/
├── app/                        Routes only — no business logic lives here.
│   ├── (user)/                 Route group for authenticated User screens.
│   │   ├── layout.tsx          AuthGuard + AppShell wrapper for this group.
│   │   ├── dashboard/
│   │   ├── delivery/new, /select-nodes, /method, /[id]/track, /[id]/success
│   │   ├── checkout/
│   │   ├── track/
│   │   └── profile/
│   ├── (vendor)/                Route group for authenticated Vendor screens.
│   │   ├── layout.tsx          AuthGuard + AppShell wrapper (Vendor nav set).
│   │   └── vendor/
│   │       ├── home/                          Node Dashboard
│   │       ├── activity/                      Activity Log
│   │       ├── scan-success/[parcelId]/        Post-scan shelf assignment
│   │       ├── parcels/[parcelId]/release/      OTP release
│   │       ├── parcels/[parcelId]/flag/         Flag issue
│   │       └── profile/
│   ├── (rider)/                 Route group for authenticated Rider screens.
│   │   ├── layout.tsx          AuthGuard + AppShell wrapper (Rider nav set).
│   │   └── rider/
│   │       ├── home/                          Rider dashboard
│   │       ├── jobs/                          Job offer screen
│   │       ├── jobs/[jobId]/                   Active job (en route)
│   │       ├── jobs/[jobId]/complete/           Delivery Complete
│   │       ├── deliveries/                     My Deliveries (earnings history)
│   │       └── profile/
│   ├── vendor-setup/            PIN creation — outside the shell (no nav yet).
│   ├── vendor-scan/             Full-screen camera scanner — outside the shell.
│   ├── rider-login/             Phone + OTP login — outside the shell.
│   ├── rider-scan/[jobId]/       Full-screen camera scanner — outside the shell.
│   ├── role-select/, create-account/, login/   Public onboarding routes
│   │                                          (shared by User + Vendor signup).
│   └── providers/               QueryProvider, AuthProvider, SW registration.
│
├── modules/                     Feature/business logic, organized by role.
│   ├── user/
│   │   ├── components/          UI grouped by sub-feature (auth, dashboard,
│   │   │                        delivery, checkout, tracking, profile).
│   │   ├── hooks/                useAuth, useDeliveries, useNodes, etc.
│   │   ├── schemas/             Zod validation schemas for forms.
│   │   └── constants/           Module-specific copy/config (role list, etc).
│   ├── vendor/
│   │   ├── components/          setup, dashboard, scanner, activity,
│   │   │                        release, flag, profile — one folder per
│   │   │                        sub-feature, mirroring the user module.
│   │   └── hooks/                useVendorNode, useNodeParcels,
│   │                            useScanParcel, useReleaseParcel,
│   │                            useFlagParcel, useActivityLog, etc.
│   └── rider/
│       ├── components/          auth, dashboard, job-offer, active-job,
│       │                        scanner, complete, history, profile.
│       └── hooks/                useRiderLogin, useRiderAvailability,
│                                useJobOffer, useActiveJob, useScanJob,
│                                useJobHistory, useRiderProfile, etc.
│
├── core/                         Shared across all role modules.
│   ├── api/
│   │   ├── client.ts             The ONE fetch() call site in the app.
│   │   ├── endpoints.ts          All real API route paths.
│   │   ├── errors.ts             Normalized ApiError class.
│   │   └── services/             auth, nodes, delivery, vendor, rider —
│   │                            each exports a mock/real implementation
│   │                            behind one identical interface (see below).
│   ├── mocks/                    Mock data + utils, used only when
│   │                            NEXT_PUBLIC_USE_MOCK_API=true.
│   ├── types/                    Canonical domain types (User, Delivery,
│   │                            LocoomoNode, NodeParcel, ActivityLogEntry,
│   │                            DeliveryJob, etc.) — single source of truth.
│   └── config/                   env.ts (all env vars read here, nowhere
│                                else) + constants.ts (routes, query keys).
│
├── components/
│   ├── ui/                       Design-system primitives: Button, Input,
│   │                            Card, StatusBadge, RouteRail, PinPad,
│   │                            PinDots, OtpInputBoxes, etc. — shared by
│   │                            every role.
│   ├── layout/                   AppShell, Sidebar, BottomNav, TopBar,
│   │                            AuthGuard — the responsive app shell.
│   │                            Sidebar/BottomNav accept a `navItems` prop
│   │                            so each role supplies its own nav set.
│   ├── scanner/                  QrScannerView — real camera QR scanning,
│   │                            shared by the Vendor and Rider modules.
│   └── icons/                    Hand-built SVG icon set.
│
├── store/                        Zustand stores: auth.store.ts,
│                                delivery-draft.store.ts (multi-step form
│                                state that survives route navigation).
└── lib/                          Pure utility functions: cn(), format.ts, geo.ts.
```

---

## How to connect your real backend

This is the part that matters most. **Every screen calls a service
function — never `fetch` directly.** Each service in
`core/api/services/*.service.ts` exports one object with two internal
implementations:

```ts
const mockXService = { /* returns data from core/mocks, has fake latency */ };
const realXService  = { /* calls httpClient against your real API */ };

export const xService = env.useMockApi ? mockXService : realXService;
```

### To go live:

1. Open `.env.local` and set:
   ```
   NEXT_PUBLIC_USE_MOCK_API=false
   NEXT_PUBLIC_API_BASE_URL=https://your-real-api.com
   ```
2. Open `src/core/api/endpoints.ts` and update the path strings to match
   your actual backend routes (e.g. if your signup endpoint is
   `/v1/users/register` instead of `/auth/signup`, change it there once).
3. Confirm your backend's JSON response shapes match the types in
   `src/core/types/*.types.ts`. If they don't match exactly, you have
   two options:
   - Adjust your backend response to match these types (cleanest), or
   - Add a thin mapping function inside the relevant `real*Service`
     function in `core/api/services/*.service.ts` that transforms your
     backend's shape into ours before returning.

**Nothing else changes.** No component, hook, or screen needs to be
touched — they all depend on the service interface, not on mock vs.
real.

### Auth specifically

`core/api/services/auth.service.ts` has a `loginWithGoogle` stub in the
real implementation that throws "Not implemented" — wire this up via
NextAuth's Google provider (`next-auth` is already installed) at
`src/app/api/auth/[...nextauth]/route.ts` (create this file when ready)
and call `signIn("google")` from the `CreateAccountScreen` / `LoginScreen`
Google buttons instead of the mock mutation.

### The map (Select Nodes screen)

The Select Nodes screen uses **Leaflet + Geoapify tiles** via
`src/modules/user/components/delivery/NodeMapView.tsx`, which wraps the
shared `src/components/maps/MapView.tsx`. (It was Google Maps until
2026-08-15 — switched because Geoapify's free tier needs no billing
account. See "Switching map provider" below.) It:

- Requests the user's real browser location on mount
  (`modules/user/hooks/use-geolocation.ts`), centers the map there, and
  shows a pulsing "you are here" marker.
- Falls back to a Lagos-centered default if location is denied or
  unsupported — the screen still fully works.
- Computes **live distances** (`lib/geo.ts`, haversine formula) from
  the user's real position to every node, replacing the old static
  mock `distanceKm` values, and sorts the node list nearest-first.
- Renders node pins as clickable markers — clicking a pin selects that
  node and opens a popup, in sync with the list below it.
- Shows a clean **"Map unavailable"** fallback card (with the node
  list still fully usable) if no API key is configured — so the app
  never breaks for a missing key, it just degrades gracefully.

**To activate it:**
1. Get a free key at [myprojects.geoapify.com](https://myprojects.geoapify.com)
   — no card required, 3,000 requests/day on the free tier.
2. Add it to `.env.local`:
   ```
   NEXT_PUBLIC_GEOAPIFY_API_KEY=your_key_here
   ```
3. *(Optional)* Pick a different basemap with
   `NEXT_PUBLIC_GEOAPIFY_MAP_STYLE` (`osm-bright` is the default;
   `positron` and `osm-bright-grey` are quieter, which makes the
   coloured markers stand out more).

That's it — no code changes needed, the fallback UI disappears
automatically once a key is present.

⚠️ **Restrict the key before going live.** It ships to the browser like
any maps key; set an HTTP-referrer restriction in Geoapify's project
settings or anyone can spend your quota.

### Switching map provider

Two files know which provider is in use:

- `src/core/api/services/geocoding.service.ts` — address → coordinates.
- `src/components/maps/MapView.tsx` — the tiles and marker rendering.

Everything else talks to the provider-neutral `MapMarker[]` /
`GeocodeResult` contracts, so screens don't change. `NEXT_PUBLIC_MAPS_PROVIDER`
(`geoapify` | `google`) selects between them.

Moving to Google needs real work in both, not just the env flag:
`geocodeWithGoogle()` is currently a deliberate `NOT_IMPLEMENTED` throw
(Google's Geocoding **web service** sends no CORS headers, so a browser
can't call it directly — it needs either the Maps JS SDK's client-side
`Geocoder` or a small backend proxy route), and `MapView` would need its
Leaflet body swapped for the Google renderer.

The old `MockMapView.tsx` (static SVG map) is still in the codebase,
unused but kept as a lightweight reference/offline fallback in case a
future screen wants a decorative map without hitting the Maps API.

### The QR code (User tracking screen)

`src/modules/user/components/tracking/QrCodeBlock.tsx` renders a
decorative placeholder pattern (shown to the *sender* as a drop-off
code). Swap in a real QR generation library (e.g. the `qrcode` npm
package) inside this one file — the `value` prop contract stays the
same.

---

## The Vendor (Shop Owner) module

### Real camera QR scanning

`src/modules/vendor/components/scanner/QrScannerScreen.tsx` uses
**`@yudiel/react-qr-scanner`** for genuine camera-based scanning — not
a mock. It:

- Requests camera permission and decodes QR codes live, frame by frame.
- Shows a custom corner-bracket viewfinder with an animated scan line,
  matching the Figma design (the library's own finder UI is disabled
  via `components={{ finder: false }}` so ours renders instead).
- On a successful decode, looks up the parcel by its tracking code via
  `vendorService.lookupParcelByCode()` and checks it in.
- Falls back gracefully to a **manual code entry** bottom sheet if the
  camera is denied, unavailable (e.g. no camera on the device), or the
  vendor taps "Having trouble?" — exactly like the Figma flow.

No API key or setup needed — this works immediately using the
browser's built-in camera API (`getUserMedia`), unlike the Maps
integration. It does require HTTPS (or `localhost`) — browsers block
camera access on plain HTTP.

### Vendor data flow

`src/core/api/services/vendor.service.ts` follows the exact same
mock/real pattern as `auth.service.ts` and `delivery.service.ts` — see
"How to connect your real backend" above. It covers:

- `getNodeProfile()` — capacity, node details for the dashboard header.
- `listParcels()` / `lookupParcelByCode()` — the dashboard list + scanner lookup.
- `checkIn()` → `listShelves()` → `assignShelf()` — the full scan-to-shelf flow.
- `sendReleaseOtp()` / `releaseParcel()` — the OTP-gated release flow. The
  mock OTP accepts any 6-digit code starting with `492` (matching the
  partially-filled "4 9 2 _ _ _" shown in Figma) — replace this check
  with your real backend's OTP verification once it's live.
- `flagParcel()` — issue reporting, logged to the activity feed.
- `listActivity()` — the Activity tab's timeline.
- `setPin()` — Account Setup's PIN creation.

### Routing structure note

Three vendor routes intentionally sit **outside** the `(vendor)`
AppShell route group, the same way `role-select`/`login` sit outside
`(user)`:

- `/vendor-setup` — PIN creation has no bottom nav yet (pre-onboarding).
- `/vendor-scan` — the camera scanner is full-screen/full-black, it
  doesn't want the Sidebar/BottomNav chrome around it.

Everything else (`/vendor/home`, `/vendor/activity`,
`/vendor/parcels/[id]/release`, `/vendor/parcels/[id]/flag`,
`/vendor/scan-success/[id]`, `/vendor/profile`) lives inside
`(vendor)/layout.tsx` and gets the Sidebar (desktop) / BottomNav
(mobile) automatically.

### Shared signup, role-aware redirect

Both User and Vendor accounts are created through the same
`CreateAccountScreen` (`/create-account`) — `RoleSelectScreen` appends
`?role=vendor` to the URL when a vendor signs up, and
`modules/user/hooks/use-auth.ts`'s `getPostAuthRoute()` sends vendor
sessions to `/vendor-setup` (PIN creation) instead of the User
`/dashboard`. This keeps one signup form serving both roles without
the two modules importing each other. Rider has its own dedicated
phone+OTP login instead (see below) since its auth shape is
structurally different (no email/password at all).

---

## The Rider module

### Phone + OTP login (no password)

Unlike User/Vendor's email+password signup, Rider login
(`/rider-login`, `modules/rider/components/auth/RiderLoginScreen.tsx`)
matches the Figma "Welcome Back, Rider" screen exactly: enter a mobile
number → receive a 6-digit OTP → enter it on a numeric keypad (reusing
the same shared `PinPad` / `OtpInputBoxes` components as Vendor's PIN
setup and OTP release flows). This lives entirely in
`riderService.sendLoginOtp()` / `verifyLoginOtp()` — independent of
`authService`, since the shapes don't overlap enough to share.

### The rider job lifecycle

`src/core/api/services/rider.service.ts` follows the same mock/real
pattern as every other service in this codebase. It models the full
lifecycle shown across Figma frames 2–6:

1. **Availability** — `getAvailability()` / `setAvailability()` drive
   the Online/Offline toggle on the Home dashboard (with optimistic UI
   update via `use-rider-availability.ts`).
2. **Job offer** — `getCurrentJobOffer()` is polled every 15s
   (`use-job-offer.ts`) while online; a live circular countdown timer
   (`JobOfferCountdown.tsx`) auto-declines if the rider doesn't respond.
3. **Accept/decline** — `acceptJob()` sets the job as the rider's
   active job and routes to the en-route stepper screen.
4. **Pickup scan** — the rider's QR scanner
   (`modules/rider/components/scanner/RiderScanScreen.tsx`) reuses the
   same promoted `@/components/scanner/QrScannerView` the Vendor module
   uses — real camera access, corner-bracket viewfinder, one shared
   implementation for both roles. `scanPickup()` validates the scanned
   code against the job's expected `pickupQrCode` and advances the
   3-step stepper (Pickup → Transit → Delivered).
5. **Dropoff scan** — `scanDropoff()` completes the job, adds it to
   history, and frees the rider up for a new offer.
6. **Navigate** — the "Navigate" button on both the active-job and
   scan-success screens opens the device's **native maps app** via a
   `maps://` (iOS) / Google Maps web (Android/desktop) deep link —
   no in-app maps SDK needed for turn-by-turn, unlike the User
   module's Select Nodes screen which needs an interactive map for
   node selection specifically.

### Routing structure note

`/rider-login` and `/rider-scan/[jobId]` sit **outside** the `(rider)`
AppShell route group — no nav chrome during login, and the scanner is
a full-screen camera overlay — same pattern used for
`vendor-setup`/`vendor-scan` and `role-select`/`login`.

Everything else (`/rider/home`, `/rider/jobs`, `/rider/jobs/[jobId]`,
`/rider/jobs/[jobId]/complete`, `/rider/deliveries`,
`/rider/profile`) lives inside `(rider)/layout.tsx` and gets the
Sidebar (desktop) / BottomNav (mobile) automatically, using
`RIDER_NAV_ITEMS` (Home / Jobs / Earnings / Profile).

### Promoted shared components

Two components originally built for one role turned out to be needed
by two, so they were promoted up a level and the original files
re-export from the new location (so no existing import breaks):

| Component | Originally in | Promoted to | Used by |
|---|---|---|---|
| `OtpInputBoxes` | `modules/vendor/components/release/` | `components/ui/` | Vendor OTP release + Rider login |
| `QrScannerView` | `modules/vendor/components/scanner/` | `components/scanner/` | Vendor scan-in + Rider pickup scan |

If a third role needs one of these, it's already in the right place —
just import from its new location.

---

---

## Real API integration status

The app is wired to the real Locoomo backend
(`dev.locoomo.com/api/v1`). **See [`API_INTEGRATION.md`](./API_INTEGRATION.md)
for the full status** — what's confirmed working, what response
shapes are still assumptions pending verification, and which few
features (shelf assignment, flag-issue, rider earnings/history/profile,
payment collection) have no backend endpoint yet and need it added.

The app still defaults to `NEXT_PUBLIC_USE_MOCK_API=true` — flip that
flag in `.env.local` to point at the real API.

---

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Default `.env.local` ships with `NEXT_PUBLIC_USE_MOCK_API=true`, so the
whole User flow — signup, send a parcel, checkout, track — and the
whole Vendor flow — PIN setup, scan, shelf assignment, release, flag —
work immediately with realistic mock data and simulated network
latency, no backend required.

> **Camera note:** the Vendor QR scanner needs camera access, which
> browsers only grant over HTTPS or `localhost`. `npm run dev` on
> `localhost` works fine; if you deploy a preview elsewhere, make sure
> it's served over HTTPS or the scanner will show its manual-entry
> fallback.

```bash
npm run build    # production build
npm start         # serve the production build
```

## PWA install

Visiting the deployed app in Chrome/Edge/Safari shows an "Install app"
prompt (desktop) or "Add to Home Screen" (mobile) once served over
HTTPS — the manifest, icons, and service worker are already wired up
in `public/`.

## Responsive behavior

- **< 768px (mobile / PWA)**: `BottomNav` tab bar, `TopBar` per-screen
  header with back button, single-column layouts, sticky bottom CTAs.
- **≥ 768px (desktop web)**: fixed left `Sidebar` replaces `BottomNav`,
  `TopBar` hides (Sidebar carries the brand mark + nav), wider
  multi-column layouts where it makes sense (e.g. dashboard).

Both share the exact same `modules/*/hooks/*` and `core/api/services/*`
— only the presentational layer (`components/layout/*`) branches by
breakpoint. `Sidebar` and `BottomNav` both accept a `navItems` prop, so
the User module passes `USER_NAV_ITEMS` (+ a "New Delivery" primary
action), Vendor passes `VENDOR_NAV_ITEMS`, and Rider passes
`RIDER_NAV_ITEMS` — same shell components, different nav set per role,
set once in each route group's `layout.tsx`.
