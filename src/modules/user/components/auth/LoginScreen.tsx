"use client";

import { useState } from "react";
import Link from "next/link";
// import { Button, Input, OtpInputBoxes } from "@/components/ui";
import { Button, Input } from "@/components/ui";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/modules/user/hooks/use-auth";
import { getFriendlyError, isApiError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { ErrorAlert } from "@/components/ui/error-alert";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { OnboardingLayout } from "./OnboardingLayout";
// import { useSearchParams } from "next/navigation";

// type LoginMethod = "password" | "otp";
// const OTP_LENGTH = 6;

/**
 * "Log in" — real API's LoginConsumerDto accepts EITHER a password OR
 * an OTP code, since registration made the password optional. This
 * screen lets the person pick whichever they set up.
 */
export function LoginScreen() {
  const {
    login,
    isLoggingIn,
    loginError,
    loginWithGoogle,
    isLoggingInWithGoogle,
    loginWithGoogleError,
  } = useAuth();


  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);



  const handleLogin = () => {
  login({
    email,
    password,
  });
};

  // Login context, not signup — no role, no consent. Per docs/API.md
  // this is only valid for an already-linked Google account; a
  // first-time Google identity comes back 400 CONSENT_REQUIRED, which
  // getFriendlyError below points back at signing up instead.
  const handleGoogleCredential = (idToken: string) => {
    loginWithGoogle({ idToken });
  };








  return (
    <OnboardingLayout
      title="Welcome back to Locoomo"
      subtitle="Track parcels, manage deliveries, and stay connected across every node in the network."
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="w-9 h-9 rounded-[10px] bg-status-info-bg flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <LogIn size={17} className="text-brand-blue" />
          </span>
          <h1 className="font-display text-[22px] font-bold text-text-primary">Log in</h1>
        </div>
        <p className="text-[14px] text-text-secondary mb-6">Enter your login details</p>

        <div className="flex flex-col gap-3 mb-5">
          <GoogleAuthButton
            text="signin_with"
            disabled={isLoggingInWithGoogle}
            onCredential={handleGoogleCredential}
          />
          {isLoggingInWithGoogle && (
            <p className="flex items-center justify-center gap-2 text-[13px] text-text-secondary">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
              Signing you in with Google…
            </p>
          )}
          {loginWithGoogleError && (() => {
            const isNoAccount =
              isApiError(loginWithGoogleError) && loginWithGoogleError.code === "CONSENT_REQUIRED";
            const error = getFriendlyError(loginWithGoogleError);
            return (
              <>
                <ErrorAlert
                  title={error.title}
                  message={error.message}
                  action={isNoAccount ? undefined : error.action}
                />
                {isNoAccount && (
                  <p className="text-center text-[13px] text-text-secondary">
                    <Link href={ROUTES.roleSelect} className="text-brand-blue font-semibold">
                      Sign up with Google instead
                    </Link>
                  </p>
                )}
              </>
            );
          })()}
        </div>

        <div className="flex items-center gap-3 mb-5" aria-hidden="true">
          <span className="h-px flex-1 bg-border-default" />
          <span className="text-[12px] text-text-muted">or continue with email</span>
          <span className="h-px flex-1 bg-border-default" />
        </div>

        <div className="flex flex-col gap-4">

          <Input
  label="Email"
  type="email"
  placeholder="johndoe@gmail.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
<div className="relative">
  <Input
    label="Password"
    type={showPassword ? "text" : "password"}
    placeholder="••••••••"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-4 top-10.5 text-text-secondary"
  >
    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>

<p className="text-end text-[13px] text-text-secondary mt-5">
  <a href={ROUTES.forgotPassword} className="text-brand-blue font-semibold">
    Forgot Password
  </a>
</p>

         

{loginError && (()=>{

const error = getFriendlyError(loginError);

return (
<ErrorAlert
 title={error.title}
 message={error.message}
 action={error.action}
/>
)

})()}
        </div>


        <Button
  fullWidth
  size="lg"
  className="mt-6"
  disabled={!email || !password}
  isLoading={isLoggingIn}
  onClick={handleLogin}
>
  Login
</Button>


        <p className="text-center text-[13px] text-text-secondary mt-5">
          Don&apos;t have an account?{" "}
          <Link href={ROUTES.roleSelect} className="text-brand-blue font-semibold">
            Sign up
          </Link>
        </p>

      </div>
    </OnboardingLayout>
  );
}
