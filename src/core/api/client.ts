import { env } from "@/core/config/env";
import { ROUTES, STORAGE_KEYS } from "@/core/config/constants";
import { ApiError } from "./errors";
import { ENDPOINTS } from "./endpoints";
import { useAuthStore } from "@/store/auth.store";

import { ApiResponse } from "./types";


interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Marks a route as not needing a session — also skips the 401 → refresh → retry logic below (there's no session to refresh yet on login/register/etc). */
  skipAuth?: boolean;
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const url = `${env.apiBaseUrl}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      credentials: "include",
    headers: {
  "Content-Type": "application/json",
  ...headers,
},
      body: body !== undefined ? JSON.stringify(body) : undefined,

    });
  } catch {
    throw new ApiError({
      message: "Couldn't reach the server. Check your connection and try again.",
      code: "NETWORK_ERROR",
      status: 0,
    });
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }



  const apiResponse = payload as ApiResponse<T> | null;

  if (!apiResponse) {
    throw new ApiError({
      message: `Unexpected response from server (${response.status}).`,
      code: "UNKNOWN_ERROR",
      status: response.status,
    });
  }

if (!apiResponse.success) {
  throw new ApiError({
    message: apiResponse.error.message,
    code: apiResponse.error.code,
    status: response.status,
    correlationId: apiResponse.error.correlationId,
    details: apiResponse.error.details,
  });
}

return apiResponse.data;
}

// ── 401 → refresh → retry ─────────────────────────────────────────
// Access tokens expire every 15 min (docs/API.md) with no way for the
// user to notice — every authenticated call that comes back 401
// UNAUTHENTICATED gets one silent refresh-and-retry attempt before the
// error surfaces. Refresh tokens are single-use and rotate on every
// call, so two concurrent 401s must not each fire their own refresh
// (the second would fail with INVALID_REFRESH_TOKEN even though
// nothing's wrong) — `refreshPromise` centralizes that into one
// in-flight call every caller awaits.

let refreshPromise: Promise<boolean> | null = null;

function refreshSessionOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = rawRequest(ENDPOINTS.auth.sessionRefresh, { method: "POST" })
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/** Per docs/API.md: any error from /auth/refresh clears both cookies server-side — treat it as a hard sign-out rather than retrying further. */
function handleHardSignOut() {
  useAuthStore.getState().clear();
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.session);
  if (window.location.pathname !== ROUTES.login) {
    window.location.href = ROUTES.login;
  }
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  try {
    return await rawRequest<T>(path, options);
  } catch (err) {
    const isAuthRoute = path.startsWith("/auth/");
    if (err instanceof ApiError && err.code === "UNAUTHENTICATED" && !options.skipAuth && !isAuthRoute && !isRetry) {
      const refreshed = await refreshSessionOnce();
      if (refreshed) {
        return request<T>(path, options, true);
      }
      handleHardSignOut();
    }
    throw err;
  }
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
