"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/use-auth";

/**
 * "Set a new password" — the confirm half of the password-reset flow.
 * The person lands here from the emailed link, which carries a `token`
 * query param. They enter a new password (12–128 chars, no composition
 * rules) and confirm it. On success every existing session is revoked,
 * so we send them back to log in with the new password.
 */
export function ResetPasswordScreen() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const {
    confirmPasswordReset,
    isConfirmingReset,
    confirmResetError,
    isResetSuccessful,
  } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordChecks = {
    length: password.length >= 12 && password.length <= 128,
    match:
      password === confirmPassword && confirmPassword.length === password.length,
  };

  const isPasswordValid = passwordChecks.length && passwordChecks.match;

  const handleResetPassword = () => {
    if (!token || !isPasswordValid) return;

    confirmPasswordReset({
      token,
      password,
      passwordConfirmation: confirmPassword,
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
            This reset link looks incomplete. Please request a new one to
            continue.
          </p>
          <Link href={ROUTES.forgotPassword} className="block">
            <Button fullWidth size="lg" className="mt-6">
              Request a new link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────
  if (isResetSuccessful) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-canvas">
        <div className="flex-1 px-6 py-10 max-w-105 w-full mx-auto text-center mt-10">
          <span className="text-[40px] mb-4 block" aria-hidden="true">✅</span>
          <h1 className="font-display text-[22px] font-bold text-text-primary mb-2">
            Password updated
          </h1>
          <p className="text-[14px] text-text-secondary mb-6 leading-relaxed">
            Your password has been changed. For your security, you&apos;ve been
            signed out everywhere. Please log in with your new password.
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
            Set a new password
          </h1>
        </div>
        <p className="text-[14px] text-text-secondary mb-6">
          Choose a new password for your Locoomo account.
        </p>

        <div className="flex flex-col gap-4">
          <div className="relative">
            <Input
              label="New Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
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
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && isPasswordValid && handleResetPassword()
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

          {confirmResetError && (() => {
            const error = getFriendlyError(confirmResetError);
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
          disabled={!isPasswordValid}
          isLoading={isConfirmingReset}
          onClick={handleResetPassword}
        >
          Update Password
        </Button>

        <p className="text-center text-[13px] text-text-secondary mt-5">
          Remember your password?{" "}
          <Link href={ROUTES.login} className="text-brand-blue font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
