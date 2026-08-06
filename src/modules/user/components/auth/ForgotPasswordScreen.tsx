"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { useAuth } from "../../hooks/use-auth";


export function ForgotPasswordScreen() {



  const auth = useAuth();



const { 
  requestPasswordReset,
  isRequestingReset, 
  requestResetError,
  isResetRequestSuccessful 
} = auth;
  


  const [email, setEmail] = useState("");



const handleRequestReset = () => {
  console.log("RESET CLICKED", email);

  requestPasswordReset(
    { email },
    {
      onSuccess: () => {
        console.log("RESET SUCCESS");
      },
      onError: (error) => {
        console.error("RESET ERROR", error);
      },
    }
  );
};

  if (isResetRequestSuccessful) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-canvas">
        <div className="flex-1 px-6 py-10 max-w-105 w-full mx-auto text-center mt-10">
          <span className="text-[40px] mb-4 block" aria-hidden="true">✉️</span>
          <h1 className="font-display text-[22px] font-bold text-text-primary mb-2">Check your email</h1>
          <p className="text-[14px] text-text-secondary mb-6 leading-relaxed">
            If <strong>{email}</strong> is registered, we&apos;ve sent a password reset link. 
            Please check your inbox.
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
          <h1 className="font-display text-[22px] font-bold text-text-primary">Reset Password</h1>
        </div>
        <p className="text-[14px] text-text-secondary mb-6">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        <div className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="johndoe@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && email && handleRequestReset()}
          />

          {requestResetError && (() => {
            const error = getFriendlyError(requestResetError);
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
          disabled={!email}
          isLoading={isRequestingReset}
          onClick={handleRequestReset}
        >
          Send Reset Link
        </Button>

        <p className="text-center text-[13px] text-text-secoandary mt-5">
          Remember your password?{" "}
          <Link href={ROUTES.login} className="text-brand-blue font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}