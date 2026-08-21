"use client";

import Link from "next/link";
import { LogoMark, UserIcon } from "@/components/icons";
import { useCurrentUser } from "@/store/auth.store";

interface RootTopBarProps {
  /** Where tapping the profile button navigates — each role's own Profile screen. */
  profileHref: string;
  /**
   * Admin already renders its own persistent, themed desktop bar
   * (`AdminTopBar`, mounted once in `AdminShell`) — pass this so the
   * mobile-only row here doesn't duplicate it there.
   */
  hideOnDesktop?: boolean;
}

/**
 * The bar for every role's root/tab screens (Home, Track, Activity,
 * Jobs, Active, Earnings, and Admin's nine Sidebar tabs) — logo on the
 * left (mobile only; the desktop `Sidebar` already carries the brand
 * mark there), a Profile button on the right that's now the *only* way
 * to reach the Profile screen, since "Profile" was removed from every
 * role's `Sidebar`/`BottomNav` nav-items list (2026-08-21). Sub-screens
 * (detail pages, forms, Profile itself) are unaffected — they keep the
 * existing back-button `TopBar`.
 */
export function RootTopBar({ profileHref, hideOnDesktop = false }: RootTopBarProps) {
  const user = useCurrentUser();

  return (
    <header
      className={
        "sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6 h-(--top-bar-height) " +
        "bg-bg-canvas/95 backdrop-blur-sm md:bg-bg-card md:border-b md:border-border-default" +
        (hideOnDesktop ? " md:hidden" : "")
      }
    >
      <div className="flex items-center gap-2 md:hidden">
        <LogoMark size={24} />
        <span className="font-display font-bold text-[15px] text-text-primary tracking-tight">
          LOCOOMO
        </span>
      </div>

      <Link
        href={profileHref}
        aria-label="Profile"
        className="ml-auto w-9 h-9 rounded-full bg-status-info-bg text-brand-blue flex items-center justify-center font-semibold text-[13px] shrink-0"
      >
        {user ? (
          `${user.firstName[0]}${user.lastName[0]}`
        ) : (
          <UserIcon size={16} />
        )}
      </Link>
    </header>
  );
}
