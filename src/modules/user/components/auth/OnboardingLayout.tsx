"use client";

import * as React from "react";
import { Package, ShieldCheck, Clock, Truck, MapPin } from "lucide-react";
import { LogoMark } from "@/components/icons";

interface OnboardingFeature {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}

const DEFAULT_FEATURES: OnboardingFeature[] = [
  { icon: Package, label: "Real-time parcel tracking" },
  { icon: ShieldCheck, label: "Verified riders & nodes" },
  { icon: Clock, label: "Fast, reliable handoffs" },
];

interface OnboardingLayoutProps {
  title: string;
  subtitle: string;
  features?: OnboardingFeature[];
  children: React.ReactNode;
}

/**
 * Shared split-screen shell for the public onboarding routes (login,
 * role-select, create-account): a decorative animated logistics scene
 * + copy on the left (hidden below `lg`), the actual form on the right.
 */
export function OnboardingLayout({
  title,
  subtitle,
  features = DEFAULT_FEATURES,
  children,
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen flex bg-bg-canvas">
      <aside className="hidden lg:flex lg:w-[45%] xl:w-[42%] shrink-0 relative flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-navy to-brand-blue-dark px-10 py-10 text-white">
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-brand-blue-light/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-2.5">
          <LogoMark size={30} />
          <span className="font-display font-bold text-[15px] tracking-tight">
            LOCOOMO
          </span>
        </div>

        <LogisticsScene />

        <div className="relative">
          <h2 className="font-display text-[26px] font-bold leading-tight mb-3 max-w-[380px]">
            {title}
          </h2>
          <p className="text-[14px] text-white/70 leading-relaxed max-w-[360px] mb-8">
            {subtitle}
          </p>
          <div className="flex flex-col gap-3">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center shrink-0">
                  <Icon size={17} className="text-white" />
                </span>
                <span className="text-[13px] text-white/85">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center gap-2 pt-8 px-6">
          <LogoMark size={28} />
          <span className="font-display font-bold text-[15px] text-text-primary tracking-tight">
            LOCOOMO
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 lg:py-10">
          <div className="w-full max-w-105">{children}</div>
        </div>
      </main>
    </div>
  );
}

/** Decorative animated road / truck / packages scene — purely visual. */
function LogisticsScene() {
  return (
    <div className="relative h-[180px] w-full my-6" aria-hidden="true">
      <div className="absolute bottom-9 left-0 right-0 border-t-2 border-dashed border-white/20" />

      <div className="absolute left-0 bottom-6 animate-locoomo-drive">
        <div className="w-11 h-11 rounded-[12px] bg-white/12 backdrop-blur-sm flex items-center justify-center">
          <Truck size={22} className="text-white" />
        </div>
      </div>

      <span className="absolute bottom-[34px] left-0 w-2 h-2 rounded-full bg-white/40" />

      <div className="absolute bottom-5 right-1">
        <span className="absolute inset-0 rounded-full bg-brand-blue-light/50 animate-locoomo-pulse" />
        <span className="relative flex w-9 h-9 rounded-full bg-brand-blue-light/90 items-center justify-center">
          <MapPin size={16} className="text-white" />
        </span>
      </div>

      <Package
        size={18}
        className="absolute top-2 left-8 text-white/25 animate-locoomo-float"
        style={{ animationDelay: "0s" }}
      />
      <Package
        size={14}
        className="absolute top-10 left-1/2 text-white/20 animate-locoomo-float"
        style={{ animationDelay: "0.9s" }}
      />
      <Package
        size={16}
        className="absolute top-0 right-14 text-white/25 animate-locoomo-float"
        style={{ animationDelay: "1.6s" }}
      />
    </div>
  );
}
