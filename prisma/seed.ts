// Dummy data only. Running this RESETS the database (all data is deleted first).
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const DAY = 86_400_000;
const now = new Date();
const base = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
const day = (offset: number) => new Date(base + offset * DAY);

type P = [name: string, customer: number, area: string, status: string, startOff: number, deadlineOff: number, progress: number, budget: number | null];

async function main() {
  await db.activity.deleteMany();
  await db.task.deleteMany();
  await db.projectUpdate.deleteMany();
  await db.project.deleteMany();
  await db.customer.deleteMany();
  await db.listItem.deleteMany();
  await db.user.deleteMany();
  await db.setting.deleteMany();

  // --- Users (demo logins, dummy passwords) ---
  const hash = (p: string) => bcrypt.hashSync(p, 10);
  const admin = await db.user.create({ data: { name: "Admin User", email: "admin@yakunex.example", passwordHash: hash("Admin@12345"), role: "ADMIN" } });
  const kasun = await db.user.create({ data: { name: "Kasun Jayawardena", email: "kasun@yakunex.example", passwordHash: hash("Staff@12345") } });
  const isuri = await db.user.create({ data: { name: "Isuri Rathnayake", email: "isuri@yakunex.example", passwordHash: hash("Staff@12345") } });
  const staff = [admin, kasun, isuri];

  // --- Admin-editable lists ---
  const mk = (list: string, label: string, sortOrder: number, color = "#6b7280", isClosed = false) =>
    db.listItem.create({ data: { list, label, sortOrder, color, isClosed } });

  const area: Record<string, number> = {};
  const areaNames = ["Web Development", "Mobile App Development", "Custom Software", "UI/UX Design", "Cloud & Hosting", "IT Consulting"];
  for (let i = 0; i < areaNames.length; i++) area[areaNames[i]] = (await mk("SERVICE_AREA", areaNames[i], i)).id;

  const cstatus: Record<string, number> = {};
  const cs: [string, string][] = [["Lead", "#EAB308"], ["Active", "#22C55E"], ["Inactive", "#94A3B8"]];
  for (let i = 0; i < cs.length; i++) cstatus[cs[i][0]] = (await mk("CUSTOMER_STATUS", cs[i][0], i, cs[i][1])).id;

  const pstatus: Record<string, number> = {};
  const ps: [string, string, boolean][] = [
    ["Proposed", "#A855F7", false],
    ["In Progress", "#3B82F6", false],
    ["On Hold", "#F59E0B", false],
    ["Completed", "#22C55E", true],
    ["Cancelled", "#EF4444", true],
  ];
  for (let i = 0; i < ps.length; i++) pstatus[ps[i][0]] = (await mk("PROJECT_STATUS", ps[i][0], i, ps[i][1], ps[i][2])).id;

  // --- Customers (fictional) ---
  const customerRows: [string, string, string, string, string, "BUSINESS" | "INDIVIDUAL", string, string][] = [
    ["Lanka Orchid Exports (Pvt) Ltd", "Dinesh Perera", "dinesh@lankaorchid.example", "+94 70 555 0101", "12 Sample Road, Colombo", "BUSINESS", "Active", "Prefers email. Monthly review call."],
    ["Ceylon Spice Traders", "Malsha Fernando", "malsha@ceylonspice.example", "+94 70 555 0102", "45 Demo Street, Matale", "BUSINESS", "Active", ""],
    ["Blue Lagoon Hotels", "Ruwan Silva", "ruwan@bluelagoon.example", "+94 70 555 0103", "7 Beach Lane, Negombo", "BUSINESS", "Active", "Peak season is December to March."],
    ["Kandy Hills Tea Estates", "Priyanka Herath", "priyanka@kandyhills.example", "+94 70 555 0104", "88 Hill Rd, Kandy", "BUSINESS", "Active", ""],
    ["Nimal Wickramasinghe", "Nimal Wickramasinghe", "nimal@mail.example", "+94 70 555 0105", "", "INDIVIDUAL", "Lead", "Interested in a portfolio site."],
    ["Sakura Dental Care", "Dr. Amaya Gunasekara", "info@sakuradental.example", "+94 70 555 0106", "3 Clinic Ave, Galle", "BUSINESS", "Active", ""],
    ["Island Logistics Co.", "Chamara Bandara", "chamara@islandlogistics.example", "+94 70 555 0107", "21 Port Rd, Colombo", "BUSINESS", "Active", "Needs weekly status reports."],
    ["Green Valley School", "Sanduni Ranasinghe", "office@greenvalley.example", "+94 70 555 0108", "5 School Lane, Kurunegala", "BUSINESS", "Active", ""],
    ["Amaya Dissanayake", "Amaya Dissanayake", "amaya@mail.example", "+94 70 555 0109", "", "INDIVIDUAL", "Inactive", "Cancelled project in the past."],
    ["Northern Star Printers", "Thilak Mendis", "thilak@northernstar.example", "+94 70 555 0110", "60 Press St, Jaffna", "BUSINESS", "Inactive", ""],
  ];
  const customers = [];
  for (const [name, contactPerson, email, phone, address, type, status, notes] of customerRows) {
    customers.push(await db.customer.create({ data: { name, contactPerson, email, phone, address, type, statusId: cstatus[status], notes, createdAt: day(-120) } }));
  }

  // --- Projects (dates relative to today so the dashboard always shows overdue / due soon) ---
  const projects: P[] = [
    ["Corporate website redesign", 0, "Web Development", "In Progress", -30, 6, 70, 350000],
    ["Export order portal", 0, "Custom Software", "In Progress", -60, -5, 85, 900000],
    ["Online spice store", 1, "Web Development", "In Progress", -20, 25, 40, 450000],
    ["Inventory mobile app", 1, "Mobile App Development", "Proposed", 5, 60, 0, 600000],
    ["Hotel booking engine", 2, "Custom Software", "In Progress", -90, 3, 90, 1500000],
    ["Brand and UI kit", 2, "UI/UX Design", "Completed", -120, -40, 100, 200000],
    ["Estate monitoring dashboard", 3, "Custom Software", "On Hold", -45, 10, 35, 800000],
    ["Cloud migration", 3, "Cloud & Hosting", "In Progress", -15, -2, 60, 300000],
    ["Personal portfolio site", 4, "Web Development", "Proposed", 2, 20, 0, null],
    ["Appointment booking app", 5, "Mobile App Development", "In Progress", -25, 14, 55, 500000],
    ["Clinic website", 5, "Web Development", "Completed", -100, -30, 100, 250000],
    ["Fleet tracking system", 6, "Custom Software", "In Progress", -50, 30, 45, 1200000],
    ["IT infrastructure audit", 6, "IT Consulting", "Completed", -70, -20, 100, 150000],
    ["Parent portal", 7, "Web Development", "In Progress", -35, 7, 75, 400000],
    ["School app UI design", 7, "UI/UX Design", "On Hold", -60, -10, 30, 180000],
    ["Photo gallery site", 8, "Web Development", "Cancelled", -40, -5, 10, null],
    ["Print shop e-commerce", 9, "Web Development", "Cancelled", -80, -30, 20, 350000],
    ["Website hosting and maintenance", 0, "Cloud & Hosting", "In Progress", -10, 45, 20, 120000],
    ["Legacy order system upgrade", 9, "Custom Software", "Proposed", 10, 90, 0, 700000],
  ];

  const notes = [
    "Kick-off meeting held with the client.",
    "Requirements confirmed and signed off.",
    "First draft shared for review.",
    "Client feedback received; revisions in progress.",
    "Testing started on the staging environment.",
    "Waiting on content and images from the client.",
  ];
  const tasks = ["Gather requirements", "Design mock-ups", "Build core features", "Client review", "Deploy"];

  for (let i = 0; i < projects.length; i++) {
    const [name, c, a, st, startOff, deadlineOff, progress, budget] = projects[i];
    const p = await db.project.create({
      data: {
        name,
        description: `Dummy project for demonstration: ${name.toLowerCase()} for ${customers[c].name}.`,
        customerId: customers[c].id,
        serviceAreaId: area[a],
        statusId: pstatus[st],
        startDate: day(startOff),
        deadline: day(deadlineOff),
        progress,
        budget,
        assignedToId: staff[i % staff.length].id,
      },
    });

    if (st !== "Proposed") {
      const count = 2 + (i % 2);
      for (let k = 0; k < count; k++) {
        await db.projectUpdate.create({
          data: {
            projectId: p.id,
            authorId: staff[(i + k) % staff.length].id,
            note: notes[(i + k) % notes.length],
            progress: Math.round((progress * (k + 1)) / count),
            createdAt: new Date(day(Math.min(0, startOff + 2 + k * 7)).getTime() + 9 * 3_600_000),
          },
        });
      }
    }
    if (i < 6) {
      for (let t = 0; t < tasks.length; t++) {
        await db.task.create({ data: { projectId: p.id, title: tasks[t], done: t < Math.floor(progress / 25) } });
      }
    }
  }

  await db.activity.createMany({
    data: [
      { userId: admin.id, action: "create", entity: "customer", summary: 'Added customer "Lanka Orchid Exports (Pvt) Ltd"' },
      { userId: kasun.id, action: "create", entity: "project", summary: 'Added project "Corporate website redesign"' },
      { userId: isuri.id, action: "update", entity: "project", summary: 'Posted an update on "Hotel booking engine"' },
    ],
  });

  console.log(`Seeded ${customers.length} customers and ${projects.length} projects.`);
  console.log("Demo logins (dummy): admin@yakunex.example / Admin@12345  |  kasun@yakunex.example / Staff@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
