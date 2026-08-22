"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/modules/user/hooks/use-auth";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { Eye, EyeOff } from "lucide-react";
import { ErrorAlert } from "@/components/ui/error-alert";
import type { UserRole } from "@/core/types";

/** Only these three roles can self-register — Admin is provisioned via POST /users/invite. */
type RegistrableRole = Extract<UserRole, "consumer" | "node_operator" | "rider">;

const ROLE_COPY: Record<RegistrableRole, { emoji: string; heading: string; subheading: string }> = {
  consumer: {
    emoji: "🧑",
    heading: "Create an account",
    subheading: "Create your Locoomo account to get started.",
  },
  rider: {
    emoji: "🛵",
    heading: "Create your Rider account",
    subheading:
      "Sign up to start delivering. You'll complete a quick verification step after your first login.",
  },
  node_operator: {
    emoji: "🏬",
    heading: "Create your Node Operator account",
    subheading:
      "Sign up to run a Node. You'll set up your Node's details after your first login.",
  },
};

function parseRole(value: string | null): RegistrableRole {
  return value === "rider" || value === "node_operator" ? value : "consumer";
}

/**
 * "Create an account" — shared by Consumer, Rider, and NodeOperator
 * self-registration. All three hit the same documented
 * `POST /auth/register` with identical fields, differing only in
 * `role` (read from `?role=`, set by RoleSelectScreen). Role-specific
 * steps (Rider KYC document upload, NodeOperator Node setup) happen
 * post-login, per docs/API.md — see `/rider/verification` and
 * `/node/setup`.
 */
export function CreateAccountScreen() {
  const searchParams = useSearchParams();
  const role = parseRole(searchParams.get("role"));
  const copy = ROLE_COPY[role];
  const { register: registerConsumer, isRegistering, registerError } = useAuth();

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

// Password rules per docs/API.md: 12–128 chars, no composition rules
// beyond length — a strength meter checking uppercase/number/symbol
// would reject valid passwords the backend accepts, so length + match
// is all we validate client-side.
const passwordChecks = {
  length: password.length >= 12,
  match: password === confirmPassword && confirmPassword.length === password.length,
};

const isPasswordValid = passwordChecks.length && passwordChecks.match;

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
    role,
  });
};

  return (
    <div className="min-h-screen flex flex-col bg-bg-canvas">
       <div className="flex-1 px-6 py-10 max-w-105 w-full mx-auto">
       

             <>
  <div className="flex items-center gap-2 mb-1.5">
    <span className="text-[22px]" aria-hidden="true">{copy.emoji}</span>
    <h1 className="font-display text-[22px] font-bold text-text-primary">
      {copy.heading}
    </h1>
  </div>

  <p className="text-[14px] text-text-secondary mb-7">
    {copy.subheading}
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
  <p className={passwordChecks.match ? "text-green-600" : "text-status-danger"}>
    {passwordChecks.match ? "✓" : "○"} Passwords match
  </p>
</div>
     )}
    <label className="flex items-center text-sm gap-3 w-full">
  <input
    type="checkbox"
    checked={consentAccepted}
    onChange={(e) => setConsentAccepted(e.target.checked)}
  />
  <span>
    I accept the{" "}
    <Link href={ROUTES.terms} target="_blank" rel="noopener noreferrer" className="text-brand-blue underline">
      Terms of Service
    </Link>{" "}
    and{" "}
    <Link href={ROUTES.privacy} target="_blank" rel="noopener noreferrer" className="text-brand-blue underline">
      Privacy Policy
    </Link>
  </span>
</label>

    {registerError && (()=>{
    
    const error = getFriendlyError(registerError);
    
    return (
    <ErrorAlert
     title={error.title}
     message={error.message}
     action={error.action}
    />
    )
    
    })()}
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
