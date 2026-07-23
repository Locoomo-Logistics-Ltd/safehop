# Real API Integration Status

This documents exactly what changed when the app was wired up to the
real Locoomo backend (`https://dev.locoomo.com/api/v1`, spec at
`/docs`), what's confirmed working, and what still needs backend work
or verification before going live with real traffic.

**The app still defaults to `NEXT_PUBLIC_USE_MOCK_API=true`** — nothing
changes for you until you flip that flag in `.env.local`. Everything
below describes what happens once you do.

---

## How to actually test against the real API

```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=https://dev.locoomo.com/api/v1
```

Every request goes through `src/core/api/client.ts`, which now
auto-attaches the session's bearer token to every call (pulled from
`useAuthStore`) — no per-call plumbing needed.

---

## Contract differences from the original Figma-driven build

Three structural UI changes were made after confirming with you:

1. **Rider login** — the real API only has password-based rider auth
   (`auth/rider/login`), no OTP endpoint exists. Kept the original
   two-screen "enter phone → second screen" shape as a UX wrapper, but
   the second screen is now a real password field
   (`modules/rider/components/auth/RiderLoginScreen.tsx`).

2. **Vendor account setup** — the real API has no PIN concept. Vendor
   (Node Staff) accounts are provisioned by an admin
   (`auth/node-staff/provision`, not called from this app) with a
   temporary password. The old "Create your PIN" screen is now a real
   email+password login that automatically detects a temporary
   password and walks into `first-login-reset`
   (`modules/vendor/components/setup/VendorSetupScreen.tsx`,
   `modules/vendor/hooks/use-vendor-login.ts`).

3. **Select Nodes → destination address** — the real
   `orders/calculate-fare` and `orders/book` take a free-text
   `destinationAddress` (server-geocoded), not a destination Node. The
   old two-node picker is now: pick an **origin** Node from the live
   map (unchanged), then a **destination address** input with live
   Google Places autocomplete
   (`modules/user/components/delivery/DestinationAddressInput.tsx`).

A consequence of #3: **fare calculation moved server-side.** The old
client-side `calculateQuote()` math is gone from the live path —
`deliveryService.calculateFare()` now calls
`orders/calculate-fare` for real and is `async` (see
`modules/user/hooks/use-fare-quote.ts`). The old function still exists
as `calculateQuote()` (deprecated) purely so nothing else breaks; it's
unused in real mode.

---

## ⚠️ Confirm these before trusting the app with real data

The live spec at `/docs` **doesn't document response body shapes** —
only request DTOs. Every `real*Service` function that parses a
response is a best-effort guess at conventional field names
(`accessToken`/`access_token`, etc.). Test each of these against the
actual API and fix the mapping function if it's wrong — each one is
a single, clearly-commented function:

| What | Where to fix if wrong |
|---|---|
| Login/register/reset response shape (`user`, `accessToken`, `refreshToken`) | `mapSessionResponse()` in `core/api/services/auth.service.ts` |
| Fare calculation response shape | `mapFareResponse()` in `core/api/services/delivery.service.ts` |
| Node inventory response shape (node profile + parcel list) | `mapInventoryResponse()` in `core/api/services/vendor.service.ts` |
| Notification → Activity Log mapping | `mapNotificationToActivity()` in `core/api/services/vendor.service.ts` |
| "First login needs a password reset" signal | `isPasswordResetRequired()` in `modules/vendor/hooks/use-vendor-login.ts` — currently assumes a `428` status or `PASSWORD_RESET_REQUIRED` error code; confirm the real signal with the backend team |
| QR code payload encoding (`{trackingCode, qrNonce}` as JSON) | `encodeQrPayload()` / `decodeQrPayload()` in `core/types/delivery.types.ts` — **this is a guess**; confirm the actual format the backend expects the printed/displayed QR to encode |

---

## Features with NO backend endpoint yet

These throw a clear `ApiError` with a "not supported yet" message in
real mode (never silently fake success) so the gap is visible in the
UI rather than hidden:

| Feature | Screen | Service method |
|---|---|---|
| Shelf location assignment | Vendor Scan Success | `vendorService.assignShelf()` |
| Flagging a parcel issue | Vendor Flag Issue | `vendorService.flagParcel()` |
| Rider online/offline toggle | Rider Home | `riderService.setAvailability()` — currently a no-op that just returns the requested status; real job-board eligibility may depend purely on telemetry ping recency, unconfirmed |
| Rider earnings summary | Rider Home, Rider Profile | `riderService.getEarningsSummary()` |
| Rider job history ("My Deliveries") | Rider Deliveries tab | `riderService.getJobHistory()` |
| Rider profile/vehicle details | Rider Profile | `riderService.getProfileDetails()` |

**"Activity Log"** (Vendor) has no dedicated endpoint either, but maps
to the real `GET /notifications/user/{userId}` as the closest
equivalent — confirm that's actually the right data source with the
backend team; it may need a vendor-specific activity feed instead.

---

## Payment collection — not wired

`orders/book` accepts an optional `paymentReference` string, implying
payment is collected **client-side** via a payment provider SDK
(Paystack/Flutterwave/etc.) before booking, with `payments/webhook/:provider`
confirming it server-side. No such SDK is integrated yet.
`deliveryService.pay()` currently just re-fetches the already-booked
order — wire a real payment step into `CheckoutScreen.tsx` before
handling real money.

---

## Rider KYC onboarding — not built

The real API requires a rider to submit KYC details after registering
(`identity/rider/{userId}/onboarding`: NIN, plate number, vehicle
model/type, driver's license) before they can presumably go online.
`authService.submitRiderOnboarding()` is wired to the real endpoint,
but no screen calls it yet — there's no rider self-registration screen
built at all (the Figma only showed login). Add a registration +
onboarding flow before onboarding real riders.

---

## What's fully live and confirmed correct (request side)

Everything else maps 1:1 to a real endpoint with the exact request
shape the spec documents:

- Consumer signup (`request-otp` → `register`) and login
  (`request-login-otp` → `login`, or direct password login)
- Node search (`nodes/nearby`, live geolocation-based)
- Fare calculation and order booking
- Vendor parcel check-in (`orders/scan-handoff`, type `ORIGIN_CHECK_IN`)
- Vendor parcel release (`orders/scan-collection`)
- Rider job board, accept, manifest, pickup/dropoff scans
  (`riders/job-board`, `accept-job`, `manifest`, `scan-pickup`, `scan-dropoff`)
- Rider location telemetry (`maps/rider/telemetry-ping`)
- Order tracking (`maps/track/{trackingCode}`) — used by the User
  tracking screen (not yet wired to a hook; `deliveryService.getById()`
  hits `orders/{id}` instead, which may be sufficient, or you may want
  a dedicated `useTrackByCode` hook against `maps/track/{trackingCode}`
  for public/unauthenticated tracking links)
