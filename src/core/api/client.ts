import { env } from "@/core/config/env";
import { ApiError } from "./errors";

import { ApiResponse } from "./types";


interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const url = `${env.apiBaseUrl}${path}`;

  // const resolvedToken = skipAuth
  //   ? null
  //   : token !== undefined
  //     ? token
  //     : useAuthStore.getState().session?.accessToken ?? null;

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
