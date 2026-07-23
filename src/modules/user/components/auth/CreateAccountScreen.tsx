"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input, OtpInputBoxes } from "@/components/ui";
import { useAuth } from "@/modules/user/hooks/use-auth";
import { getErrorMessage } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import type { OtpChannel } from "@/core/types";
import { Eye, EyeOff } from "lucide-react";

// const OTP_LENGTH = 6;

/**
 * "Create an account" — real API is a 2-step flow: request an OTP to
 * a phone/email, then verify it alongside your name (and an optional
 * password) to actually create the account. Replaces the old
 * single-shot form the mock API allowed.
 */
export function CreateAccountScreen() {
  const {
    // requestSignUpOtp,
    // isRequestingSignUpOtp,
    // requestSignUpOtpError,
    // signUpOtpSent,
    // target,
    register: registerConsumer,
    isRegistering,
    registerError,
  } = useAuth();

  // const [contact, setContact] = useState("");
  // const [channel, setChannel] = useState<OtpChannel>("SMS");
  // const [fullName, setFullName] = useState("");
  // const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [phone, setPhone] = useState("");
const [consentAccepted, setConsentAccepted] = useState(false);

const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const formatNigerianPhone = (value: string) => {
  // Remove everything except digits and +
  const phone = value.replace(/[^\d+]/g, "");

  // Already correct
  if (phone.startsWith("+234")) {
    return phone;
  }

  // Starts with 234
  if (phone.startsWith("234")) {
    return `+${phone}`;
  }

  // Starts with 0
  if (phone.startsWith("0")) {
    return `+234${phone.slice(1)}`;
  }

  // Starts with local number (e.g. 817...)
  if (/^\d{10}$/.test(phone)) {
    return `+234${phone}`;
  }

  return phone;
};

//Password check
const passwordChecks = {
  length: password.length >= 12,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
  special: /[^A-Za-z0-9]/.test(password),
  match: password === confirmPassword && confirmPassword.length === password.length,
};

const isPasswordValid =
  passwordChecks.length &&
  passwordChecks.uppercase &&
  passwordChecks.lowercase &&
  passwordChecks.number &&
  passwordChecks.special &&
  passwordChecks.match;

  const handleCreateAccount = () => {
  if (password !== confirmPassword) return;

  registerConsumer({
    firstName,
    lastName,
    email,
    phone,
    password,
    passwordConfirmation: confirmPassword,
    consentAccepted,
  });
};

  return (
    <div className="min-h-screen flex flex-col bg-bg-canvas">
       <div className="flex-1 px-6 py-10 max-w-105 w-full mx-auto">
        {/** 
        {!signUpOtpSent ? (
          <>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[22px]" aria-hidden="true">🧑</span>
              <h1 className="font-display text-[22px] font-bold text-text-primary">
                Create an account
              </h1>
            </div>
            <p className="text-[14px] text-text-secondary mb-7">
              We&apos;ll text or email you a code to verify it&apos;s really you.
            </p>

            <div className="flex flex-col gap-4">
              <Input
                label="Phone or Email"
                placeholder="johndoe@gmail.com or 08012345678"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />

              <div>
                <p className="text-[13px] font-medium text-text-secondary mb-2">
                  Send the code via
                </p>
                <div className="flex gap-2">
                  {(["SMS", "EMAIL", "WHATSAPP"] as OtpChannel[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setChannel(c)}
                      className={`flex-1 h-10 rounded-[10px] text-[13px] font-semibold border-2 transition-colors ${
                        channel === c
                          ? "border-brand-blue bg-status-info-bg text-brand-blue"
                          : "border-border-default text-text-secondary"
                      }`}
                    >
                      {c === "SMS" ? "Text" : c === "EMAIL" ? "Email" : "WhatsApp"}
                    </button>
                  ))}
                </div>
              </div>

              {requestSignUpOtpError && (
                <p className="text-[13px] text-status-danger" role="alert">
                  {getErrorMessage(requestSignUpOtpError)}
                </p>
              )}
            </div>

            <Button
              fullWidth
              size="lg"
              className="mt-6"
              disabled={contact.trim().length < 5}
              isLoading={isRequestingSignUpOtp}
              onClick={handleSendCode}
            >
              Send Code →
            </Button>
          </>
        ) : (
          <>
            <h1 className="font-display text-[22px] font-bold text-text-primary mb-1.5">
              Verify &amp; finish up
            </h1>
            <p className="text-[14px] text-text-secondary mb-7">
              Enter the code we sent to {target}, plus your name.
            </p>

            <div className="flex flex-col gap-5">
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <div>
                <p className="text-[13px] font-medium text-text-secondary mb-2">
                  6-digit code
                </p>
                <OtpInputBoxes length={OTP_LENGTH} value={code} hasError={!!registerError} />
            
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="sr-only"
                  aria-label="6-digit verification code"
                  autoFocus
                />
              </div>

              <Input
                label="Password (optional)"
                type="password"
                placeholder="Leave blank to use OTP login only"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint="Set a password now if you'd rather not request a code every time you log in."
              />

              {registerError && (
                <p className="text-[13px] text-status-danger" role="alert">
                  {getErrorMessage(registerError)}
                </p>
              )}
            </div>

            <Button
              fullWidth
              size="lg"
              className="mt-6"
              disabled={!fullName.trim() || code.length !== OTP_LENGTH}
              isLoading={isRegistering}
              onClick={handleCreateAccount}
            >
              Create Account
            </Button>
          </>
        )}
           **/}

             <>
  <div className="flex items-center gap-2 mb-1.5">
    <span className="text-[22px]" aria-hidden="true">🧑</span>
    <h1 className="font-display text-[22px] font-bold text-text-primary">
      Create an account
    </h1>
  </div>

  <p className="text-[14px] text-text-secondary mb-7">
    Create your Locoomo account to get started.
  </p>

  <div className="flex flex-col gap-4">
    <div className="grid grid-cols-2 gap-3">
      <Input
        label="First Name"
        placeholder="John"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />

      <Input
        label="Last Name"
        placeholder="Doe"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
    </div>

    <Input
      label="Email"
      type="email"
      placeholder="johndoe@gmail.com"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />

   <Input
  label="Phone Number"
  type="tel"
  inputMode="tel"
  autoComplete="tel"
  placeholder="08173456789"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
  onBlur={() => setPhone(formatNigerianPhone(phone))}
/>

    <div className="relative">
      <Input
        label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-9.5 text-text-secondary"
      >
        {showPassword ? (
          <EyeOff className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </button>
    </div>

    {/* Password error message */}
  

    <div className="relative">
      <Input
        label="Confirm Password"
        type={showConfirmPassword ? "text" : "password"}
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button
        type="button"
        onClick={() =>
          setShowConfirmPassword(!showConfirmPassword)
        }
        className="absolute right-3 top-9.5 text-text-secondary"
      >
        {showConfirmPassword ? (
          <EyeOff className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </button>
    </div>

   
     {password.length > 0 && (
      <div className="text-[13px] space-y-1 mt-2">
  <p className={passwordChecks.length ? "text-green-600" : "text-status-danger"}>
    {passwordChecks.length ? "✓" : "○"} At least 12 characters
  </p>

  <p className={passwordChecks.uppercase ? "text-green-600" : "text-status-danger"}>
    {passwordChecks.uppercase ? "✓" : "○"} One uppercase letter
  </p>

  <p className={passwordChecks.lowercase ? "text-green-600" : "text-status-danger"}>
    {passwordChecks.lowercase ? "✓" : "○"} One lowercase letter
  </p>

  <p className={passwordChecks.number ? "text-green-600" : "text-status-danger"}>
    {passwordChecks.number ? "✓" : "○"} One number
  </p>

  <p className={passwordChecks.special ? "text-green-600" : "text-status-danger"}>
    {passwordChecks.special ? "✓" : "○"} One special character
  </p>
  <p className={passwordChecks.match ? "text-green-600" : "text-status-danger"}>
    {passwordChecks.match ? "✓" : "○"} Password  match
  </p>
</div>
     )}
    <label className="flex items-center text-sm gap-3 w-full">
  <input
    type="checkbox"
    checked={consentAccepted}
    onChange={(e) => setConsentAccepted(e.target.checked)}
  />
  <span>I accept the Terms of Service and Privacy Policy</span>
</label>

    {registerError && (
      <p className="text-[13px] text-status-danger" role="alert">
        {getErrorMessage(registerError)}
      </p>
    )}
  </div>

  <Button
    fullWidth
    size="lg"
    className="mt-6"
   disabled={
  !firstName.trim() ||
  !lastName.trim() ||
  !email.trim() ||
  !phone.trim() ||
  !isPasswordValid ||
  !consentAccepted
}
    isLoading={isRegistering}
    onClick={handleCreateAccount}
  >
    Create Account
  </Button>
</>

        <p className="text-center text-[13px] text-text-secondary mt-5">
          Already have an account?{" "}
          <Link href={ROUTES.login} className="text-brand-blue font-semibold">
            Log in
          </Link>
        </p>
      </div>
     
    
    </div>
  );
}
