/** Normalizes common Nigerian phone entry patterns to E.164 (+234...). */
export function formatNigerianPhone(value: string): string {
  const phone = value.replace(/[^\d+]/g, "");

  if (phone.startsWith("+234")) return phone;
  if (phone.startsWith("234")) return `+${phone}`;
  if (phone.startsWith("0")) return `+234${phone.slice(1)}`;
  if (/^\d{10}$/.test(phone)) return `+234${phone}`;

  return phone;
}

/** Matches docs/API.md's `phone` validation rule: `+` optional, 7–15 digits. */
export function isValidPhone(value: string): boolean {
  return /^\+?\d{7,15}$/.test(value);
}
