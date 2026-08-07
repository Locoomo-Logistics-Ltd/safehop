"use client";

import { useMutation } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { useNotificationStore } from "@/store/notification.store";
import { getErrorMessage } from "@/core/api/errors";

/**
 * The one Super Admin action wired to a real endpoint
 * (`POST /corporate-ops/staff/elevate-superadmin`) — see
 * `admin.service.ts` for the payload-shape caveat.
 */
export function useElevateSuperAdmin() {
  const showNotification = useNotificationStore((s) => s.showNotification);

  const mutation = useMutation({
    mutationFn: (userId: string) => adminService.elevateSuperAdmin({ userId }),
    onSuccess: () => {
      showNotification({
        type: "success",
        title: "Elevation submitted",
        message: "The super admin elevation request was sent.",
      });
    },
    onError: (error) => {
      showNotification({ type: "error", title: "Couldn't elevate user", message: getErrorMessage(error) });
    },
  });

  return {
    elevateUser: mutation.mutate,
    isSubmitting: mutation.isPending,
  };
}
