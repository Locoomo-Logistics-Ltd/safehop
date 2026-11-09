/**
 * Opening hours as the API sends and accepts them: each day is a list of
 * open/close ranges ("HH:mm", Lagos local time), and a missing day means
 * closed.
 *
 * NOTE: this file exists on `main` only to carry this one type. `staging`
 * has a fuller `logistics.types.ts` with the same `OpeningHours` export —
 * when merging, keep staging's version of the file.
 */
export type DayHours = { open: string; close: string }[];

export interface OpeningHours {
  mon?: DayHours;
  tue?: DayHours;
  wed?: DayHours;
  thu?: DayHours;
  fri?: DayHours;
  sat?: DayHours;
  sun?: DayHours;
}