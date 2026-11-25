import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays } from "@/lib/utils";

// Inserts a realistic sample portfolio into the caller's own workspace (subject to RLS).
export async function seedWorkspace({ workspaceId: w, actor, db }: { workspaceId: string; actor: string; db: SupabaseClient }) {
  const ins = async (table: string, rows: any[]) => {
    const { data, error } = await db.from(table).insert(rows.map((r) => ({ workspace_id: w, ...r }))).select();
    if (error) throw new Error(`${table}: ${error.message}`);
    return data as any[];
  };

  const team = await ins("team_members", [
    { name: "Daniel Okafor", email: "daniel.okafor@example.com", phone: "+1 555 0101", role: "Project Manager" },
    { name: "Maria Santos", email: "maria.santos@example.com", phone: "+1 555 0102", role: "Site Supervisor" },
    { name: "James Whitfield", email: "james.whitfield@example.com", phone: "+1 555 0103", role: "Engineer" },
    { name: "Priya Nair", email: "priya.nair@example.com", phone: "+1 555 0104", role: "Quantity Surveyor" },
    { name: "Tom Becker", email: "tom.becker@example.com", phone: "+1 555 0105", role: "Safety Officer" },
    { name: "Aisha Bello", email: "aisha.bello@example.com", phone: "+1 555 0106", role: "Foreman", status: "Invited" },
  ]);
  const [dan, maria, james, priya, tom, aisha] = team;

  const projects = await ins("projects", [
    { name: "Harbor View Office Tower", description: "Twelve storey mixed office development with two basement parking levels and a glazed facade.", location: "Tampa, FL", client: "Harborline Properties", manager_id: dan.id, category: "Commercial", status: "Active", start_date: addDays(-210), end_date: addDays(190), budget: 4800000, progress: 54 },
    { name: "Riverside Residences Phase 2", description: "Forty eight unit residential block with shared amenities and landscaped courtyard.", location: "Austin, TX", client: "Riverside Living Group", manager_id: dan.id, category: "Residential", status: "At Risk", start_date: addDays(-150), end_date: addDays(75), budget: 2650000, progress: 61 },
    { name: "Northgate Logistics Warehouse", description: "Single storey distribution warehouse with loading docks and a cold storage wing.", location: "Columbus, OH", client: "Northgate Freight", manager_id: james.id, category: "Industrial", status: "Active", start_date: addDays(-90), end_date: addDays(140), budget: 3100000, progress: 38 },
    { name: "Elm Street Clinic Renovation", description: "Interior renovation and mechanical upgrade of an existing outpatient clinic.", location: "Denver, CO", client: "Elm Health Partners", manager_id: james.id, category: "Renovation", status: "Planning", start_date: addDays(14), end_date: addDays(160), budget: 920000, progress: 5 },
    { name: "County Road 12 Bridge Repair", description: "Structural repair and resurfacing of a two span road bridge.", location: "Raleigh, NC", client: "Wake County Public Works", manager_id: dan.id, category: "Infrastructure", status: "Completed", start_date: addDays(-300), end_date: addDays(-20), budget: 1450000, progress: 100 },
  ]);
  const [p1, p2, p3, p4, p5] = projects;

  await db.from("team_members").update({ project_ids: [p1.id, p2.id, p5.id] }).eq("id", dan.id);
  await db.from("team_members").update({ project_ids: [p1.id, p2.id] }).eq("id", maria.id);
  await db.from("team_members").update({ project_ids: [p3.id, p4.id] }).eq("id", james.id);
  await db.from("team_members").update({ project_ids: [p1.id, p3.id] }).eq("id", priya.id);
  await db.from("team_members").update({ project_ids: [p1.id, p2.id, p3.id] }).eq("id", tom.id);
  await db.from("team_members").update({ project_ids: [p3.id] }).eq("id", aisha.id);

  await ins("milestones", [
    { project_id: p1.id, title: "Structural frame complete: level 8", due_date: addDays(21), completed: false },
    { project_id: p1.id, title: "Facade installation begins", due_date: addDays(60), completed: false },
    { project_id: p1.id, title: "Foundation and basement slab", due_date: addDays(-120), completed: true },
    { project_id: p2.id, title: "Block B roof deck sign off", due_date: addDays(9), completed: false },
    { project_id: p2.id, title: "Mechanical rough in inspection", due_date: addDays(30), completed: false },
    { project_id: p3.id, title: "Slab on grade pour: zone A", due_date: addDays(12), completed: false },
    { project_id: p3.id, title: "Steel erection complete", due_date: addDays(55), completed: false },
    { project_id: p4.id, title: "Permit approval", due_date: addDays(10), completed: false },
    { project_id: p5.id, title: "Final load test and handover", due_date: addDays(-20), completed: true },
  ]);

  const tasks = await ins("tasks", [
    { project_id: p1.id, title: "Submit level 8 rebar inspection request", description: "Coordinate with the structural engineer and city inspector.", assignee_id: maria.id, priority: "High", status: "In Progress", due_date: addDays(2) },
    { project_id: p1.id, title: "Approve curtain wall shop drawings", assignee_id: james.id, priority: "Urgent", status: "Under Review", due_date: addDays(-2) },
    { project_id: p1.id, title: "Confirm crane rental extension", assignee_id: dan.id, priority: "Medium", status: "To Do", due_date: addDays(6) },
    { project_id: p1.id, title: "Update safety toolbox talk schedule", assignee_id: tom.id, priority: "Low", status: "Completed", due_date: addDays(-8) },
    { project_id: p2.id, title: "Resolve waterproofing defect on Block B terrace", description: "Contractor to submit corrective method statement.", assignee_id: maria.id, priority: "Urgent", status: "In Progress", due_date: addDays(-1) },
    { project_id: p2.id, title: "Reconcile steel invoices with purchase orders", assignee_id: priya.id, priority: "High", status: "To Do", due_date: addDays(3) },
    { project_id: p2.id, title: "Recovery programme for roof deck delay", assignee_id: dan.id, priority: "High", status: "In Progress", due_date: addDays(5) },
    { project_id: p3.id, title: "Order dock leveller units", assignee_id: james.id, priority: "Medium", status: "To Do", due_date: addDays(9) },
    { project_id: p3.id, title: "Compaction test results for zone A", assignee_id: aisha.id, priority: "High", status: "Under Review", due_date: addDays(1) },
    { project_id: p3.id, title: "Site fencing and signage audit", assignee_id: tom.id, priority: "Low", status: "Completed", due_date: addDays(-14) },
    { project_id: p4.id, title: "Prepare demolition and infection control plan", assignee_id: james.id, priority: "Medium", status: "To Do", due_date: addDays(12) },
    { project_id: p4.id, title: "Collect tender returns for mechanical package", assignee_id: priya.id, priority: "High", status: "In Progress", due_date: addDays(4) },
  ]);

  await ins("comments", [
    { entity_type: "task", entity_id: tasks[1].id, author_name: "Daniel Okafor", body: "Waiting on revised anchor details from the facade supplier." },
    { entity_type: "task", entity_id: tasks[4].id, author_name: "Maria Santos", body: "Contractor has proposed a liquid applied membrane. Review pending." },
  ]);

  const cats = ["Labor", "Materials", "Equipment", "Subcontractors", "Transportation", "Permits", "Site Operations", "Other Expenses"];
  const split = [0.24, 0.3, 0.1, 0.22, 0.03, 0.02, 0.06, 0.03];
  await ins("budgets", projects.flatMap((p) => cats.map((c, i) => ({ project_id: p.id, category: c, planned: Math.round(Number(p.budget) * split[i]) }))));

  const exp = (p: any, category: string, description: string, vendor: string, amount: number, days: number, status = "Approved") => ({ project_id: p.id, category, description, vendor, amount, expense_date: addDays(days), status });
  await ins("expenses", [
    exp(p1, "Labor", "Payroll: structural crew, period 14", "Internal payroll", 186000, -12),
    exp(p1, "Materials", "Ready mix concrete, level 7 and 8 decks", "Gulf Coast Concrete", 214500, -25),
    exp(p1, "Subcontractors", "MEP rough in progress claim 4", "Apex Mechanical", 298000, -18),
    exp(p1, "Equipment", "Tower crane rental, month 7", "Liftco Rentals", 64000, -9),
    exp(p1, "Materials", "Reinforcing steel delivery", "Southeast Rebar Supply", 172400, -40),
    exp(p1, "Labor", "Payroll: structural crew, period 15", "Internal payroll", 191000, -2, "Pending"),
    exp(p1, "Permits", "Facade and crane permits", "City of Tampa", 18500, -60),
    exp(p2, "Materials", "Framing lumber and sheathing", "Lone Star Lumber", 312000, -35),
    exp(p2, "Subcontractors", "Waterproofing contractor claim 2", "Sealtight Systems", 142500, -20),
    exp(p2, "Labor", "Payroll: framing crew, period 11", "Internal payroll", 158000, -10),
    exp(p2, "Equipment", "Scaffolding hire, Block B", "Metro Scaffold", 52000, -14),
    exp(p2, "Subcontractors", "Variation: additional roof deck reinforcement", "Apex Structural", 96000, -4, "Pending"),
    exp(p2, "Site Operations", "Temporary power and site welfare", "Site Services Co", 41000, -30),
    exp(p3, "Materials", "Structural steel package deposit", "Midwest Steel Fabricators", 420000, -45),
    exp(p3, "Subcontractors", "Earthworks and grading", "Buckeye Earthworks", 265000, -70),
    exp(p3, "Labor", "Payroll: civil crew, period 6", "Internal payroll", 98000, -8),
    exp(p3, "Transportation", "Aggregate haulage", "RoadRunner Haulage", 24500, -16),
    exp(p3, "Equipment", "Excavator and compactor hire", "Heavy Hire Ohio", 57000, -22, "Pending"),
    exp(p5, "Subcontractors", "Bridge bearing replacement", "Carolina Structural", 480000, -150),
    exp(p5, "Materials", "Concrete repair mortar and deck overlay", "Piedmont Materials", 365000, -130),
    exp(p5, "Labor", "Payroll: bridge crew total", "Internal payroll", 402000, -90),
    exp(p5, "Equipment", "Traffic management and lifting equipment", "Carolina Traffic Control", 118000, -100),
    exp(p4, "Permits", "Permit application fees", "City of Denver", 6200, -3, "Pending"),
  ]);

  const mats = await ins("materials", [
    { project_id: p1.id, name: "Ready mix concrete C40", description: "Pumpable mix for suspended slabs", quantity: 85, unit: "m3", cost_per_unit: 168, supplier: "Gulf Coast Concrete", reorder_level: 40, delivery_date: addDays(-3) },
    { project_id: p1.id, name: "Reinforcing bar 16mm", description: "Grade 60 deformed bar", quantity: 14, unit: "tonnes", cost_per_unit: 1150, supplier: "Southeast Rebar Supply", reorder_level: 18, delivery_date: addDays(-11), notes: "Reorder before level 9 pour." },
    { project_id: p2.id, name: "Framing lumber 2x6", description: "Treated structural framing", quantity: 1200, unit: "pcs", cost_per_unit: 9.4, supplier: "Lone Star Lumber", reorder_level: 400, delivery_date: addDays(-6) },
    { project_id: p2.id, name: "Waterproofing membrane", description: "Liquid applied membrane for terraces", quantity: 0, unit: "rolls", cost_per_unit: 320, supplier: "Sealtight Systems", reorder_level: 10, notes: "Held pending corrective method statement." },
    { project_id: p3.id, name: "Portland cement 50kg", description: "General purpose cement", quantity: 220, unit: "bags", cost_per_unit: 11.5, supplier: "Buckeye Building Supply", reorder_level: 250, delivery_date: addDays(-5) },
    { project_id: p3.id, name: "Aggregate 20mm", description: "Crushed stone sub base", quantity: 340, unit: "tonnes", cost_per_unit: 24, supplier: "RoadRunner Haulage", reorder_level: 100, delivery_date: addDays(-9) },
  ]);
  await ins("inventory_records", [
    { material_id: mats[0].id, project_id: p1.id, kind: "delivery", quantity: 120, record_date: addDays(-3), notes: "Delivered for level 8 deck" },
    { material_id: mats[0].id, project_id: p1.id, kind: "usage", quantity: 35, record_date: addDays(-2), notes: "Level 8 pour, bay 1" },
    { material_id: mats[1].id, project_id: p1.id, kind: "usage", quantity: 9, record_date: addDays(-4), notes: "Level 8 columns" },
    { material_id: mats[4].id, project_id: p3.id, kind: "usage", quantity: 80, record_date: addDays(-5), notes: "Footings zone A" },
    { material_id: mats[5].id, project_id: p3.id, kind: "delivery", quantity: 400, record_date: addDays(-9), notes: "Sub base delivery" },
  ]);

  await ins("contractors", [
    { company_name: "Apex Mechanical", contact_person: "Luis Moreno", email: "luis@apexmech.example.com", phone: "+1 555 0201", specialty: "HVAC", address: "410 Industrial Way, Tampa, FL", status: "Preferred", notes: "Reliable on programme. Strong safety record.", project_ids: [p1.id] },
    { company_name: "Sealtight Systems", contact_person: "Hannah Price", email: "hprice@sealtight.example.com", phone: "+1 555 0202", specialty: "Roofing", address: "88 Commerce St, Austin, TX", status: "On Hold", notes: "Under review following terrace defect.", project_ids: [p2.id] },
    { company_name: "Buckeye Earthworks", contact_person: "Carl Jensen", email: "carl@buckeyeearth.example.com", phone: "+1 555 0203", specialty: "Excavation", address: "12 Quarry Rd, Columbus, OH", status: "Active", project_ids: [p3.id] },
    { company_name: "Carolina Structural", contact_person: "Denise Hall", email: "dhall@carolinastruct.example.com", phone: "+1 555 0204", specialty: "Steel and Structural", address: "301 Bridge Ave, Raleigh, NC", status: "Preferred", project_ids: [p5.id, p1.id] },
  ]);

  const issues = await ins("issues", [
    { project_id: p2.id, title: "Water ingress at Block B terrace junction", description: "Moisture observed beneath the terrace membrane after rainfall.", severity: "Critical", status: "In Progress", assignee_id: maria.id, due_date: addDays(4), corrective_action: "Remove failed section and reapply membrane with lap test." },
    { project_id: p1.id, title: "Missing edge protection at level 7 stair void", description: "Identified during morning walk.", severity: "High", status: "Open", assignee_id: tom.id, due_date: addDays(1), corrective_action: "Install temporary guardrail and re inspect." },
    { project_id: p3.id, title: "Rebar cover below tolerance in footing F12", severity: "Medium", status: "Open", assignee_id: james.id, due_date: addDays(5), corrective_action: "Add spacers and re inspect prior to pour." },
    { project_id: p1.id, title: "Delivery access blocked by parked vehicles", severity: "Low", status: "Resolved", assignee_id: maria.id, due_date: addDays(-6), corrective_action: "Designated delivery bay with signage." },
  ]);
  await ins("comments", [{ entity_type: "issue", entity_id: issues[0].id, author_name: "Maria Santos", body: "Photos uploaded to the project documents. Waiting on contractor response." }]);
  await ins("inspections", [
    { project_id: p1.id, title: "Level 7 slab pre pour inspection", inspection_date: addDays(-8), inspector: "Rachel Gomez, City Inspector", findings: "Reinforcement placement compliant. Minor chair spacing adjustment needed.", corrective_actions: "Adjust chairs at gridline C4.", status: "Passed" },
    { project_id: p2.id, title: "Block B waterproofing inspection", inspection_date: addDays(-3), inspector: "Mark Ellison, Third Party QA", findings: "Membrane laps below specified overlap in two areas.", corrective_actions: "Replace affected sections and retest.", status: "Action Required" },
    { project_id: p3.id, title: "Zone A subgrade proof roll", inspection_date: addDays(6), inspector: "Geotechnical consultant", findings: "", corrective_actions: "", status: "Scheduled" },
    { project_id: p5.id, title: "Final structural load test", inspection_date: addDays(-25), inspector: "NCDOT Representative", findings: "Deflection within allowable limits.", corrective_actions: "None required.", status: "Passed" },
  ]);

  await ins("daily_reports", [
    { project_id: p1.id, report_date: addDays(-1), supervisor: "Maria Santos", weather: "Clear", activities: "Level 8 column formwork completed. Rebar fixing on deck bays 1 to 3. MEP sleeves installed.", workforce: 64, equipment: "Tower crane, concrete pump, two scissor lifts", materials_delivered: "Rebar 9 tonnes, formwork plywood 200 sheets", safety: "Toolbox talk on working at height. No incidents. Edge protection gap reported.", issues: "Missing edge protection at level 7 stair void.", delays: "None", notes: "Pour scheduled for Friday subject to inspection.", status: "Submitted" },
    { project_id: p2.id, report_date: addDays(-1), supervisor: "Maria Santos", weather: "Light Rain", activities: "Interior framing Block A level 3. Terrace waterproofing rework prepared.", workforce: 41, equipment: "Telehandler, nail guns, scaffolding", materials_delivered: "Lumber 400 pieces", safety: "Slip hazard noted on ramp. Mats installed.", issues: "Water ingress at Block B terrace junction.", delays: "Rain delayed exterior work by 4 hours.", status: "Approved" },
    { project_id: p3.id, report_date: addDays(-2), supervisor: "James Whitfield", weather: "Cloudy", activities: "Subgrade preparation zone A. Footing formwork zone B.", workforce: 28, equipment: "Compactor, excavator, dump trucks", materials_delivered: "Aggregate 120 tonnes", safety: "No incidents. PPE audit completed.", issues: "Rebar cover below tolerance in footing F12.", delays: "None", status: "Draft" },
    { project_id: p1.id, report_date: addDays(-4), supervisor: "Maria Santos", weather: "Hot", activities: "Level 7 slab pour completed, 320 cubic metres.", workforce: 72, equipment: "Tower crane, two concrete pumps", materials_delivered: "Concrete 320 m3", safety: "Heat stress breaks enforced. No incidents.", issues: "None", delays: "None", status: "Approved" },
  ]);

  await ins("documents", [
    { project_id: p1.id, name: "Structural drawings Rev D.pdf", category: "Drawings", folder: "Structural", description: "Issued for construction structural set.", uploaded_by: actor, file_size: 18400000, mime_type: "application/pdf" },
    { project_id: p1.id, name: "Main contract agreement.pdf", category: "Contracts", folder: "Commercial", description: "Executed main contract.", uploaded_by: actor, file_size: 2400000, mime_type: "application/pdf" },
    { project_id: p2.id, name: "Building permit BP 2231.pdf", category: "Permits", folder: "Approvals", description: "Approved building permit.", uploaded_by: actor, file_size: 880000, mime_type: "application/pdf" },
    { project_id: p3.id, name: "Site safety plan.pdf", category: "Safety Documents", folder: "Safety", description: "Project safety management plan.", uploaded_by: actor, file_size: 1500000, mime_type: "application/pdf" },
    { project_id: p5.id, name: "Final cost estimate.xlsx", category: "Estimates", folder: "Commercial", description: "Final account reconciliation.", uploaded_by: actor, file_size: 420000, mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  ]);
  await db.from("activity_logs").insert([{ workspace_id: w, project_id: null, actor_name: actor, action: "Loaded sample data", entity_type: "workspace", entity_name: "Sample portfolio" }]);
}
