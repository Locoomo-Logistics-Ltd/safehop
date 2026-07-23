import { env } from "@/core/config/env";
import { ApiError } from "./errors";
import { useAuthStore } from "@/store/auth.store";
import { ApiResponse } from "./types";

/**
 * The single HTTP call site for the entire application.
 *
 * Every real-network request — once you flip NEXT_PUBLIC_USE_MOCK_API
 * to false — flows through this function. It handles:
 *   - base URL prefixing
 *   - auth token attachment (auto-pulled from useAuthStore; pass an
 *     explicit `token` option only to override, e.g. for a
 *     newly-issued token not yet synced into the store)
 *   - JSON parsing
 *   - normalizing every failure into an ApiError
 *
 * Nothing outside core/api/services/* should ever call fetch() directly.
 */

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Override the auto-attached session token — usually left unset. */
  token?: string | null;
  /** Set true for endpoints that don't require auth (e.g. login, OTP requests). */
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, skipAuth, headers, ...rest } = options;

  const url = `${env.apiBaseUrl}${path}`;

  const resolvedToken = skipAuth
    ? null
    : token !== undefined
      ? token
      : useAuthStore.getState().session?.accessToken ?? null;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
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

  // if (!response.ok) {
  //   const errorPayload = payload as
  //     | { message?: string; code?: string; fieldErrors?: Record<string, string> }
  //     | null;

  //   throw new ApiError({
  //     message: errorPayload?.message ?? "Request failed. Please try again.",
  //     status: response.status,
  //     code: errorPayload?.code,
  //     fieldErrors: errorPayload?.fieldErrors,
  //   });
  // }

  const apiResponse = payload as ApiResponse<T>;


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
