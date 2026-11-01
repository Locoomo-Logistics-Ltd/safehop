import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track a parcel | Locoomo",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function FindParcelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
