import { SiteFooter, SiteNav } from "@/components/marketing/Site";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <><SiteNav /><main>{children}</main><SiteFooter /></>;
}
