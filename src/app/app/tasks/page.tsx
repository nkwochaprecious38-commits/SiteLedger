"use client";
import { PageHeader } from "@/components/ui";
import { TasksModule } from "@/components/app/modules/Tasks";

export default function Page() {
  return <div><PageHeader title="Tasks" subtitle="Assign, prioritize and track work across every project in list or board view." /><TasksModule /></div>;
}
