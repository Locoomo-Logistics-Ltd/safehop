"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/icons";
import { USER_NAV_ITEMS, type NavItem } from "./nav-config";
import { useCurrentUser } from "@/store/auth.store";

interface SidebarProps {
  items?: NavItem[];
  /** Optional primary CTA shown below the logo (e.g. "New Delivery" for User). */
  primaryAction?: { label: string; href: string; icon: React.ReactNode };
}

/**
 * Fixed left sidebar — visible only at `md` breakpoint and above.
 * Accepts `items` and an optional `primaryAction` so each role (User,
 * Node Operator, Rider, ...) can supply its own nav set and CTA while sharing this
 * exact shell, keeping desktop and mobile navigation in sync.
 */
export function Sidebar({ items = USER_NAV_ITEMS, primaryAction }: SidebarProps) {
  const pathname = usePathname();
  const user = useCurrentUser();

  return (
    <aside className="hidden md:flex md:flex-col w-[260px] shrink-0 h-screen sticky top-0 border-r border-border-default bg-bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 h-[var(--top-bar-height)] border-b border-border-default">
        <LogoMark size={26} />
        <span className="font-display font-bold text-[16px] text-text-primary tracking-tight">
          LOCOOMO
        </span>
      </div>

      {/* Primary CTA */}
      {primaryAction && (
        <div className="px-4 pt-5">
          <Link
            href={primaryAction.href}
            className="flex items-center justify-center gap-2 h-11 rounded-[12px] bg-brand-blue text-white font-semibold text-[14px] transition-colors hover:bg-brand-blue-dark"
          >
            {primaryAction.icon}
            {primaryAction.label}
          </Link>
        </div>
      )}

      {/* Nav items */}
      <nav className={cn("flex-1 px-4 flex flex-col gap-1", primaryAction ? "pt-6" : "pt-5")} aria-label="Primary navigation">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 h-11 rounded-[10px] text-[14px] font-medium transition-colors",
                isActive
                  ? "bg-status-info-bg text-brand-blue"
                  : "text-text-secondary hover:bg-bg-subtle"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={19} filled={isActive} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div className="px-4 py-4 border-t border-border-default flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-status-info-bg text-brand-blue flex items-center justify-center font-semibold text-[13px] shrink-0">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-text-primary truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[12px] text-text-muted truncate">{user.email}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
