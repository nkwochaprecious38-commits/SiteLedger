import Link from "next/link";
import { PageHeader } from "@/components/ui";

const GUIDES = [
  { t: "Set up your first project", d: "Open Projects, choose New project, then add milestones from the project Overview tab. Assign team members from the Team tab." },
  { t: "Record a daily site report", d: "Open Daily Reports and create a report. Attach site photographs, save it as Draft, then change the status to Submitted. Open the report to export it as PDF using your browser print dialog." },
  { t: "Track budget and expenses", d: "Open a project Budget tab, generate budget lines from the project budget, then record expenses. Pending expenses count toward cost until approved or rejected." },
  { t: "Upload documents", d: "Open Documents, choose New document, pick a category and folder, then attach a file of up to 25 MB. Files are stored in a private workspace bucket." },
  { t: "Manage materials", d: "Add materials with a low stock threshold. Use the movement action on a row to record deliveries and site usage. Stock alerts appear in Notifications." },
  { t: "Handle issues and inspections", d: "Report issues with severity and a deadline, assign an owner and record the corrective action. Log inspections with findings and status." },
];

export default function Help() {
  return (
    <div>
      <PageHeader title="Help and Support" subtitle="Short guides for the most common workflows." />
      <div className="grid gap-4 md:grid-cols-2">{GUIDES.map((g) => <div key={g.t} className="card p-5"><h2 className="font-bold">{g.t}</h2><p className="mt-2 text-sm text-muted">{g.d}</p></div>)}</div>
      <div className="card mt-6 p-5 text-sm"><h2 className="font-bold">Need more help?</h2><p className="mt-2 text-muted">A support contact channel has not been configured for this workspace yet. Workspace owners can review plans and billing in <Link className="font-semibold text-brand hover:underline" href="/app/settings">Settings</Link>. Public documentation is available on the <Link className="font-semibold text-brand hover:underline" href="/features">Features</Link> and <Link className="font-semibold text-brand hover:underline" href="/platform">Platform</Link> pages.</p></div>
    </div>
  );
}
