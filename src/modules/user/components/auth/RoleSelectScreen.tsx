"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { LogoMark } from "@/components/icons";
import { ROLE_OPTIONS } from "@/modules/user/constants/roles";
import { ROUTES } from "@/core/config/constants";
import type { UserRole } from "@/core/types";

/**
 * "Choose your role" screen — first step of onboarding.
 * "user", "vendor", and "rider" all proceed into their respective
 * flows; "admin" is visually present (per the product's full role
 * system) but routed to a coming-soon state until that module ships.
 */
export function RoleSelectScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>("user");

  const handleContinue = () => {
    if (selectedRole === "user") {
      router.push(ROUTES.createAccount);
    } else if (selectedRole === "vendor") {
      // Vendor accounts are admin-provisioned (auth/node-staff/provision)
      // — there's no self-registration endpoint. Route straight to the
      // vendor's own email+password login/first-login-reset screen.
      router.push(ROUTES.vendorSetup);
    } else if (selectedRole === "rider") {
      // Rider has its own phone + password login (see RiderLoginScreen),
      // matching the Figma "Welcome Back, Rider" screen's shape.
      router.push(ROUTES.riderLogin);
    }
    // Admin: no-op for now — the module doesn't exist yet.
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-canvas">
      {/* Brand mark */}
      <div className="flex flex-col items-center pt-16 pb-10 px-6">
        <LogoMark size={40} />
        <span className="mt-3 font-display font-bold text-[18px] text-text-primary tracking-tight">
          LOCOOMO
        </span>
      </div>

      <div className="flex-1 px-6 max-w-[420px] w-full mx-auto">
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
              option.role === "user" || option.role === "vendor" || option.role === "rider";

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
                  className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[20px] shrink-0"
                  style={{ background: isSelected ? "rgba(0,108,223,0.12)" : "var(--bg-subtle)" }}
                  aria-hidden="true"
                >
                  {option.emoji}
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
      </div>

      <div className="px-6 pb-10 pt-6 max-w-[420px] w-full mx-auto">
        <Button fullWidth size="lg" onClick={handleContinue}>
          Continue →
        </Button>
      </div>
    </div>
  );
}
