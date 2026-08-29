"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { useAuthStore } from "@/store/auth.store";
import { useCompleteProfile } from "@/modules/user/hooks/use-complete-profile";
import { formatNigerianPhone, isValidPhone } from "@/lib/phone";
import { OnboardingLayout } from "./OnboardingLayout";

/**
 * Shown right after any successful login (password or Google) whose
 * account has no `phone` yet — `POST /auth/register`/`POST /auth/google`
 * both start every account at `phone: null` per docs/API.md. The one
 * job here is `PATCH /users/me`, then continue into the same
 * role-based destination login would otherwise have used
 * (`resolvePostAuthRoute`, shared with `use-auth.ts`).
 */
export function CompleteProfileScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const { completeProfile, isCompletingProfile, completeProfileError } = useCompleteProfile();
  const [phone, setPhone] = useState("");

  // Only reachable right after a login/signup already put a session in
  // the store — no session (direct navigation, expired session) sends
  // the person back to log in rather than rendering a dead-end form.
  useEffect(() => {
    if (isInitializing) return;
    if (!session) router.replace(ROUTES.login);
  }, [isInitializing, session, router]);

  if (isInitializing || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  const formatted = formatNigerianPhone(phone);
  const isValid = isValidPhone(formatted);

  const handleSubmit = () => {
    if (!isValid) return;
    completeProfile({ phone: formatted });
  };

  return (
    <OnboardingLayout
      title="One last thing"
      subtitle="We use your phone number to keep deliveries moving — riders and pickup stations may need to reach you."
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="w-9 h-9 rounded-[10px] bg-status-info-bg flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <Phone size={17} className="text-brand-blue" />
        </span>
        <h1 className="font-display text-[22px] font-bold text-text-primary">Complete your profile</h1>
      </div>
      <p className="text-[14px] text-text-secondary mb-7">
        Add your phone number to finish setting up your Locoomo account.
      </p>

      <div className="flex flex-col gap-4">
        <Input
          label="Phone Number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="08173456789"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />

        {completeProfileError && (() => {
          const error = getFriendlyError(completeProfileError);
          return <ErrorAlert title={error.title} message={error.message} action={error.action} />;
        })()}
      </div>

      <Button
        fullWidth
        size="lg"
        className="mt-6"
        disabled={!isValid}
        isLoading={isCompletingProfile}
        onClick={handleSubmit}
      >
        Continue
      </Button>
    </OnboardingLayout>
  );
}
