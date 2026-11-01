/**
 * Guards for URLs and numbers that come back from the API and end up in
 * `href`s or `window.location`. The backend is trusted, but a compromised
 * response, a bad proxy or a data-entry slip must not turn into a
 * `javascript:` link or a redirect to a look-alike payment page.
 */

/** Hosts the browser may be sent to for payment. Paystack hosts its checkout on `checkout.paystack.com`. */
const PAYMENT_HOSTS = ["paystack.com"];

function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/** `https:` only, and the host is Paystack (or one of its subdomains). Anything else is refused. */
export function isSafePaymentUrl(raw: string | undefined | null): raw is string {
  if (!raw) return false;
  const url = parseUrl(raw);
  if (!url || url.protocol !== "https:" || url.username || url.password) return false;
  return PAYMENT_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
}

/** A plain `http(s)` URL, safe to put in an `<a href>` — rejects `javascript:`, `data:`, `vbscript:` and the like. */
export function safeHttpUrl(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const url = parseUrl(raw);
  return url && (url.protocol === "https:" || url.protocol === "http:") ? url.toString() : undefined;
}

/** A `tel:` href built from digits and a leading `+` only; `undefined` if nothing dialable is left. */
export function safeTelHref(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[^\d+]/g, "");
  return /^\+?\d{5,16}$/.test(cleaned) ? `tel:${cleaned}` : undefined;
}
