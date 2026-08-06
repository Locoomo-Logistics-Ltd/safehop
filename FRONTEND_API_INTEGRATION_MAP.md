# Frontend API Integration Map

A reference for how API integration works in this app, derived from the completed
login/register (auth) implementation. Use this as the standard pattern when wiring
up any new backend API.

## Architecture at a Glance

```
core/api/endpoints.ts        Route string catalogue (single source of URLs)
core/api/client.ts           httpClient — fetch wrapper, envelope unwrap, error throw
core/api/errors.ts           ApiError class + getErrorMessage / getFriendlyError
core/api/types.ts            ApiResponse envelope (success/failure) + ValidationDetail
core/api/services/*.service  Service objects: one method per backend operation
core/api/services/index.ts   Barrel — re-exports every service
core/types/*.types.ts        Domain + payload interfaces (User, *Payload, sessions)
core/config/env.ts           Base URL, feature flags (single place for process.env)
core/config/constants.ts     ROUTES + QUERY_KEYS (TanStack Query cache keys)
store/*.store.ts             Zustand global state (auth.store holds the session)
modules/<role>/hooks/*       React hooks: wrap service calls in useMutation/useQuery
modules/<role>/components/*  UI screens that call the hooks
app/**/page.tsx              Route entry points that render the screens
app/providers/*              QueryProvider + AuthProvider mounted at the root
```

## Current API Integration Pattern

The auth flow demonstrates the canonical layering:

```
Endpoint          ENDPOINTS.auth.consumerLogin  ("/auth/login")
  ↓
Service           authService.loginConsumer(payload)
                    → httpClient.post(...) → mapSessionResponse() → persistSession()
  ↓
Hook / State      useAuth().login  (useMutation)
                    onSuccess → useAuthStore.setSession + queryClient.setQueryData
                    onError   → useNotificationStore.showNotification
  ↓
Component         LoginScreen  → calls login({ email, password })
  ↓
Page              app/login/page.tsx → <LoginScreen />
```

Data flows down through this chain; a network response is unwrapped once by the
client, mapped once by the service, cached in Zustand + TanStack Query by the hook,
and read by components via `useAuthStore` / `useCurrentUser`.

### Where API functions are defined
Every network operation is a method on a **service object** in
`src/core/api/services/*.service.ts` (e.g. `auth.service.ts`). Components and hooks
never call `fetch` or `httpClient` directly — they always go through a service.

### How requests are made
All requests go through `httpClient` (`src/core/api/client.ts`), a thin `fetch`
wrapper exposing `get / post / patch / delete`. It:
- prefixes `env.apiBaseUrl`,
- sets `Content-Type: application/json` and `credentials: "include"` (cookie-based
  session — the browser carries the auth cookie automatically),
- JSON-stringifies the body,
- unwraps the `ApiResponse<T>` envelope and returns `data`, or throws `ApiError`.

> Note: `skipAuth` is accepted in `RequestOptions` but currently commented out in
> the client — auth is cookie-based, so there is no bearer-token header to attach.

### How authentication state is managed
- **Session cookie** — set by the backend, sent on every request via
  `credentials: "include"`. This is the real auth mechanism.
- **`store/auth.store.ts`** — a Zustand store holding `{ session, isInitializing }`.
  It never makes network calls; hooks push results in via `setSession`. Read the
  user anywhere with `useCurrentUser()` or `useAuthStore(s => s.session)`.
- **`localStorage` (`locoomo_session`)** — the service persists a lightweight
  session copy (`persistSession`) so the app can rehydrate on reload. There is no
  `/auth/me` endpoint; `getSession()` reads local storage and is trusted until a
  call 401s.
- **`useSessionBootstrap`** (mounted by `AuthProvider` at the root) — runs once on
  load, calls `authService.getSession()`, and syncs it into the store, flipping
  `isInitializing` off.
- **`AuthGuard`** (`components/layout/AuthGuard.tsx`) — gates protected routes:
  shows a spinner while `isInitializing`, redirects to `/login` if no session.

### How responses are handled
The backend returns a consistent envelope (`core/api/types.ts`):
```ts
{ success: true,  data: T,     meta } | { success: false, error: {...} }
```
`httpClient` inspects `success`, returns `data` on success, throws `ApiError`
otherwise. Services then map the raw payload into a domain type — see
`mapSessionResponse()` in `auth.service.ts`, the single place to adjust if the
server's response shape changes.

### How errors are handled
- The client throws a typed **`ApiError`** carrying `status`, `code`,
  `correlationId`, and validation `details`.
- **`getErrorMessage(error)`** → a plain string (used in toast/notification bodies).
- **`getFriendlyError(error)`** → a `{ title, message, action, type }` object mapped
  by error `code` (e.g. `INVALID_CREDENTIALS`, `VALIDATION_FAILED`), rendered by
  `ErrorAlert`.
- In hooks, `useMutation`'s `onError` surfaces the message via
  `useNotificationStore.showNotification`; screens can also read `loginError`
  directly and render an inline `ErrorAlert`.

### How types/interfaces are structured
- **Envelope/transport types** live in `core/api/types.ts` (`ApiResponse`,
  `ValidationDetail`).
- **Domain + payload types** live in `core/types/*.types.ts`, re-exported through
  `core/types/index.ts`. Import from `@/core/types`. Auth examples:
  `User`, `AuthSession`, `LoginConsumerPayload`, `RegisterConsumerPayload`.
- **Form-validation schemas** (Zod) live per module in
  `modules/<role>/schemas/*.schema.ts` (e.g. `loginSchema`, `signUpSchema`).

### How the UI consumes API results
Components import a module hook and call the returned mutate/query functions plus
their loading/error flags. Example — `LoginScreen` uses `useAuth()`, calls
`login({ email, password })`, and reads `isLoggingIn` / `loginError`. Global user
state is read via `useAuthStore` / `useCurrentUser`, not by re-fetching.

## API Location

New APIs are added under **`src/core/api/`**:

- **`endpoints.ts`** — add the route string to the correct module group (`orders`,
  `nodes`, `maps`, …). Use a function for path params: `detail: (id) => \`/orders/${id}\``.
- **`services/<domain>.service.ts`** — add a method that calls `httpClient` and
  returns a typed domain object. Existing service files: `auth`, `nodes`,
  `delivery`, `vendor`, `rider`. Add a new file only for a genuinely new domain, and
  re-export it from `services/index.ts`.

Expected service method shape:
```ts
async listOrders(): Promise<Order[]> {
  return httpClient.get<Order[]>(ENDPOINTS.orders.list);
}
```

## Authentication Reference (the example to follow)

The completed consumer login/register is the reference implementation:

- **Endpoints** — `ENDPOINTS.auth.consumerLogin` / `consumerRegister`.
- **Service** — `authService.loginConsumer` / `registerConsumer` in
  `core/api/services/auth.service.ts`. Login posts credentials, maps the response
  with `mapSessionResponse`, and persists the session; register posts and returns
  the created `User`.
- **Types** — `LoginConsumerPayload`, `RegisterConsumerPayload`, `AuthSession`,
  `User` in `core/types/user.types.ts`.
- **Hook** — `useAuth()` (`modules/user/hooks/use-auth.ts`) wraps both in
  `useMutation`; `onSuccess` writes to `useAuthStore` + `queryClient`, shows a
  success notification, and routes (`ROUTES.dashboard` / `ROUTES.login`); `onError`
  shows an error notification.
- **State** — `store/auth.store.ts` + `useSessionBootstrap` + `AuthGuard`.
- **UI** — `LoginScreen` / `CreateAccountScreen` call the hook; `app/login/page.tsx`
  renders the screen.

Rider and node-staff auth (`loginRider`, `registerRider`, `loginNodeStaff`) follow
the same shape with their own endpoints and payloads — mirror whichever role you
extend.

## Files Required for Future API Integration

| File/Folder | Purpose | When to modify |
|-------------|---------|----------------|
| `src/core/api/endpoints.ts` | Central catalogue of route strings, grouped by module | Always — add the new route(s) |
| `src/core/api/services/<domain>.service.ts` | Service object; one method per backend operation | Always — add a method (or a new file for a new domain) |
| `src/core/api/services/index.ts` | Barrel re-exporting all services | Only when adding a **new** service file |
| `src/core/types/<domain>.types.ts` | Domain models + request payload interfaces | Always — add payload + response types |
| `src/core/types/index.ts` | Barrel for `@/core/types` | Only when adding a **new** types file |
| `src/core/config/constants.ts` | `ROUTES` + `QUERY_KEYS` cache keys | When the feature needs a query key or a new route |
| `src/modules/<role>/hooks/use-*.ts` | Hook wrapping the service in `useMutation`/`useQuery` | Always — expose the call + loading/error state to the UI |
| `src/modules/<role>/schemas/*.schema.ts` | Zod form-validation schema | If the feature has a validated form |
| `src/modules/<role>/components/*` | Screen/UI that consumes the hook | When building the UI |
| `src/app/**/page.tsx` | Route entry rendering the screen | When the feature needs its own route |
| `src/store/*.store.ts` | Zustand global state | Only if the data must be shared app-wide (like the session) |
| `src/core/api/client.ts` | Shared fetch wrapper | Rarely — only for cross-cutting transport changes |
| `src/core/api/errors.ts` | Error class + friendly-message mapping | Only when adding a new error `code` mapping |
| `src/core/config/env.ts` | Env vars / base URL / flags | Only when a new env var is needed |

## Future API Integration Checklist

1. **Endpoint** — add the route to `ENDPOINTS` in `core/api/endpoints.ts`, in the
   right module group (use a function for path params).
2. **Types** — add the request payload + response interfaces in
   `core/types/<domain>.types.ts` (export via the barrel).
3. **Service** — add a method to the matching `*.service.ts` that calls `httpClient`
   and returns the typed domain object. Map the raw response if its shape differs
   from the domain type. Create a new service file + `index.ts` export only for a
   new domain.
4. **Query key** (reads only) — add an entry to `QUERY_KEYS` in `constants.ts`.
5. **Hook** — in `modules/<role>/hooks`, wrap the service call:
   - reads → `useQuery({ queryKey, queryFn })`
   - writes → `useMutation({ mutationFn, onSuccess, onError })`, invalidating or
     setting query data as needed, and surfacing errors via `showNotification`.
6. **Schema** (forms) — add a Zod schema in `modules/<role>/schemas` for validation.
7. **UI** — call the hook from the component; drive buttons/spinners off its
   `isPending`/`isLoading` flags and render errors with `ErrorAlert` /
   `getFriendlyError`.
8. **Route** — add an `app/**/page.tsx` if the feature needs its own screen; wrap in
   `AuthGuard` if it requires a session.
9. **Never** call `fetch`/`httpClient` from a component, read `process.env` outside
   `env.ts`, or hardcode a URL outside `endpoints.ts`.

