"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import type { AdminTeamRole, AdminTeamStatus } from "@/core/types";

/** No team management endpoint exists yet — see `admin.service.ts`. */
export function useAdminTeam() {
  const [roleFilter, setRoleFilter] = useState<AdminTeamRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AdminTeamStatus | "all">("all");

  const query = useQuery({
    queryKey: QUERY_KEYS.adminTeam,
    queryFn: () => adminService.getTeamMembers(),
    retry: false,
  });

  const members = useMemo(() => query.data ?? [], [query.data]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (roleFilter !== "all" && member.role !== roleFilter) return false;
      if (statusFilter !== "all" && member.status !== statusFilter) return false;
      return true;
    });
  }, [members, roleFilter, statusFilter]);

  return {
    members: filteredMembers,
    total: members.length,
    isLoading: query.isLoading,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
  };
}
