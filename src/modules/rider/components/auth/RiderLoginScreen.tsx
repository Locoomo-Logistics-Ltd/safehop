"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { LogoMark } from "@/components/icons";
import { LockIcon } from "@/components/icons";
import { useRiderLogin } from "@/modules/rider/hooks/use-rider-login";
import { getErrorMessage } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";

/**
 * "Welcome Back, Rider" — phone number, then password, matching the
 * Figma login screen's two-step feel.
 *
 * NOTE: the real API's rider login is password-based — there's no OTP
 * endpoint. This keeps the original two-screen flow (enter phone →
 * second screen) as a thin UX wrapper, but the second screen is a
 * real password field rather than a 6-digit OTP code.
 */
export function RiderLoginScreen() {
  const router = useRouter();
  const [phoneInput, setPhoneInput] = useState("");
  const [password, setPassword] = useState("");

  const { continueWithPhone, hasEnteredPhone, phone, login, isLoggingIn, loginError } =
    useRiderLogin();

  const handleContinue = () => {
    continueWithPhone(`+234${phoneInput.replace(/\D/g, "")}`);
  };

  const handleLogin = () => {
    login(password);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-canvas px-6 py-12">
      <div className="max-w-[380px] w-full mx-auto flex flex-col flex-1">
        <div className="flex flex-col items-center mb-10">
          <LogoMark size={36} />
          <span className="mt-2 font-display font-bold text-[15px] text-text-primary tracking-tight">
            LOCOOMO
          </span>
        </div>

        {!hasEnteredPhone ? (
          <>
            <h1 className="font-display text-[20px] font-bold text-text-primary text-center mb-1.5">
              Welcome Back, Rider.
            </h1>
            <p className="text-[13px] text-text-secondary text-center mb-8">
              Enter your registered mobile number to securely log in to your dashboard.
            </p>

            <Input
              label="Mobile Number"
              type="tel"
              placeholder="802 000 0000"
              leftElement={<span className="text-[14px] font-medium text-text-secondary">+234</span>}
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
            />

            <Button
              fullWidth
              size="lg"
              className="mt-6"
              disabled={phoneInput.length < 10}
              onClick={handleContinue}
            >
              Continue →
            </Button>
          </>
        ) : (
          <>
            <h1 className="font-display text-[20px] font-bold text-text-primary text-center mb-1.5">
              Enter your password
            </h1>
            <p className="text-[13px] text-text-secondary text-center mb-8">
              Logging in as +234{phone.replace("+234", "")}
            </p>

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••"
              leftElement={<LockIcon size={16} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              error={loginError ? getErrorMessage(loginError) : undefined}
            />

            <Button
              fullWidth
              size="lg"
              className="mt-6"
              disabled={password.length === 0}
              isLoading={isLoggingIn}
              onClick={handleLogin}
            >
              Login →
            </Button>
          </>
        )}

        <button
          onClick={() => router.push(ROUTES.roleSelect)}
          className="text-center text-[12px] text-text-muted mt-8"
        >
          ← Back to role selection
        </button>
      </div>
    </div>
  );
}
