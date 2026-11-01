import type { DayHours, OpeningHours } from "@/core/types";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
type DayKey = (typeof DAYS)[number];

const DAY_LABELS: Record<DayKey, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

/** Display order, Monday first. */
export const WEEK_ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** `"08:00"` → `"8:00 AM"`. Hours are Lagos local time, shown as written. */
function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
}

function formatRanges(ranges: DayHours | undefined): string {
  if (!ranges?.length) return "Closed";
  return ranges.map((r) => `${formatTime(r.open)} – ${formatTime(r.close)}`).join(", ");
}

/** Today's weekday in Lagos, whatever the device's timezone is. */
function lagosDayKey(now: Date): DayKey {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Africa/Lagos" })
    .format(now)
    .toLowerCase()
    .slice(0, 3);
  return (DAYS.find((d) => d === weekday) ?? "mon") as DayKey;
}

/** The full week, one row per day, for a "Opening hours" list. */
export function getWeekRows(hours: OpeningHours | null | undefined): { day: string; key: DayKey; text: string }[] {
  return WEEK_ORDER.map((key) => ({ key, day: DAY_LABELS[key], text: formatRanges(hours?.[key]) }));
}

/** e.g. `"Today 8:00 AM – 6:00 PM"` / `"Closed today"`; `null` when the Node hasn't set hours. */
export function getTodayHoursText(hours: OpeningHours | null | undefined, now = new Date()): string | null {
  if (!hours || Object.keys(hours).length === 0) return null;
  const today = hours[lagosDayKey(now)];
  return today?.length ? `Today ${formatRanges(today)}` : "Closed today";
}
