"use client";
import { PageHeader } from "@/components/ui";
import { ProjectsModule } from "@/components/app/modules/Projects";

export default function Page() {
  return <div><PageHeader title="Projects" subtitle="Create, search and manage every project from planning to completion." /><ProjectsModule /></div>;
}
