"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons";
import { ChevronRightIcon } from "lucide-react";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  className?: string;
  /** Hidden on desktop by default since Sidebar carries the brand mark there. */
  hideOnDesktop?: boolean;
}

/**
 * Mobile-first top app bar. Used on every screen below the dashboard
 * root for back navigation + screen title, matching the Figma
 * "← Go back" pattern on each step screen.
 */
export function TopBar({
  title,
  showBack,
  onBack,
  rightSlot,
  className,
  hideOnDesktop = true,
}: TopBarProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center gap-3 px-4 bg-bg-canvas/95 backdrop-blur-sm",
        "h-[var(--top-bar-height)]",
        hideOnDesktop && "md:hidden",
        className
      )}
    >
      {showBack ? (
        <button
          onClick={onBack ?? (() => router.back())}
          aria-label="Go back"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-bg-card border border-border-default text-text-primary -ml-1.5"
        >
          <ChevronLeftIcon size={20} />
        </button>
      ) : (
        <button
          aria-label="Go front"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-bg-card border border-border-default text-text-primary -ml-1.5"
        >
          <ChevronRightIcon size={20} />
        </button>
      )}

      {title && (
        <h1 className="flex-1 text-[16px] font-semibold text-text-primary truncate">{title}</h1>
      )}

      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </header>
  );
}
