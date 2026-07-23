import type { Metadata, Viewport } from "next";
import { QueryProvider } from "./providers/query-provider";
import { AuthProvider } from "./providers/auth-provider";
import { ServiceWorkerRegistration } from "./providers/service-worker-registration";

// Self-hosted font weights — bundled via @fontsource, no runtime
// network dependency (required for offline PWA + this sandbox's
// restricted network egress to fonts.googleapis.com).
import { Plus_Jakarta_Sans } from "next/font/google";


const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

import "./globals.css";
import { Notification } from "@/components/ui/notification";

export const metadata: Metadata = {
  title: "Locoomo — Send & Track Parcels",
  description: "Affordable, reliable parcel delivery across your city.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Locoomo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#006CDF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${jakarta.variable}`}>
      <body className="min-h-full antialiased">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
            <Notification />
        </QueryProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
