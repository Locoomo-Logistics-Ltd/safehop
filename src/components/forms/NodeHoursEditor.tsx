"use client";

import { Input } from "@/components/ui";
import type { OpeningHours } from "@/core/types";

export const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
] as const;

export type DayKey = (typeof DAYS)[number]["key"];
export type DayDraft = { closed: boolean; open: string; close: string };
export type HoursDraft = Record<DayKey, DayDraft>;

export function defaultHoursDraft(): HoursDraft {
  const weekday = { closed: false, open: "08:00", close: "18:00" };
  return {
    mon: { ...weekday },
    tue: { ...weekday },
    wed: { ...weekday },
    thu: { ...weekday },
    fri: { ...weekday },
    sat: { closed: false, open: "09:00", close: "14:00" },
    sun: { closed: true, open: "09:00", close: "14:00" },
  };
}

/** At least one open day, and every open day has open < close ("HH:mm" compares correctly as text). */
export function isHoursDraftValid(draft: HoursDraft): boolean {
  const open = DAYS.map((d) => draft[d.key]).filter((d) => !d.closed);
  return open.length > 0 && open.every((d) => d.open && d.close && d.open < d.close);
}

/** Closed days are left out, which is how the API represents them. */
export function toOpeningHours(draft: HoursDraft): OpeningHours {
  const out: OpeningHours = {};
  for (const { key } of DAYS) {
    const d = draft[key];
    if (!d.closed) out[key] = [{ open: d.open, close: d.close }];
  }
  return out;
}

interface Props {
  value: HoursDraft;
  onChange: (next: HoursDraft) => void;
}

export function NodeHoursEditor({ value, onChange }: Props) {
  const update = (key: DayKey, patch: Partial<DayDraft>) =>
    onChange({ ...value, [key]: { ...value[key], ...patch } });

  return (
    <div className="flex flex-col gap-2.5">
      {DAYS.map(({ key, label }) => {
        const d = value[key];
        const invalid = !d.closed && d.open >= d.close;
        return (
          <div key={key}>
            <div className="flex items-center gap-2">
              <span className="w-[82px] text-[13px] text-text-primary shrink-0">{label}</span>
              <label className="flex items-center gap-1.5 text-[12px] text-text-muted shrink-0">
                <input
                  type="checkbox"
                  checked={d.closed}
                  onChange={(e) => update(key, { closed: e.target.checked })}
                />
                Closed
              </label>
              {!d.closed && (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <Input
                      type="time"
                      aria-label={`${label} opens`}
                      className="h-10 px-2 text-[14px]"
                      value={d.open}
                      onChange={(e) => update(key, { open: e.target.value })}
                    />
                  </div>
                  <span className="text-text-muted">–</span>
                  <div className="flex-1 min-w-0">
                    <Input
                      type="time"
                      aria-label={`${label} closes`}
                      className="h-10 px-2 text-[14px]"
                      value={d.close}
                      onChange={(e) => update(key, { close: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
            {invalid && (
              <p className="text-[11px] text-status-danger mt-1 ml-[82px]">
                Closing time must be after opening time
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}