"use client";
import { PageHeader } from "@/components/ui";
import { ReportsModule } from "@/components/app/modules/Reports";

export default function Page() {
  return <div><PageHeader title="Daily Reports" subtitle="Record site activity, workforce, safety and delays. Open a report to preview and export it." /><ReportsModule /></div>;
}
