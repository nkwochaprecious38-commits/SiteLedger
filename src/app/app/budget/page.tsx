"use client";
import { PageHeader } from "@/components/ui";
import { BudgetModule } from "@/components/app/modules/Budget";

export default function Page() {
  return <div><PageHeader title="Budget and Expenses" subtitle="Plan budgets, record expenses and compare planned spending with actual cost." /><BudgetModule /></div>;
}
