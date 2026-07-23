import { CURRENCY } from "@/core/config/constants";

/** Formats a number as Naira currency, e.g. 3200 -> "₦3,200" */
export function formatCurrency(amount: number): string {
  return `${CURRENCY.symbol}${amount.toLocaleString("en-NG")}`;
}

/** Formats an ISO date string as "Today, 09:45 AM" / "Yesterday, ..." / "Oct 24, 14:30" */
export function formatRelativeDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();

  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (isSameDay) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;

  const datePart = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${datePart}, ${time}`;
}

/** Formats an ISO date as "Oct 24, 2026" */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
