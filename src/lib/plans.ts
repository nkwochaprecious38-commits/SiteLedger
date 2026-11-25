// Prices and billing frequency are taken from the three Selar subscription pages
// (USD, recurring monthly). Selar lists no plan names, descriptions or benefits,
// so names, limits and inclusions below are PROPOSED and flagged for confirmation.
export type PlanId = "plan1" | "plan2" | "plan3";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  cadence: string;
  checkoutUrl: string;
  tagline: string;
  recommended?: boolean;
  includes: string[];
  limits: string[];
}

export const PLAN_CONTENT_CONFIRMED = false;

export const PLANS: Plan[] = [
  {
    id: "plan1",
    name: "Starter",
    price: 47,
    cadence: "per month",
    checkoutUrl: "https://selar.com/47plan?currency=USD",
    tagline: "For small crews organizing their first projects.",
    includes: [
      "Project management and project workspaces",
      "Task management with list and board views",
      "Daily site reports with PDF export",
      "Document storage by project and folder",
      "Budget and expense tracking",
      "Team directory",
    ],
    limits: ["Materials, contractors and analytics are not part of this tier"],
  },
  {
    id: "plan2",
    name: "Professional",
    price: 57,
    cadence: "per month",
    checkoutUrl: "https://selar.com/57plan?currency=USD",
    tagline: "For growing contractors running several active sites.",
    recommended: true,
    includes: [
      "Everything in Starter",
      "Materials and inventory with low stock alerts",
      "Contractor management",
      "Issues and inspections",
      "Notifications and global search",
    ],
    limits: ["Advanced analytics and CSV exports are not part of this tier"],
  },
  {
    id: "plan3",
    name: "Business",
    price: 97,
    cadence: "per month",
    checkoutUrl: "https://selar.com/97plan?currency=USD",
    tagline: "For established firms that need full visibility.",
    includes: [
      "Everything in Professional",
      "Analytics and reports with CSV and PDF export",
      "Contractor performance and team workload insights",
      "Priority onboarding support",
    ],
    limits: [],
  },
];

export const planById = (id?: string | null) => PLANS.find((p) => p.id === id) || PLANS[0];
