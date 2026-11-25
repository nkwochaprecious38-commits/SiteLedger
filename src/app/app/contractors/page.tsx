"use client";
import { PageHeader } from "@/components/ui";
import { ContractorsModule } from "@/components/app/modules/People";

export default function Page() {
  return <div><PageHeader title="Contractors" subtitle="Subcontractors and specialist firms working on your projects." /><ContractorsModule /></div>;
}
