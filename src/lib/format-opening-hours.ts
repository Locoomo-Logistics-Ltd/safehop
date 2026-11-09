import type { OpeningHours } from "@/core/types";

const ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const LABEL: Record<(typeof ORDER)[number], string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

/** "08:00" -> "8am", "14:30" -> "2:30pm". */
function to12h(time: string): string {
  const [h, m = "00"] = time.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 && hour < 24 ? "pm" : "am";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return m === "00" ? `${h12}${suffix}` : `${h12}:${m}${suffix}`;
}

/**
 * One-line summary of a Node's weekly hours, e.g.
 * "Mon–Fri 8am–6pm · Sat 9am–2pm". Consecutive days with identical hours
 * are grouped; days with no entry are closed and left out. Returns null
 * when there are no hours at all, so callers can fall back to the legacy
 * `operatingHours` text.
 */
export function summarizeOpeningHours(hours?: OpeningHours | null): string | null {
  if (!hours) return null;

  const groups: { start: number; end: number; text: string }[] = [];
  ORDER.forEach((day, i) => {
    const ranges = hours[day];
    if (!ranges || ranges.length === 0) return;
    const text = ranges.map((r) => `${to12h(r.open)}–${to12h(r.close)}`).join(", ");
    const last = groups[groups.length - 1];
    if (last && last.text === text && last.end === i - 1) last.end = i;
    else groups.push({ start: i, end: i, text });
  });

  if (groups.length === 0) return null;

  return groups
    .map((g) => {
      const days = g.start === g.end ? LABEL[ORDER[g.start]] : `${LABEL[ORDER[g.start]]}–${LABEL[ORDER[g.end]]}`;
      return `${days} ${g.text}`;
    })
    .join(" · ");
}