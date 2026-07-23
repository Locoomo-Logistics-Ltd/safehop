"use client";

import { useState } from "react";
import Link from "next/link";
// import { Button, Input, OtpInputBoxes } from "@/components/ui";
import { Button, Input } from "@/components/ui";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/modules/user/hooks/use-auth";
import { getErrorMessage } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";

// type LoginMethod = "password" | "otp";
// const OTP_LENGTH = 6;

/**
 * "Log in" — real API's LoginConsumerDto accepts EITHER a password OR
 * an OTP code, since registration made the password optional. This
 * screen lets the person pick whichever they set up.
 */
export function LoginScreen() {
  const {
    // requestLoginOtp,
    // isRequestingLoginOtp,
    // requestLoginOtpError,
    // loginOtpSent,
    // target,
    login,
    isLoggingIn,
    loginError,
  } = useAuth();

  // const [contact, setContact] = useState("");
  // const [method, setMethod] = useState<LoginMethod>("password");
  // const [password, setPassword] = useState("");
  // const [code, setCode] = useState("");

  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);

  // const handleContinue = () => {
  //   if (method === "otp") {
  //     requestLoginOtp(contact);
  //   }
    // For password method there's nothing to "send" — login() below
    // is called directly once both contact + password are entered.
  // };

  // const handleLogin = () => {
  //   if (method === "password") {
  //     login({ password });
  //   } else {
  //     login({ code });
  //   }
  // };

  const handleLogin = () => {
  login({
    email,
    password,
  });
};

  // const showCredentialStep = method === "password" || loginOtpSent;

  return (
    <div className="min-h-screen flex flex-col bg-bg-canvas">
      <div className="flex-1 px-6 py-10 max-w-[420px] w-full mx-auto">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[20px]" aria-hidden="true">📍</span>
          <h1 className="font-display text-[22px] font-bold text-text-primary">Log in</h1>
        </div>
        <p className="text-[14px] text-text-secondary mb-6">Enter your login details</p>

        {/* <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMethod("password")}
            className={`flex-1 h-10 rounded-[10px] text-[13px] font-semibold border-2 transition-colors ${
              method === "password"
                ? "border-brand-blue bg-status-info-bg text-brand-blue"
                : "border-border-default text-text-secondary"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMethod("otp")}
            className={`flex-1 h-10 rounded-[10px] text-[13px] font-semibold border-2 transition-colors ${
              method === "otp"
                ? "border-brand-blue bg-status-info-bg text-brand-blue"
                : "border-border-default text-text-secondary"
            }`}
          >
            One-time code
          </button>
        </div> */}

        <div className="flex flex-col gap-4">
          {/* <Input
            label="Phone or Email"
            placeholder="johndoe@gmail.com or 08012345678"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            disabled={method === "otp" && loginOtpSent}
          /> */}
          <Input
  label="Email"
  type="email"
  placeholder="johndoe@gmail.com"
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
    className="absolute right-4 top-[42px] text-text-secondary"
  >
    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>

          {/* {method === "password" && (
            <Input
              label="Password"
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          )} */}

          {/* {method === "otp" && loginOtpSent && (
            <div>
              <p className="text-[13px] font-medium text-text-secondary mb-2">
                Code sent to {target}
              </p>
              <OtpInputBoxes length={OTP_LENGTH} value={code} hasError={!!loginError} />
              <input
                type="text"
                inputMode="numeric"
                maxLength={OTP_LENGTH}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="sr-only"
                aria-label="6-digit login code"
                autoFocus
              />
            </div>
          )} */}

          {/* {(requestLoginOtpError || loginError) && (
            <p className="text-[13px] text-status-danger" role="alert">
              {getErrorMessage(requestLoginOtpError ?? loginError)}
            </p>
          )} */}
          {loginError && (
  <p className="text-[13px] text-status-danger" role="alert">
    {getErrorMessage(loginError)}
  </p>
)}
        </div>

        {/* {showCredentialStep ? (
          <Button
            fullWidth
            size="lg"
            className="mt-6"
            disabled={method === "password" ? !password : code.length !== OTP_LENGTH}
            isLoading={isLoggingIn}
            onClick={handleLogin}
          >
            Login
          </Button>
        ) : (
          <Button
            fullWidth
            size="lg"
            className="mt-6"
            disabled={contact.trim().length < 5}
            isLoading={isRequestingLoginOtp}
            onClick={handleContinue}
          >
            Send Code →
          </Button>
        )} */}
        <Button
  fullWidth
  size="lg"
  className="mt-6"
  disabled={!email || !password}
  isLoading={isLoggingIn}
  onClick={handleLogin}
>
  Login
</Button>

        <p className="text-center text-[13px] text-text-secondary mt-5">
          Don&apos;t have an account?{" "}
          <Link href={ROUTES.createAccount} className="text-brand-blue font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
