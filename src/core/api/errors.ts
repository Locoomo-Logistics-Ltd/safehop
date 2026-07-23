import { ValidationDetail } from "./types";


/**
 * Normalized error shape. Every service throws this, never a raw fetch
 * error or a raw Response — so every component that calls a service can
 * rely on a single, predictable error contract regardless of whether the
 * underlying call hit the mock layer or the real network.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly correlationId?: string;
  readonly details?: ValidationDetail[];

  constructor(params: {
    message: string;
    status?: number;
    code?: string;
    details?: ValidationDetail[];
  correlationId?: string;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status ?? 500;
    this.code = params.code ?? "UNKNOWN_ERROR";
    this.details = params.details;
    this.correlationId = params.correlationId;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Friendly fallback message for any error surfaced to the UI. */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
