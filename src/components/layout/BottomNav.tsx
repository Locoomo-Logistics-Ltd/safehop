"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { USER_NAV_ITEMS, type NavItem } from "./nav-config";

interface BottomNavProps {
  items?: NavItem[];
}

/**
 * Bottom tab bar — visible only below the `md` breakpoint. On desktop
 * the Sidebar takes over navigation duties (see Sidebar.tsx).
 * Accepts `items` so each role (User, Vendor, ...) can supply its own
 * nav set while sharing this exact rendering logic.
 */
export function BottomNav({ items = USER_NAV_ITEMS }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-40",
        "bg-bg-card border-t border-border-default",
        "shadow-[var(--shadow-nav)]"
      )}
      style={{ paddingBottom: "var(--safe-bottom)" }}
      aria-label="Primary navigation"
    >
      <div className="flex items-stretch h-[var(--bottom-nav-height)]">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative"
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={22}
                filled={isActive}
                className={isActive ? "text-brand-blue" : "text-text-muted"}
              />
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isActive ? "text-brand-blue" : "text-text-muted"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-brand-blue rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
