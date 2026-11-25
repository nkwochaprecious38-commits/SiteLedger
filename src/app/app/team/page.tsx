"use client";
import { PageHeader } from "@/components/ui";
import { TeamModule } from "@/components/app/modules/People";

export default function Page() {
  return <div><PageHeader title="Team" subtitle="Your directory of managers, supervisors, engineers and field staff." /><TeamModule /></div>;
}
