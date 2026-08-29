"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ROLE_OPTIONS } from "@/modules/user/constants/roles";
import { ROUTES } from "@/core/config/constants";
import { useAuth } from "@/modules/user/hooks/use-auth";
import { getFriendlyError } from "@/core/api/errors";
import type { UserRole } from "@/core/types";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { OnboardingLayout } from "./OnboardingLayout";

/**
 * "Choose your role" screen — first step of onboarding.
 * "consumer", "node_operator", and "rider" all proceed into their
 * respective flows; "admin" is visually present (per the product's
 * full role system) but routed to a coming-soon state until that
 * module ships — Admin accounts are backend-provisioned, never
 * self-registered.
 */
export function RoleSelectScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>("consumer");
  const { loginWithGoogle, isLoggingInWithGoogle, loginWithGoogleError } = useAuth();

  const handleContinue = () => {
    // Consumer, Rider, and NodeOperator all self-register through the
    // same documented POST /auth/register, differing only in `role`
    // — so they all land on the same create-account form, just told
    // which role to submit via `?role=`.
    if (selectedRole === "consumer") {
      router.push(ROUTES.createAccount);
    } else if (selectedRole === "node_operator") {
      router.push(`${ROUTES.createAccount}?role=node_operator`);
    } else if (selectedRole === "rider") {
      router.push(`${ROUTES.createAccount}?role=rider`);
    }
    // Admin: no-op for now — the module doesn't exist yet.
  };

  // This is the signup surface — a Google sign-in from here always
  // means "create an account if one doesn't exist yet" for whichever
  // role is currently selected, so consentAccepted is always true
  // (the ToS/Privacy text right below the button is what that consent
  // refers to). Per docs/API.md both fields are simply ignored if the
  // Google account turns out to already be linked to an existing user
  // (a login, not a signup).
  const handleGoogleCredential = (idToken: string) => {
    // Unreachable in practice — the "admin" radio option is disabled,
    // so selectedRole can never actually be "admin" here. Narrows the
    // type for the call below rather than casting.
    if (selectedRole === "admin") return;
    loginWithGoogle({ idToken, role: selectedRole, consentAccepted: true });
  };

  return (
    <OnboardingLayout
      title="Join the Locoomo network"
      subtitle="Pick how you want to move with us — send parcels, deliver them, or run a pickup node."
    >
      <h1 className="font-display text-[22px] font-bold text-text-primary mb-1.5">
        Choose your role
      </h1>
      <p className="text-[14px] text-text-secondary mb-7">
        Select how you want to use Locoomo
      </p>

      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Select your role">
        {ROLE_OPTIONS.map((option) => {
          const isSelected = selectedRole === option.role;
          const isAvailable =
            option.role === "consumer" || option.role === "node_operator" || option.role === "rider";
          const Icon = option.icon;

          return (
            <button
              key={option.role}
              role="radio"
              aria-checked={isSelected}
              disabled={!isAvailable}
              onClick={() => setSelectedRole(option.role)}
              className={cn(
                "flex items-start gap-4 p-4 rounded-[16px] border-2 text-left transition-all duration-150",
                isSelected
                  ? "border-brand-blue bg-status-info-bg"
                  : "border-border-default bg-bg-card",
                !isAvailable && "opacity-50"
              )}
            >
              <span
                className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: isSelected ? "rgba(0,108,223,0.12)" : "var(--bg-subtle)" }}
                aria-hidden="true"
              >
                <Icon size={20} className={isSelected ? "text-brand-blue" : "text-text-secondary"} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[15px] text-text-primary">
                    {option.title}
                  </span>
                  {!isAvailable && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted bg-bg-subtle px-2 py-0.5 rounded-full shrink-0">
                      Soon
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-text-secondary leading-[1.5] mt-0.5">
                  {option.description}
                </p>
              </div>
              <span
                className={cn(
                  "w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center",
                  isSelected ? "border-brand-blue" : "border-border-strong"
                )}
                aria-hidden="true"
              >
                {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-brand-blue" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-7 flex flex-col gap-3">
        <GoogleAuthButton
          text="signup_with"
          disabled={isLoggingInWithGoogle}
          onCredential={handleGoogleCredential}
        />
        {isLoggingInWithGoogle && (
          <p className="flex items-center justify-center gap-2 text-[13px] text-text-secondary">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
            Signing you in with Google…
          </p>
        )}
        <p className="text-center text-[12px] text-text-muted leading-[1.5]">
          By continuing with Google, you agree to our{" "}
          <a href={ROUTES.terms} target="_blank" rel="noopener noreferrer" className="text-brand-blue underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href={ROUTES.privacy} target="_blank" rel="noopener noreferrer" className="text-brand-blue underline">
            Privacy Policy
          </a>
          .
        </p>

        {loginWithGoogleError && (() => {
          const error = getFriendlyError(loginWithGoogleError);
          return <ErrorAlert title={error.title} message={error.message} action={error.action} />;
        })()}

        <div className="flex items-center gap-3 my-1" aria-hidden="true">
          <span className="h-px flex-1 bg-border-default" />
          <span className="text-[12px] text-text-muted">or</span>
          <span className="h-px flex-1 bg-border-default" />
        </div>

        <Button
          fullWidth
          size="lg"
          variant="outline"
          leftIcon={<Mail size={17} />}
          disabled={isLoggingInWithGoogle}
          onClick={handleContinue}
        >
          Continue with Email
        </Button>
      </div>
    </OnboardingLayout>
  );
}
