import type { Metadata, Viewport } from "next";
import "./globals.css";

const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: { default: "SiteLedger | Construction Project Management Software", template: "%s | SiteLedger" },
  description: "SiteLedger brings construction projects, site reports, budgets, teams and documentation into one organized workspace, helping construction businesses stay on track from planning to completion.",
  openGraph: { type: "website", siteName: "SiteLedger", title: "SiteLedger | Construction Project Management Software", description: "Projects, site reports, budgets, teams and documents in one organized construction workspace.", images: [{ url: "/logo.jpg", width: 217, height: 263, alt: "SiteLedger logo" }] },
  icons: { icon: "/logo.jpg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#171A1D" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
