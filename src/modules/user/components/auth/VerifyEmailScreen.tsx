"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Link2, CheckCircle2, AlertTriangle, Construction } from "lucide-react";
import { Button } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { getFriendlyError, isApiError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { useAuth } from "../../hooks/use-auth";

/**
 * "Verify email" — the confirm half of the verification link
 * `POST /auth/register` sends asynchronously, `{FRONTEND_URL}/verify-email?token=...`.
 * Per docs/API.md this is purely informational right now (nothing in
 * the API is gated on `emailVerifiedAt`), and there's no "resend"
 * endpoint — the link is only ever sent once, at registration. Unlike
 * `ResetPasswordScreen`/`AcceptInviteScreen` (same "lone token-bearing
 * link" family, same layout), this needs no further input from the
 * person — the token alone is enough — so the verify call fires
 * automatically on mount instead of waiting on a form submit.
 */
export function VerifyEmailScreen() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const { verifyEmail, isVerifyingEmail, verifyEmailError, isEmailVerified } = useAuth();

  // Fires once per token, even under React's dev-mode double-effect —
  // the guard is a ref, not state, so this isn't the derived-state-in-
  // effect pattern; it's a one-time "make this network call on mount"
  // effect, the case useEffect exists for.
  const firedRef = useRef(false);
  useEffect(() => {
    if (token && !firedRef.current) {
      firedRef.current = true;
      verifyEmail({ token });
    }
  }, [token, verifyEmail]);

  // ── Missing token (opened the page without the emailed link) ──
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-canvas">
        <div className="flex-1 px-6 py-10 max-w-105 w-full mx-auto text-center mt-10">
          <span className="w-14 h-14 rounded-full bg-status-warning-bg text-status-warning flex items-center justify-center mx-auto mb-4">
            <Link2 size={24} />
          </span>
          <h1 className="font-display text-[22px] font-bold text-text-primary mb-2">
            Link is missing or invalid
          </h1>
          <p className="text-[14px] text-text-secondary mb-6 leading-relaxed">
            This verification link looks incomplete. You can still use Locoomo without verifying
            your email, it&apos;s not required to log in.
          </p>
          <Link href={ROUTES.login} className="block">
            <Button fullWidth size="lg" className="mt-6">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────
  if (isEmailVerified) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-canvas">
        <div className="flex-1 px-6 py-10 max-w-105 w-full mx-auto text-center mt-10">
          <span className="w-14 h-14 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={24} />
          </span>
          <h1 className="font-display text-[22px] font-bold text-text-primary mb-2">
            Email verified
          </h1>
          <p className="text-[14px] text-text-secondary mb-6 leading-relaxed">
            Your email address has been confirmed. You&apos;re all set, this doesn&apos;t change
            anything about your account access.
          </p>
          <Link href={ROUTES.login} className="block">
            <Button fullWidth size="lg" className="mt-6">
              Continue to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Invalid, expired, or already-used token ──────────────────────
  // No "resend" endpoint exists per docs/API.md, so unlike the reset/
  // invite equivalents this points onward (Login) rather than at a
  // "request a new one" action.
  const isInvalidToken =
    isApiError(verifyEmailError) && verifyEmailError.code === "INVALID_VERIFICATION_TOKEN";

  if (isInvalidToken) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-canvas">
        <div className="flex-1 px-6 py-10 max-w-105 w-full mx-auto text-center mt-10">
          <span className="w-14 h-14 rounded-full bg-status-warning-bg text-status-warning flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} />
          </span>
          <h1 className="font-display text-[22px] font-bold text-text-primary mb-2">
            This link didn&apos;t work
          </h1>
          <p className="text-[14px] text-text-secondary mb-6 leading-relaxed">
            It&apos;s invalid, expired, or has already been used. No need to worry, verifying your
            email isn&apos;t required to use Locoomo.
          </p>
          <Link href={ROUTES.login} className="block">
            <Button fullWidth size="lg" className="mt-6">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Any other error (network/server) — genuinely retryable ────────
  if (verifyEmailError) {
    const error = getFriendlyError(verifyEmailError);
    return (
      <div className="min-h-screen flex flex-col bg-bg-canvas">
        <div className="flex-1 px-6 py-10 max-w-105 w-full mx-auto mt-10">
          <div className="text-center mb-2">
            <span className="w-14 h-14 rounded-full bg-status-warning-bg text-status-warning flex items-center justify-center mx-auto">
              <Construction size={24} />
            </span>
          </div>
          <ErrorAlert title={error.title} message={error.message} action={error.action} />
          <Button
            fullWidth
            size="lg"
            className="mt-6"
            onClick={() => verifyEmail({ token })}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ── Verifying (in-flight) ────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-canvas px-6 text-center">
      <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin mb-4" />
      <p className="text-[14px] text-text-secondary">
        {isVerifyingEmail ? "Verifying your email…" : "One moment…"}
      </p>
    </div>
  );
}
