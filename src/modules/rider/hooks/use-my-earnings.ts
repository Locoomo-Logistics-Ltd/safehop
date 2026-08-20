"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { riderService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import type { EarningsFilterRange } from "@/core/types";

const RANGE_DAYS: Record<EarningsFilterRange, number | null> = {
  this_week: 7,
  this_month: 30,
  all_time: null,
};

/** Fetches the rider's own revenue-split entries (`GET /earnings/mine`) and filters by time range, matching the "Earnings" tabs. */
export function useMyEarnings() {
  const [range, setRange] = useState<EarningsFilterRange>("this_week");

  // useState's lazy initializer is the one place React explicitly
  // allows a one-time impure read (like Date.now()) during the
  // component's lifetime — unlike reading it directly in the render
  // body or inside a ref, which the compiler now flags as impure.
  const [nowMs] = useState(() => Date.now());

  const query = useQuery({
    queryKey: QUERY_KEYS.riderEarningsEntries,
    queryFn: () => riderService.listMyEarnings(),
  });

  const entries = useMemo(() => query.data ?? [], [query.data]);

  const filteredEntries = useMemo(() => {
    const days = RANGE_DAYS[range];
    if (days === null) return entries;

    const cutoff = nowMs - days * 24 * 60 * 60 * 1000;

    return entries.filter((entry) => new Date(entry.createdAt).getTime() >= cutoff);
  }, [entries, range, nowMs]);

  return {
    entries: filteredEntries,
    range,
    setRange,
    isLoading: query.isLoading,
  };
}
