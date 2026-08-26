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


    case "UNAUTHENTICATED":
      return {
        title: "You've been signed out 🔒",
        message:
          "Your session has expired or is no longer valid.",
        action:
          "Please log in again to continue.",
        type: "error",
      };


    case "FORBIDDEN":
      return {
        title: "You don't have access 🚫",
        message:
          "Your account doesn't have permission to do this.",
        action:
          "Contact Locoomo support if you think this is a mistake.",
        type: "error",
      };


    case "ACCOUNT_SUSPENDED":
      return {
        title: "Your account is suspended ⛔",
        message:
          "Your password was correct, but this account has been suspended.",
        action:
          "Contact Locoomo support for help restoring access.",
        type: "error",
      };


    case "RIDER_ALREADY_ONBOARDED":
    case "NODE_OPERATOR_ALREADY_ONBOARDED":
      return {
        title: "Already submitted ✅",
        message:
          "You've already completed this step — it's either awaiting approval or already active.",
        action:
          "Check your approval status below.",
        type: "warning",
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


    case "INVALID_RESET_TOKEN":
      return {
        title: "This reset link expired 🔗",
        message:
          "Your password reset link is invalid, expired, or has already been used.",
        action:
          "Request a new link and try again.",
        type: "error",
      };


    case "INVALID_VERIFICATION_DOCUMENT":
      return {
        title: "That document didn't upload correctly 📄",
        message:
          "We couldn't confirm your verification document upload.",
        action:
          "Try uploading it again.",
        type: "error",
      };


    case "INVALID_INVITE_TOKEN":
      return {
        title: "This invite link expired 🔗",
        message:
          "Your invite link is invalid, expired, or has already been used.",
        action:
          "Contact whoever invited you for a new one.",
        type: "error",
      };


    case "NODE_CAPACITY_UNAVAILABLE":
      return {
        title: "That drop-off point just filled up 📦",
        message:
          "The pickup station you chose reached capacity while you were checking out.",
        action:
          "Go back and choose a different pickup station.",
        type: "warning",
      };


    case "PRICING_NOT_CONFIGURED":
      return {
        title: "Orders are temporarily unavailable ⏸️",
        message:
          "We can't calculate a delivery fee right now.",
        action:
          "Please try again shortly.",
        type: "error",
      };


    case "BANK_ACCOUNT_VERIFICATION_FAILED":
      return {
        title: "We couldn't verify that account 🏦",
        message:
          "That account number doesn't match the bank you selected. Nothing was saved.",
        action:
          "Double-check the account number and bank, then try again.",
        type: "error",
      };


    case "PAYMENT_PROVIDER_ERROR":
      return {
        title: "Payment couldn't start 💳",
        message:
          "Our payment provider didn't respond. No charge was made.",
        action:
          "Please try again in a moment.",
        type: "error",
      };


    // ── Handoffs module (docs/API.md, 2026-08-14) ────────────────

    case "RIDER_NOT_ACTIVE":
      return {
        title: "Your rider account isn't active yet ⏳",
        message:
          "Your verification is still being reviewed, so you can't take jobs just yet.",
        action:
          "Check your verification status — we'll let you know as soon as you're approved.",
        type: "warning",
      };


    case "RIDER_CAPACITY_UNAVAILABLE":
      return {
        title: "You're at your limit 📦",
        message:
          "You can carry up to 3 deliveries at once, and you're already at 3.",
        action:
          "Drop one off, then come back for this job.",
        type: "warning",
      };


    // Stale client state, or someone else advanced the order first
    // (e.g. another rider won the race to accept it). Per docs/API.md
    // the fix is to re-fetch and re-render, never to retry blindly —
    // so the copy sends the user back to a fresh list rather than
    // offering a "try again" that would fail identically.
    case "ILLEGAL_ORDER_TRANSITION":
      return {
        title: "This one moved on without you 🔄",
        message:
          "Someone already handled this parcel, or it isn't at this step yet.",
        action:
          "Refresh to see where it actually is now.",
        type: "warning",
      };


    // Deliberately identical for wrong / expired / already-used /
    // locked-out, per docs/API.md — the copy must not hint at which,
    // and the rider needs a fresh code in every one of those cases.
    case "INVALID_HANDOFF_CODE":
      return {
        title: "That code didn't work 🔢",
        message:
          "It's incorrect, expired, or already been used.",
        action:
          "Ask the rider to request a new code, then try again.",
        type: "error",
      };


    // Intake hasn't run yet (so no collection code has ever been
    // minted), or the order is already `completed`. Both mean "there's
    // nothing to resend," and the operator's next move differs, so the
    // copy points at the step rather than the error.
    case "ORDER_NOT_READY_FOR_COLLECTION":
      return {
        title: "This parcel isn't ready yet 📦",
        message:
          "It hasn't been checked in at your counter, or it's already been collected.",
        action:
          "Confirm intake first — that's what emails the receiver their code.",
        type: "warning",
      };


    case "RATE_LIMITED":
      return {
        title: "Slow down a moment ⏳",
        message:
          "You've made too many attempts in a short time.",
        action:
          "Please wait a little while and try again.",
        type: "warning",
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
    case "INTERNAL_ERROR":
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
