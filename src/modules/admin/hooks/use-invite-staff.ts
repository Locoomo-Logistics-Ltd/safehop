"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { useNotificationStore } from "@/store/notification.store";
import { getErrorMessage } from "@/core/api/errors";
import type { InviteStaffPayload } from "@/core/types";

/** POST /users/invite — a real, confirmed route per docs/API.md (Admin-only). */
export function useInviteStaff() {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const mutation = useMutation({
    mutationFn: (payload: InviteStaffPayload) => adminService.inviteStaff(payload),
    onSuccess: (invited) => {
      showNotification({
        type: "success",
        title: "Invite sent",
        message: `${invited.firstName} ${invited.lastName} will receive an email to set up their account.`,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminTeam });
    },
    onError: (error) => {
      showNotification({ type: "error", title: "Couldn't send invite", message: getErrorMessage(error) });
    },
  });

  return {
    inviteStaff: mutation.mutate,
    isSubmitting: mutation.isPending,
  };
}
