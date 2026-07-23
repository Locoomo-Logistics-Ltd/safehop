"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/core/api/services";
import { QUERY_KEYS, ROUTES } from "@/core/config/constants";
import { useAuthStore } from "@/store/auth.store";

/**
 * Drives the Rider login flow: enter phone → enter password → sync
 * session → route to the rider dashboard.
 *
 * The real API's rider login is password-based (no OTP endpoint
 * exists) — this keeps the same two-screen shape as the original
 * Figma OTP design (phone number, then a second screen) as a thin UX
 * wrapper, but the second screen collects a real password instead of
 * a 6-digit code, and "continue" calls authService.loginRider
 * directly instead of verifying an OTP.
 */
export function useRiderLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const [phone, setPhone] = useState("");

  /** Step 1 — just capture the phone number and advance to the password screen. No network call (no OTP to send). */
  function continueWithPhone(phoneNumber: string) {
    setPhone(phoneNumber);
  }

  const loginMutation = useMutation({
    mutationFn: (password: string) => authService.loginRider({ target: phone, password }),
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(QUERY_KEYS.session, session);
      router.push(ROUTES.riderHome);
    },
  });

  return {
    continueWithPhone,
    phone,
    hasEnteredPhone: phone.length > 0,

    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
  };
}
