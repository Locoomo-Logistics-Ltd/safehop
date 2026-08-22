"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { getFriendlyError, isApiError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/use-auth";

/**
 * "Set Password" — the confirm half of the Admin invite flow. The
 * invitee lands here from the emailed link, which carries a `token`
 * query param (see `POST /users/invite` in docs/API.md). They choose
 * a password (12–128 chars, no composition rules) and accept the
 * Terms/Privacy Policy — the inviting Admin can't accept those on the
 * invitee's behalf, so it's captured here instead of at invite time.
 * On success the account is activated and can log in immediately.
 */
export function AcceptInviteScreen() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const {
    confirmInvite,
    isConfirmingInvite,
    confirmInviteError,
    isInviteConfirmed,
  } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordChecks = {
    length: password.length >= 12 && password.length <= 128,
    match:
      password === confirmPassword && confirmPassword.length === password.length,
  };

  const isPasswordValid = passwordChecks.length && passwordChecks.match;
  const canSubmit = isPasswordValid && consentAccepted;

  const handleAcceptInvite = () => {
    if (!token || !canSubmit) return;

    confirmInvite({
      token,
      password,
      passwordConfirmation: confirmPassword,
      consentAccepted,
    });
  };

  // ── Missing token (opened the page without the emailed link) ──
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-canvas">
        <div className="flex-1 px-6 py-10 max-w-105 w-full mx-auto text-center mt-10">
          <span className="text-[40px] mb-4 block" aria-hidden="true">🔗</span>
          <h1 className="font-display text-[22px] font-bold text-text-primary mb-2">
            Link is missing or invalid
          </h1>
          <p className="text-[14px] text-text-secondary mb-6 leading-relaxed">
            This invite link looks incomplete. Please ask whoever invited
            you to send a new one.
          </p>
          <Link href={ROUTES.login} className="block">
            <Button fullWidth size="lg" className="mt-6">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Invite confirm failed with an invalid/expired/used token ───
  const isInvalidToken =
    isApiError(confirmInviteError) &&
    confirmInviteError.code === "INVALID_INVITE_TOKEN";

  if (isInvalidToken) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-canvas">
        <div className="flex-1 px-6 py-10 max-w-105 w-full mx-auto text-center mt-10">
          <span className="text-[40px] mb-4 block" aria-hidden="true">⚠️</span>
          <h1 className="font-display text-[22px] font-bold text-text-primary mb-2">
            This invite link no longer works
          </h1>
          <p className="text-[14px] text-text-secondary mb-6 leading-relaxed">
            It&apos;s invalid, expired, or has already been used. Contact
            whoever invited you for a new link.
          </p>
          <Link href={ROUTES.login} className="block">
            <Button fullWidth size="lg" className="mt-6">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────
  if (isInviteConfirmed) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-canvas">
        <div className="flex-1 px-6 py-10 max-w-105 w-full mx-auto text-center mt-10">
          <span className="text-[40px] mb-4 block" aria-hidden="true">✅</span>
          <h1 className="font-display text-[22px] font-bold text-text-primary mb-2">
            You&apos;re all set
          </h1>
          <p className="text-[14px] text-text-secondary mb-6 leading-relaxed">
            Your account is active. Please log in with your new password.
          </p>
          <Link href={ROUTES.login} className="block">
            <Button fullWidth size="lg" className="mt-6">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-canvas">
      <div className="flex-1 px-6 py-10 max-w-105 w-full mx-auto">
        <div className="flex items-center gap-2 mb-1.5">
          <h1 className="font-display text-[22px] font-bold text-text-primary">
            Set your password
          </h1>
        </div>
        <p className="text-[14px] text-text-secondary mb-6">
          You&apos;ve been invited to Locoomo. Choose a password to
          activate your account.
        </p>

        <div className="flex flex-col gap-4">
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9.5 text-text-secondary"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && canSubmit && handleAcceptInvite()
              }
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9.5 text-text-secondary"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {password.length > 0 && (
            <div className="text-[13px] space-y-1 mt-2">
              <p
                className={
                  passwordChecks.length ? "text-green-600" : "text-status-danger"
                }
              >
                {passwordChecks.length ? "✓" : "○"} Between 12 and 128 characters
              </p>
              <p
                className={
                  passwordChecks.match ? "text-green-600" : "text-status-danger"
                }
              >
                {passwordChecks.match ? "✓" : "○"} Passwords match
              </p>
            </div>
          )}

          <label className="flex items-center text-sm gap-3 w-full">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
            />
            <span>
              I accept the{" "}
              <Link href={ROUTES.terms} target="_blank" rel="noopener noreferrer" className="text-brand-blue underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href={ROUTES.privacy} target="_blank" rel="noopener noreferrer" className="text-brand-blue underline">
                Privacy Policy
              </Link>
            </span>
          </label>

          {confirmInviteError && (() => {
            const error = getFriendlyError(confirmInviteError);
            return (
              <ErrorAlert
                title={error.title}
                message={error.message}
                action={error.action}
              />
            );
          })()}
        </div>

        <Button
          fullWidth
          size="lg"
          className="mt-6"
          disabled={!canSubmit}
          isLoading={isConfirmingInvite}
          onClick={handleAcceptInvite}
        >
          Activate Account
        </Button>

        <p className="text-center text-[13px] text-text-secondary mt-5">
          Already activated?{" "}
          <Link href={ROUTES.login} className="text-brand-blue font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
