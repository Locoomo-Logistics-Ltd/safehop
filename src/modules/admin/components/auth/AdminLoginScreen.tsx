"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { Eye, EyeOff } from "lucide-react";
import { useAdminAuth } from "@/modules/admin/hooks/use-admin-auth";
import { getFriendlyError } from "@/core/api/errors";
import { ErrorAlert } from "@/components/ui/error-alert";

/**
 * Admin's own login screen — a separate URL (`/admin-login`), not
 * reachable from `/role-select`. Admin accounts are provisioned by an
 * existing Admin (backend invite flow), never self-registered, so
 * this screen is login-only, no "sign up" link.
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
    <div className="min-h-screen flex flex-col bg-bg-canvas">
      <div className="flex-1 px-6 py-10 max-w-105 w-full mx-auto">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[20px]" aria-hidden="true">🛠️</span>
          <h1 className="font-display text-[22px] font-bold text-text-primary">Admin log in</h1>
        </div>
        <p className="text-[14px] text-text-secondary mb-6">Sign in with your admin credentials</p>

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
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {loginError &&
            (() => {
              const error = getFriendlyError(loginError);
              return <ErrorAlert title={error.title} message={error.message} action={error.action} />;
            })()}
        </div>

        <Button
          fullWidth
          size="lg"
          className="mt-6"
          disabled={!email || !password}
          isLoading={isLoggingIn}
          onClick={handleLogin}
        >
          Log in
        </Button>
      </div>
    </div>
  );
}
