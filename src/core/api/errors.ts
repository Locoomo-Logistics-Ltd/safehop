import { ValidationDetail } from "./types";



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


export function getFriendlyError(error: unknown) {
  if (!isApiError(error)) {
    return {
      title: "We hit a small delay 🚧",
      message:
        "We couldn't complete your request right now. Our system may be temporarily busy.",
      action:
        "Please try again in a moment.",
      type: "error",
    };
  }


  switch (error.code) {


    case "VALIDATION_FAILED":
      return {
        title: "Let's fix a few details ✍️",
        message:
          error.details
            ?.map((item) => item.message)
            .join(". ") ??
          "Some information needs to be corrected.",
        action:
          "Update the highlighted fields and try again.",
        type: "validation",
      };


    case "INVALID_CREDENTIALS":
    case "UNAUTHORIZED":
      return {
        title: "We couldn't sign you in 🔐",
        message:
          "The email or password doesn't match our records.",
        action:
          "Check your details and try again.",
        type: "error",
      };


    case "USER_NOT_FOUND":
      return {
        title: "No account found 👋",
        message:
          "We couldn't find a Locoomo account with those details.",
        action:
          "Check your email or create a new account.",
        type: "warning",
      };


    case "ACCOUNT_DISABLED":
      return {
        title: "Your account needs attention ⚠️",
        message:
          "This account is currently unavailable.",
        action:
          "Contact Locoomo support and we'll help you get moving.",
        type: "error",
      };


    case "EMAIL_ALREADY_REGISTERED":
      return {
        title: "You're already registered 🎉",
        message:
          "An account with this email already exists.",
        action:
          "Try logging in instead.",
        type: "warning",
      };


    case "INVALID_OTP":
      return {
        title: "That code didn't work 🔢",
        message:
          "The verification code is incorrect or has expired.",
        action:
          "Request a new code and try again.",
        type: "error",
      };


    case "NETWORK_ERROR":
      return {
        title:
          "Your connection took a wrong turn 📍",
        message:
          "We couldn't reach Locoomo right now.",
        action:
          "Check your internet connection and try again.",
        type: "error",
      };


    case "SERVER_ERROR":
    case "INTERNAL_SERVER_ERROR":
      return {
        title:
          "Locoomo is getting things ready ⚙️",
        message:
          "We're temporarily unable to complete your request.",
        action:
          "Please try again shortly.",
        type: "error",
      };


    default:
      return {
        title:
          "We hit a small delay 🚧",
        message:
          "We couldn't complete your request right now.",
        action:
          "Please try again in a moment.",
        type: "error",
      };
  }
}
