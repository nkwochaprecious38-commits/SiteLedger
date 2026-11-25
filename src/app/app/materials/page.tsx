"use client";
import { PageHeader } from "@/components/ui";
import { MaterialsModule } from "@/components/app/modules/Materials";

export default function Page() {
  return <div><PageHeader title="Materials" subtitle="Track stock, deliveries, suppliers and usage across sites." /><MaterialsModule /></div>;
}
