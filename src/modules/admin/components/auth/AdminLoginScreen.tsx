"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { Eye, EyeOff, ShieldCheck, Users, BarChart3, SlidersHorizontal } from "lucide-react";
import { LogoMark } from "@/components/icons";
import { useAdminAuth } from "@/modules/admin/hooks/use-admin-auth";
import { getFriendlyError } from "@/core/api/errors";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ROUTES } from "@/core/config/constants";

const CAPABILITIES = [
  { icon: Users, label: "Approve riders & node operators" },
  { icon: SlidersHorizontal, label: "Configure pricing & revenue split" },
  { icon: BarChart3, label: "Monitor the network in real time" },
];

/**
 * Admin's own login screen — a separate URL (`/admin-login`), not
 * reachable from `/role-select`. Admin accounts are provisioned by an
 * existing Admin (backend invite flow), never self-registered, so
 * this screen is login-only, no "sign up" link. Same split-screen
 * shell pattern as the Consumer/Rider/NodeOperator `OnboardingLayout`
 * (branded panel + form), re-themed to Admin's own dark-navy/orange
 * identity (`bg-brand-navy` + `--admin-accent`, same pairing
 * `AdminSidebar` already uses) rather than reusing that component
 * directly — Admin's visual language is deliberately distinct from
 * every other role's, per `docs/DECISIONS.md`.
 */
export function AdminLoginScreen() {
  const { login, isLoggingIn, loginError } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    login({ email, password });
  };

  return (
    <div className="min-h-screen flex bg-bg-canvas">
      <aside className="hidden lg:flex lg:w-[45%] xl:w-[42%] shrink-0 relative flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-navy to-[#001A4D] px-10 py-10 text-white">
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-admin-accent/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-2.5">
          <LogoMark size={30} />
          <span className="font-display font-bold text-[15px] tracking-tight">LOCOOMO</span>
          <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-admin-accent bg-admin-accent/15 px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>

        <AdminScene />

        <div className="relative">
          <h2 className="font-display text-[26px] font-bold leading-tight mb-3 max-w-[380px]">
            Run the Locoomo network
          </h2>
          <p className="text-[14px] text-white/70 leading-relaxed max-w-[360px] mb-8">
            Approve riders and nodes, configure pricing and payouts, and keep every delivery
            moving — all from one control center.
          </p>
          <div className="flex flex-col gap-3">
            {CAPABILITIES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center shrink-0">
                  <Icon size={17} className="text-admin-accent" />
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
          <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-admin-accent bg-admin-accent-bg px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 lg:py-10">
          <div className="w-full max-w-105">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-9 h-9 rounded-[10px] bg-admin-accent-bg flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <ShieldCheck size={17} className="text-admin-accent" />
              </span>
              <h1 className="font-display text-[22px] font-bold text-text-primary">Admin log in</h1>
            </div>
            <p className="text-[14px] text-text-secondary mb-6">
              Sign in with your admin credentials to access the control center.
            </p>

            <div className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="admin@locoomo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-10.5 text-text-secondary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <p className="text-end text-[13px] text-text-secondary -mt-1">
                <Link href={ROUTES.forgotPassword} className="text-admin-accent font-semibold">
                  Forgot Password
                </Link>
              </p>

              {loginError &&
                (() => {
                  const error = getFriendlyError(loginError);
                  return <ErrorAlert title={error.title} message={error.message} action={error.action} />;
                })()}
            </div>

            <Button
              fullWidth
              size="lg"
              className="mt-6 bg-admin-accent hover:bg-admin-accent-dark focus-visible:ring-admin-accent"
              disabled={!email || !password}
              isLoading={isLoggingIn}
              onClick={handleLogin}
            >
              Log in
            </Button>

            <p className="text-center text-[12px] text-text-muted mt-6">
              Admin accounts are provisioned by another admin — contact yours if you need access.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Decorative animated console scene — purely visual, mirrors OnboardingLayout's LogisticsScene but themed to Admin's dark-navy/orange identity and admin-shaped icons instead of delivery ones. */
function AdminScene() {
  return (
    <div className="relative h-[180px] w-full my-6" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-9 border-t-2 border-dashed border-white/20" />

      <div className="absolute left-1/2 -translate-x-1/2 bottom-2">
        <span className="absolute inset-0 rounded-full bg-admin-accent/50 animate-locoomo-pulse" />
        <span className="relative flex w-11 h-11 rounded-full bg-admin-accent items-center justify-center">
          <ShieldCheck size={20} className="text-white" />
        </span>
      </div>

      <div
        className="absolute top-2 left-4 w-9 h-9 rounded-[10px] bg-white/12 backdrop-blur-sm flex items-center justify-center animate-locoomo-float"
        style={{ animationDelay: "0s" }}
      >
        <Users size={16} className="text-white" />
      </div>
      <div
        className="absolute top-8 right-8 w-9 h-9 rounded-[10px] bg-white/12 backdrop-blur-sm flex items-center justify-center animate-locoomo-float"
        style={{ animationDelay: "0.9s" }}
      >
        <BarChart3 size={16} className="text-white" />
      </div>
      <div
        className="absolute bottom-16 right-1/3 w-9 h-9 rounded-[10px] bg-white/12 backdrop-blur-sm flex items-center justify-center animate-locoomo-float"
        style={{ animationDelay: "1.6s" }}
      >
        <SlidersHorizontal size={16} className="text-white" />
      </div>
    </div>
  );
}
