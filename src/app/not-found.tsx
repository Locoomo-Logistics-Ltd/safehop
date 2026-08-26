"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { LogoMark, PackageIcon, ChevronLeftIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { useCurrentUser } from "@/store/auth.store";
import type { UserRole } from "@/core/types";

/** Where "Go to Dashboard" sends each role — a simple static default, not the async node-operator approval check `use-auth.ts`'s login flow does; a NodeOperator landing on `nodeHome` unapproved still gets a correct waiting-for-approval view from that screen itself. */
const ROLE_HOME: Record<UserRole, string> = {
  consumer: ROUTES.dashboard,
  rider: ROUTES.riderHome,
  node_operator: ROUTES.nodeHome,
  admin: ROUTES.adminDashboard,
};

/**
 * App Router's special `not-found.tsx` — renders for any URL that
 * doesn't match a route, at any nesting level under `app/`. Rendered
 * inside the root layout (fonts, providers, the global `Notification`
 * toast) but outside every route group's own `AuthGuard`/`AppShell`,
 * since a mistyped URL can't be known to belong to any one role's
 * chrome.
 */
export default function NotFound() {
  const router = useRouter();
  const user = useCurrentUser();
  const homeHref = user ? ROLE_HOME[user.role] : ROUTES.roleSelect;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-canvas px-6 text-center">
      <div className="flex items-center gap-2 mb-8">
        <LogoMark size={28} />
        <span className="font-display font-bold text-[15px] text-text-primary tracking-tight">
          LOCOOMO
        </span>
      </div>

      <div className="relative mb-6">
        <span className="w-20 h-20 rounded-full bg-status-info-bg text-brand-blue flex items-center justify-center">
          <PackageIcon size={34} />
        </span>
        <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-status-warning-bg text-status-warning border-2 border-bg-canvas flex items-center justify-center text-[14px] font-bold">
          ?
        </span>
      </div>

      <p className="font-display text-[15px] font-bold text-brand-blue tracking-wide mb-1">404</p>
      <h1 className="font-display text-[22px] font-bold text-text-primary mb-2 max-w-[320px]">
        This route doesn&apos;t exist
      </h1>
      <p className="text-[14px] text-text-secondary mb-8 max-w-[320px] leading-relaxed">
        The page you&apos;re looking for may have been moved, renamed, or the link was mistyped.
        Let&apos;s get you back on track.
      </p>

      <div className="flex flex-col gap-2.5 w-full max-w-[280px]">
        <Link href={homeHref} className="block">
          <Button fullWidth size="lg">
            {user ? "Go to Dashboard" : "Go to Home"}
          </Button>
        </Link>
        <Button
          fullWidth
          size="lg"
          variant="ghost"
          leftIcon={<ChevronLeftIcon size={16} />}
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
}
