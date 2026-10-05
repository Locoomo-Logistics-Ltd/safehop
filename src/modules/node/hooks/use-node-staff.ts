"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nodeService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { getErrorMessage } from "@/core/api/errors";
import { useNotificationStore } from "@/store/notification.store";
import type { NodeStaffInvitePayload } from "@/core/types";

/**
 * One Node's staff — `GET /node-operators/nodes/:nodeId/staff`,
 * `POST .../staff/invite`, `DELETE .../staff/:userId`. All three
 * owner-only, real and confirmed per docs/API.md (the roster and
 * removal are new 2026-09-03; the invite shipped 2026-09-02).
 *
 * The roster is what turned the invite from a send-and-forget form
 * into actual team management: it's the only place a staff member's
 * `userId` exists after the one-time invite response, and that id is
 * exactly what removal takes — which is why `removeStaff` is only ever
 * called with a row from this list.
 *
 * Two behaviours worth knowing:
 *
 * - **An invite doesn't appear here.** The roster lists *active*
 *   memberships; an invitee only becomes one after they follow their
 *   email link and set a password (`POST /auth/invite/confirm`). The
 *   invite still invalidates the query — harmless, and it means the
 *   list is fresh the moment they do accept — but the UI must not
 *   promise the person will show up straight away, so the invite
 *   success copy says "once they accept" rather than implying a row.
 * - **Removal is soft and not instant.** It flips the membership to
 *   `removed` and takes effect on that person's *next* request; it
 *   never touches their account or any other Node they work at.
 */
export function useNodeStaff(nodeId: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const staffQuery = useQuery({
    queryKey: QUERY_KEYS.nodeStaff(nodeId),
    queryFn: () => nodeService.getNodeStaff(nodeId),
    // Owner-only route: a staff session would get a 404, so callers
    // that can't be sure of ownership pass `enabled: false` rather
    // than firing a request that's guaranteed to fail.
    enabled: options?.enabled ?? true,
    retry: false,
  });

  const inviteMutation = useMutation({
    mutationFn: (payload: NodeStaffInvitePayload) =>
      nodeService.inviteNodeStaff(nodeId, payload),
    onSuccess: (invited) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nodeStaff(nodeId) });
      showNotification({
        type: "success",
        title: "Invite sent",
        message: `${invited.firstName} ${invited.lastName} will get an email to set a password. They'll appear in your team once they accept.`,
      });
    },
    onError: (error) => {
      showNotification({
        type: "error",
        title: "Couldn't send invite",
        message: getErrorMessage(error),
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => nodeService.removeNodeStaff(nodeId, userId),
    onSuccess: (_result, userId) => {
      const removed = staffQuery.data?.find((member) => member.userId === userId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nodeStaff(nodeId) });
      showNotification({
        type: "success",
        title: "Access removed",
        message: removed
          ? `${removed.firstName} ${removed.lastName} can no longer work this station.`
          : "That team member can no longer work this station.",
      });
    },
    onError: (error) => {
      showNotification({
        type: "error",
        title: "Couldn't remove that team member",
        message: getErrorMessage(error),
      });
    },
  });

  return {
    staff: staffQuery.data ?? [],
    isLoadingStaff: staffQuery.isLoading,
    staffError: staffQuery.error,

    inviteStaff: inviteMutation.mutate,
    isInviting: inviteMutation.isPending,
    inviteError: inviteMutation.error,
    invitedStaff: inviteMutation.data,
    isInvited: inviteMutation.isSuccess,
    resetInvite: inviteMutation.reset,

    removeStaff: removeMutation.mutate,
    isRemoving: removeMutation.isPending,
    /** The `userId` of the in-flight removal, so a roster can show the spinner on the right row only. */
    removingUserId: removeMutation.variables,
  };
}
