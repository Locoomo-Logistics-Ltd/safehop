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

/** Fetches the rider's job history and filters by time range, matching the "My Deliveries" tabs. */
export function useJobHistory() {
  const [range, setRange] = useState<EarningsFilterRange>("this_week");

  // useState's lazy initializer is the one place React explicitly
  // allows a one-time impure read (like Date.now()) during the
  // component's lifetime — unlike reading it directly in the render
  // body or inside a ref, which the compiler now flags as impure.
  const [nowMs] = useState(() => Date.now());

  const query = useQuery({
    queryKey: QUERY_KEYS.riderJobHistory,
    queryFn: () => riderService.getJobHistory(),
  });

  const jobs = useMemo(() => query.data ?? [], [query.data]);

  const filteredJobs = useMemo(() => {
    const days = RANGE_DAYS[range];
    if (days === null) return jobs;

    const cutoff = nowMs - days * 24 * 60 * 60 * 1000;

    return jobs.filter((job) => {
      const ts = new Date(job.deliveredAt ?? job.createdAt).getTime();
      return ts >= cutoff;
    });
  }, [jobs, range, nowMs]);

  return {
    jobs: filteredJobs,
    range,
    setRange,
    isLoading: query.isLoading,
  };
}
