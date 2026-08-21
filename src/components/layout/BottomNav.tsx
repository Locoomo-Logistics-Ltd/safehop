"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DotsIcon } from "@/components/icons";
import { USER_NAV_ITEMS, type NavItem } from "./nav-config";

interface BottomNavProps {
  items?: NavItem[];
  /**
   * Destinations that don't have their own tab slot but should still be
   * reachable on mobile — e.g. Admin's "Settings", pinned separately in
   * `AdminSidebar` rather than living in `ADMIN_NAV_ITEMS`. Folded into
   * the "More" sheet alongside any overflow from `items` itself.
   */
  moreItems?: NavItem[];
}

/** Beyond this many tabs, a bottom bar stops being scannable at a glance — the rest go behind "More". */
const MAX_VISIBLE_TABS = 4;

/**
 * Bottom tab bar — visible only below the `md` breakpoint. On desktop
 * the Sidebar takes over navigation duties (see Sidebar.tsx).
 * Accepts `items` so each role (User, Node Operator, Rider, ...) can supply its own
 * nav set while sharing this exact rendering logic.
 *
 * When `items` (plus any `moreItems`) add up to more than
 * `MAX_VISIBLE_TABS`, the last visible slot becomes a "More" tab that
 * opens a pull-up sheet listing everything that didn't fit — Admin's
 * nine `ADMIN_NAV_ITEMS` (plus its pinned Settings item) is the one
 * role that needs this today; every other role's list still fits
 * within four tabs and renders exactly as before.
 */
export function BottomNav({ items = USER_NAV_ITEMS, moreItems = [] }: BottomNavProps) {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isOverflowing = items.length > MAX_VISIBLE_TABS;
  const visibleItems = isOverflowing ? items.slice(0, MAX_VISIBLE_TABS - 1) : items;
  const overflowItems = isOverflowing ? items.slice(MAX_VISIBLE_TABS - 1) : [];
  const sheetItems = [...overflowItems, ...moreItems];
  const hasMore = sheetItems.length > 0;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isMoreActive = sheetItems.some((item) => isActive(item.href));

  return (
    <>
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
          {visibleItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative"
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  size={22}
                  filled={active}
                  className={active ? "text-brand-blue" : "text-text-muted"}
                />
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    active ? "text-brand-blue" : "text-text-muted"
                  )}
                >
                  {item.label}
                </span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-brand-blue rounded-full" />
                )}
              </Link>
            );
          })}

          {hasMore && (
            <button
              type="button"
              onClick={() => setShowMore(true)}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative"
              aria-haspopup="dialog"
              aria-expanded={showMore}
            >
              <DotsIcon
                size={22}
                className={isMoreActive ? "text-brand-blue" : "text-text-muted"}
              />
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isMoreActive ? "text-brand-blue" : "text-text-muted"
                )}
              >
                More
              </span>
              {isMoreActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-brand-blue rounded-full" />
              )}
            </button>
          )}
        </div>
      </nav>

      {hasMore && showMore && (
        <MoreNavSheet items={sheetItems} onClose={() => setShowMore(false)} isActive={isActive} />
      )}
    </>
  );
}

interface MoreNavSheetProps {
  items: NavItem[];
  isActive: (href: string) => boolean;
  onClose: () => void;
}

/** Pull-up sheet for whatever didn't fit in the bottom bar's 4 visible slots. Same overlay/handle pattern as `VerificationReminderSheet`. */
function MoreNavSheet({ items, isActive, onClose }: MoreNavSheetProps) {
  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-label="More navigation">
      <button className="absolute inset-0 bg-black/50" aria-label="Dismiss" onClick={onClose} />

      <div
        className="relative bg-bg-card rounded-t-[24px] pt-3 max-w-[480px] w-full mx-auto"
        style={{ paddingBottom: "calc(1.5rem + var(--safe-bottom))" }}
      >
        <div className="w-10 h-1 rounded-full bg-border-strong mx-auto mb-4" />

        <div className="flex flex-col px-2">
          {items.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 h-12 rounded-[10px] text-[14px] font-medium transition-colors",
                  active ? "bg-status-info-bg text-brand-blue" : "text-text-secondary hover:bg-bg-subtle"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={19} filled={active} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
