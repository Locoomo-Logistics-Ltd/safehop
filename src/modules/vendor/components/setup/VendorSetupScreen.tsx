"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { LogoMark, MailIcon, LockIcon } from "@/components/icons";
import { useVendorLogin } from "@/modules/vendor/hooks/use-vendor-login";
import { getErrorMessage } from "@/core/api/errors";

/**
 * Vendor (Shop Owner) account access — email + password login, with
 * an automatic first-login-reset step if the account is still on its
 * admin-issued temporary password.
 *
 * Replaces the original Figma "Create your PIN" screen: the real API
 * has no PIN concept at all. Node Staff accounts are provisioned by
 * an admin (auth/node-staff/provision) with a temporary password;
 * this screen is a vendor's actual first (and every subsequent) login.
 */
export function VendorSetupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const {
    login,
    isLoggingIn,
    loginError,
    requiresReset,
    resetPassword,
    isResetting,
    resetError,
  } = useVendorLogin();

  const passwordsMatch = newPassword.length >= 8 && newPassword === confirmNewPassword;

  return (
    <div className="min-h-screen flex flex-col bg-bg-canvas px-6 py-12">
      <div className="max-w-[380px] w-full mx-auto flex flex-col flex-1">
        <div className="flex flex-col items-center mb-10">
          <LogoMark size={36} />
          <span className="mt-2 font-display font-bold text-[15px] text-text-primary tracking-tight">
            LOCOOMO
          </span>
        </div>

        {!requiresReset ? (
          <>
            <h1 className="font-display text-[20px] font-bold text-text-primary text-center mb-1.5">
              Welcome to your Node
            </h1>
            <p className="text-[13px] text-text-secondary text-center mb-8">
              Sign in with the email and password your admin gave you.
            </p>

            <div className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@locoomo.com"
                leftElement={<MailIcon size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••••"
                leftElement={<LockIcon size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && login({ email, password })}
                error={loginError ? getErrorMessage(loginError) : undefined}
              />
            </div>

            <Button
              fullWidth
              size="lg"
              className="mt-6"
              disabled={!email.includes("@") || password.length === 0}
              isLoading={isLoggingIn}
              onClick={() => login({ email, password })}
            >
              Sign In →
            </Button>
          </>
        ) : (
          <>
            <h1 className="font-display text-[20px] font-bold text-text-primary text-center mb-1.5">
              Set a new password
            </h1>
            <p className="text-[13px] text-text-secondary text-center mb-8">
              You&apos;re using a temporary password. Choose a permanent one to secure your Node.
            </p>

            <div className="flex flex-col gap-4">
              <Input
                label="New Password"
                type="password"
                placeholder="At least 8 characters"
                leftElement={<LockIcon size={16} />}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••••"
                leftElement={<LockIcon size={16} />}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                error={
                  confirmNewPassword && newPassword !== confirmNewPassword
                    ? "Passwords don't match"
                    : resetError
                      ? getErrorMessage(resetError)
                      : undefined
                }
              />
            </div>

            <Button
              fullWidth
              size="lg"
              className="mt-6"
              disabled={!passwordsMatch}
              isLoading={isResetting}
              onClick={() => resetPassword(newPassword)}
            >
              Set Password &amp; Continue →
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
