"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { LogoMark, LogOutIcon } from "@/components/icons";
import { ADMIN_NAV_ITEMS, ADMIN_SETTINGS_NAV_ITEM } from "./nav-config";
import { useAuthStore, useCurrentUser } from "@/store/auth.store";
import { authService } from "@/core/api/services";
import { ROUTES } from "@/core/config/constants";

/**
 * Admin's left sidebar — visually distinct from `Sidebar` (dark navy
 * surface, orange active state) to match `admin_UI.png`. Kept as its
 * own component rather than adding a "theme" prop to the shared
 * `Sidebar` because the two differ in more than color: no
 * `primaryAction` CTA slot, a settings item pinned above the account
 * footer, and a different footer action (logout inline here).
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const setSession = useAuthStore((s) => s.setSession);

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      setSession(null);
      router.push(ROUTES.adminLogin);
    },
  });

  const isItemActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="hidden md:flex md:flex-col w-[260px] shrink-0 h-screen sticky top-0 bg-brand-navy text-white">
      {/* Logo */}
      <div className="flex flex-col gap-0.5 px-6 h-[var(--top-bar-height)] justify-center border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <LogoMark size={24} />
          <span className="font-display font-bold text-[16px] tracking-tight">LOCOOMO</span>
        </div>
        <span className="text-[11px] text-white/45 pl-[34px]">Admin Console</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 pt-6 flex flex-col gap-1" aria-label="Admin navigation">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = isItemActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 h-11 rounded-[10px] text-[14px] font-medium transition-colors relative",
                isActive ? "bg-white/10 text-admin-accent" : "text-white/65 hover:bg-white/5 hover:text-white"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-admin-accent" />
              )}
              <Icon size={19} filled={isActive} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Settings, pinned above the account footer */}
      <div className="px-4 pb-2">
        <Link
          href={ADMIN_SETTINGS_NAV_ITEM.href}
          className={cn(
            "flex items-center gap-3 px-3.5 h-11 rounded-[10px] text-[14px] font-medium transition-colors relative",
            isItemActive(ADMIN_SETTINGS_NAV_ITEM.href)
              ? "bg-white/10 text-admin-accent"
              : "text-white/65 hover:bg-white/5 hover:text-white"
          )}
          aria-current={isItemActive(ADMIN_SETTINGS_NAV_ITEM.href) ? "page" : undefined}
        >
          {isItemActive(ADMIN_SETTINGS_NAV_ITEM.href) && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-admin-accent" />
          )}
          <ADMIN_SETTINGS_NAV_ITEM.icon size={19} filled={isItemActive(ADMIN_SETTINGS_NAV_ITEM.href)} />
          {ADMIN_SETTINGS_NAV_ITEM.label}
        </Link>
      </div>

      {/* User footer */}
      {user && (
        <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-admin-accent-bg text-admin-accent flex items-center justify-center font-semibold text-[13px] shrink-0">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[12px] text-white/45 truncate">{user.email}</p>
          </div>
          <button
            type="button"
            aria-label="Log out"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="w-8 h-8 rounded-[9px] flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors shrink-0"
          >
            <LogOutIcon size={15} />
          </button>
        </div>
      )}
    </aside>
  );
}
