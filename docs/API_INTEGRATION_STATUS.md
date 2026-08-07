# API_INTEGRATION_STATUS.md

> Living checklist — every endpoint documented in `docs/API.md`, and
> whether the frontend actually calls it correctly today. Update this
> file every time an endpoint's status changes (newly wired, corrected,
> or found to be broken). This is scoped strictly to what `API.md`
> documents — it does not cover `orders`/`maps`/`riderOps`/`notifications`
> routes the app also calls, since none of those appear in `API.md` yet
> (see the note at the bottom).

**Legend**: ✅ Integrated — real route, correct request/response shape, in use.
⚠️ Mismatched — wired to *something*, but the path, params, or payload
diverge from `API.md`'s documented contract. ❌ Not integrated — no
frontend code calls the real route at all.

## Auth

| Endpoint | Status | Frontend call site | Notes |
|---|---|---|---|
| `POST /auth/register` | ✅ | `authService.registerConsumer` (`ENDPOINTS.auth.consumerRegister`) | Consumer only — the `role` field is never sent, so this can't self-register a NodeOperator/Rider through this call even though `API.md` allows it |
| `POST /auth/login` | ✅ | `authService.loginConsumer`, `authService.loginAdmin` (`ENDPOINTS.auth.consumerLogin`) | Role-agnostic per `API.md`; both Consumer and Admin correctly share the one real route |
| `POST /auth/refresh` | ✅ | `authService.refreshSession` (`ENDPOINTS.auth.sessionRefresh`) | Route/payload correct, but nothing calls it automatically on a 401 — see `ARCHITECTURE.md`'s auth section |
| `POST /auth/logout` | ✅ | `authService.logout` (`ENDPOINTS.auth.sessionLogout`) | |
| `POST /auth/password-reset/request` | ✅ | `authService.requestPasswordReset` | |
| `POST /auth/password-reset/confirm` | ✅ | `authService.confirmPasswordReset` | |
| `POST /auth/verify-email` | ✅ | `authService.verifyEmail` | Method is wired correctly; no screen currently triggers it (no `/verify-email` page exists to read the token from the emailed link) |
| `POST /users/invite` | ✅ | `adminService.inviteStaff` (`ENDPOINTS.users.invite`), Team Management's "Invite Member" form | Role picker is scoped to the real invitable roles (`node_operator`/`rider`/`admin`) — the screen's other role taxonomy (`AdminTeamRole`: ops_manager/etc.) is unrelated and still fictional, see the Team row below |
| `POST /auth/invite/confirm` | ✅ | `authService.confirmInvite` (`ENDPOINTS.auth.inviteConfirm`), `/accept-invite` page (`AcceptInviteScreen`) | Reads `token` from the query string, same pattern as `/reset-password`. Handles `400 VALIDATION_FAILED` (field messages via `error.details`), `401 INVALID_INVITE_TOKEN` (dedicated expired/used-link state), and `429 RATE_LIMITED` (generic handling already in `getFriendlyError`) |

## Nodes

| Endpoint | Status | Frontend call site | Notes |
|---|---|---|---|
| `POST /nodes` (Admin create) | ✅ | `adminService.onboardPartnerNode` (`ENDPOINTS.adminNodes.create`), Node Network's "Add Node" form | Form fields corrected to match the real required body (name/address/city/state/latitude/longitude/capacity, operatingHours optional) — the old form only collected name/address/contactPhone and would have 400'd on every submit |
| `GET /nodes` (Admin list) | ✅ | `adminService.getNodeStatuses` (`ENDPOINTS.adminNodes.list`) | Fetches `limit=100`, no pagination UI yet |
| `GET /nodes/nearby` | ⚠️ | `nodesService.listNearby` (`ENDPOINTS.nodes.nearby`) | Path is correct, but sends `radiusInMeters` — `API.md` requires `radiusKm` (0.1–100). As written this will very likely fail backend validation |
| `GET /nodes/:id` | ✅ | `adminService.getNodeDetail` (`ENDPOINTS.adminNodes.detail`), Node Network's "View Details" button | Expands inline on each node card (address, country, onboarding type, created date) |
| `PATCH /nodes/:id` | ✅ | `adminService.updateNode` (`ENDPOINTS.adminNodes.detail`), Node Network's "Manage" panel | Only the `status` field is exercised (approve/suspend/reactivate) — the payload type carries every field the real route accepts, but no screen edits name/address/capacity/etc. yet. The old unused `ENDPOINTS.nodes.updateStatus` (`/nodes/:id/status`, never matched the real path) is still there but still uncalled by anything |

## Node Operators

| Endpoint | Status | Frontend call site | Notes |
|---|---|---|---|
| `POST /node-operators/onboarding` | ❌ | none | No NodeOperator self-registration/onboarding flow exists in the frontend at all |
| `GET /node-operators/me` | ❌ | none | |
| `GET /node-operators/pending` | ❌ | none | No screen in the current 8-frame Admin design surfaces this queue |
| `PATCH /node-operators/:id/approve` | ❌ | none | |

## Riders

| Endpoint | Status | Frontend call site | Notes |
|---|---|---|---|
| `GET /riders/verification/upload-signature` | ❌ | none | |
| `POST /riders/onboarding` | ❌ | none | `authService.submitRiderOnboarding` calls a differently-shaped, unconfirmed `/identity/rider/:userId/onboarding` instead |
| `GET /riders/me` | ❌ | none | |
| `GET /riders/pending` | ❌ | none | No screen in the current 8-frame Admin design surfaces this queue |
| `PATCH /riders/:id/approve` | ❌ | none | |

## Summary

**11 of 23** documented endpoints are cleanly integrated (each with a
real screen driving it — no screenless integrations by policy), **1**
is wired but with a parameter mismatch likely to fail against the live
backend, and **11** have no frontend integration at all — either no
call site exists, or the existing call site points at a route
`API.md` doesn't document.

## Out of scope for this file

The app also calls `orders.*`, `maps.*`, `riderOps.*`, `notifications.*`,
and a handful of role-specific auth routes (`/auth/rider/register`,
`/auth/rider/login`, `/auth/node-staff/*`) — none of these appear in
`docs/API.md`. `API.md`'s own header says "if something you need isn't
here, it isn't built yet," so either the backend for these exists but
isn't documented yet, or these calls are hitting routes that were never
built against the current backend. Not tracked here because there's
nothing in `API.md` to check them against; flag to whoever owns the
backend docs if this file needs to expand to cover them.
