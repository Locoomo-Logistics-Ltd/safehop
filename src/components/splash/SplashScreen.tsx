"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/icons";

/** Logo finishes animating in, wordmark follows shortly after (see globals.css's animation-delay). */
const ENTRANCE_MS = 650;
/**
 * How long the fully-settled logo+wordmark hold before fading out.
 * Deliberately short (2026-08-22, trimmed from 650ms): on an installed
 * Android PWA, this component only ever mounts *after* the OS's own
 * native splash (generated from manifest.webmanifest's icon/
 * background_color) has already shown and dismissed — that's already
 * the "branded pause" moment. A long hold here stacks a second one on
 * top and reads as two splash screens back to back instead of one
 * continuous launch.
 */
const HOLD_MS = 250;
/** Must match the fade's transition-duration below. */
const EXIT_MS = 400;

/**
 * Animated launch splash — logo, then the "LOCOOMO" wordmark, then a
 * fade out to reveal the app. Mounted once in the root layout, which
 * persists across client-side navigation in the App Router, so this
 * only ever plays on an actual page load/refresh — exactly the "cold
 * launch" moment a PWA's splash should own, not something that
 * replays while navigating around inside the app.
 *
 * Deliberately reuses `--bg-canvas` (`#F7F9FC`) as the background —
 * that's also `manifest.webmanifest`'s own `background_color`, i.e.
 * what Android already paints behind the app icon before any JS runs
 * on a standalone-installed launch. Matching it here means this
 * component's fade-in is the *only* visual transition, not a jarring
 * color swap on top of one the OS already did.
 *
 * `prefers-reduced-motion` is handled globally (see globals.css) — the
 * keyframes here collapse to effectively instant for anyone who's
 * asked for reduced motion, no separate handling needed in this file.
 */
export function SplashScreen() {
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    const startExit = setTimeout(() => setIsExiting(true), ENTRANCE_MS + HOLD_MS);
    const unmount = setTimeout(() => setIsMounted(false), ENTRANCE_MS + HOLD_MS + EXIT_MS);
    return () => {
      clearTimeout(startExit);
      clearTimeout(unmount);
    };
  }, []);

  if (!isMounted) return null;

  return (
    <div
      aria-hidden="true"
      className={
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-bg-canvas " +
        "transition-opacity duration-[400ms] ease-out " +
        (isExiting ? "opacity-0 pointer-events-none" : "opacity-100")
      }
    >
      <div className="animate-splash-logo">
        <LogoMark size={72} />
      </div>
      <p className="animate-splash-wordmark font-display font-bold text-[22px] tracking-tight text-text-primary">
        LOCOOMO
      </p>
    </div>
  );
}
