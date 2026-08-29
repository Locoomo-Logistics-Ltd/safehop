"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { usersService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { persistSession } from "@/core/api/session-storage";
import { useAuthStore } from "@/store/auth.store";
import { useNotificationStore } from "@/store/notification.store";
import type { UpdateProfilePayload } from "@/core/types";
import { resolvePostAuthRoute } from "@/modules/user/lib/auth-routing";

/**
 * `PATCH /users/me` (docs/API.md) — the one thing registration (password
 * or Google) never collects. Used by `CompleteProfileScreen`, shown
 * post-login whenever the cached session's `phone` is still `null`.
 */
export function useCompleteProfile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const showNotification = useNotificationStore((s) => s.showNotification);

  const mutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => usersService.updateMe(payload),
    onSuccess: async (user) => {
      const session = { user };
      setSession(session);
      persistSession(session);
      queryClient.setQueryData(QUERY_KEYS.session, session);
      showNotification({
        type: "success",
        title: "Profile updated",
        message: "Thanks — your phone number has been saved.",
      });
      router.push(await resolvePostAuthRoute(user));
    },
  });

  return {
    completeProfile: mutation.mutate,
    isCompletingProfile: mutation.isPending,
    completeProfileError: mutation.error,
  };
}
