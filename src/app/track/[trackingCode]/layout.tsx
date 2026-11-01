import type { Metadata } from "next";

// The URL carries a secret access token (`?t=`) and a tracking code: keep
// it out of search indexes, and never send it onward in a Referer header.
export const metadata: Metadata = {
  title: "Track a parcel | Locoomo",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function PublicTrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
