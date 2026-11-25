"use client";
import { PageHeader } from "@/components/ui";
import { IssuesAndInspections } from "@/components/app/modules/Issues";

export default function Page() {
  return <div><PageHeader title="Issues and Inspections" subtitle="Log site issues, assign corrective actions and record inspections." /><IssuesAndInspections /></div>;
}
