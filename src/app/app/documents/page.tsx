"use client";
import { PageHeader } from "@/components/ui";
import { DocumentsModule } from "@/components/app/modules/Documents";

export default function Page() {
  return <div><PageHeader title="Documents" subtitle="Upload, organize and find drawings, contracts, permits and records across projects." /><DocumentsModule /></div>;
}
