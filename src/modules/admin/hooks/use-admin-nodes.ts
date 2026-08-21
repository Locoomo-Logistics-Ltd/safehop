"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/** No admin-wide node status endpoint exists yet — see `admin.service.ts`. */
export function useAdminNodes() {
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: QUERY_KEYS.adminNodes,
    queryFn: () => adminService.getNodeStatuses(),
    retry: false,
  });

  const nodes = useMemo(() => query.data ?? [], [query.data]);

  const filteredNodes = useMemo(() => {
    if (!search) return nodes;
    const needle = search.toLowerCase();
    return nodes.filter((node) => node.name.toLowerCase().includes(needle) || node.area.toLowerCase().includes(needle));
  }, [nodes, search]);

  return {
    nodes: filteredNodes,
    isLoading: query.isLoading,
    search,
    setSearch,
  };
}
