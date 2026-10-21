/**
 * Demo data for local development and the public demo.
 * Wipes every table, then recreates a small, believable printing press.
 * Dates are relative to today so the demo always looks current.
 */
import { PrismaClient, type OrderStatus } from "@prisma/client";
import {
  MATERIALS,
  PAPER_TYPES,
  QUALITY_COST_CATEGORIES,
  QUALITY_KIND,
  STAGE_OWNER,
  invoiceTotals,
  nextStatus,
  recentMonths,
  suggestedPrice,
  type MaterialCategory,
} from "@robustify/shared";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Small deterministic PRNG so every seed produces the same data.
let state = 20240115;
function random() {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (min: number, max: number) => Math.floor(min + random() * (max - min + 1));
function pick<T>(items: readonly T[]): T {
  const item = items.at(Math.floor(random() * items.length));
  if (item === undefined) throw new Error("pick from empty list");
  return item;
}

const DAY = 24 * 60 * 60 * 1000;
const today = new Date(new Date().toISOString().slice(0, 10));
const daysFromToday = (days: number) => new Date(today.getTime() + days * DAY);

function seedPassword(): string {
  const password = process.env.SEED_PASSWORD;
  if (password) return password;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SEED_PASSWORD must be set to seed a production database");
  }
  return "demo1234";
}

const PEOPLE = [
  { username: "layla.mansour", role: "ADMIN", department: "ADMINISTRATION" },
  { username: "omar.haddad", role: "EMPLOYEE", department: "DESIGN" },
  { username: "sara.nasser", role: "EMPLOYEE", department: "DESIGN" },
  { username: "khaled.saleh", role: "EMPLOYEE", department: "MONTAGE" },
  { username: "yousef.ali", role: "EMPLOYEE", department: "PRINTING" },
  { username: "rami.issa", role: "EMPLOYEE", department: "PRINTING" },
  { username: "hana.farouk", role: "EMPLOYEE", department: "CUTTING" },
  { username: "maya.aziz", role: "EMPLOYEE", department: "PACKAGING" },
  { username: "tarek.hamdan", role: "EMPLOYEE", department: "DELIVERY" },
] as const;

const CUSTOMERS = [
  { name: "Al Noor Bakery", location: "Amman, Jordan", phone: "+962 6 555 0141" },
  { name: "Cedar Pharma", location: "Beirut, Lebanon", phone: "+961 1 555 0177" },
  { name: "Desert Rose Cosmetics", location: "Dubai, UAE", phone: "+971 4 555 0123" },
  { name: "Olive Grove Foods", location: "Irbid, Jordan", phone: "+962 2 555 0190" },
  { name: "Petra Coffee Roasters", location: "Aqaba, Jordan", phone: "+962 3 555 0165" },
  { name: "Blue Gulf Seafood", location: "Doha, Qatar", phone: "+974 4 555 0108" },
];

const SUPPLIERS = [
  { name: "Levant Paper Mills", location: "Zarqa, Jordan", phone: "+962 5 555 0112" },
  { name: "Inkwell Trading", location: "Istanbul, Turkey", phone: "+90 212 555 0134" },
  { name: "Gloss Coatings", location: "Riyadh, Saudi Arabia", phone: "+966 11 555 0156" },
];

const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, "");

async function wipe() {
  // Children first, so foreign keys never block a delete.
  await prisma.session.deleteMany();
  await prisma.qualityCost.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.order.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  // Resolve the password before wiping, so a misconfigured run changes nothing.
  const passwordHash = await bcrypt.hash(seedPassword(), 12);
  await wipe();

  const users = await Promise.all(
    PEOPLE.map((person) =>
      prisma.user.create({
        data: { ...person, email: `${person.username}@robustify.demo`, passwordHash },
      }),
    ),
  );
  const admin = users[0]!;
  const inDepartment = (department: string) => users.filter((u) => u.department === department);

  const customers = await Promise.all(
    CUSTOMERS.map((c) =>
      prisma.contact.create({
        data: { ...c, type: "CUSTOMER", email: `orders@${slug(c.name)}.example` },
      }),
    ),
  );
  const suppliers = await Promise.all(
    SUPPLIERS.map((s) =>
      prisma.contact.create({
        data: { ...s, type: "SUPPLIER", email: `sales@${slug(s.name)}.example` },
      }),
    ),
  );

  // Orders spread across the pipeline, oldest furthest along.
  const pipeline: OrderStatus[] = [
    ...Array<OrderStatus>(16).fill("COMPLETED"),
    ...Array<OrderStatus>(2).fill("IN_TRANSIT"),
    ...Array<OrderStatus>(2).fill("PACKAGING"),
    ...Array<OrderStatus>(3).fill("CUTTING"),
    ...Array<OrderStatus>(4).fill("PRINTING"),
    ...Array<OrderStatus>(2).fill("MONTAGE"),
    ...Array<OrderStatus>(3).fill("DESIGN"),
    ...Array<OrderStatus>(4).fill("NOT_STARTED"),
  ];

  const orders = [];
  for (const [index, finalStatus] of pipeline.entries()) {
    // Finished work is spread over the last six months; open work is recent.
    const createdAt =
      finalStatus === "COMPLETED"
        ? daysFromToday(-172 + index * 11 + between(0, 2))
        : daysFromToday(-(pipeline.length - index) * 2 - between(0, 2));
    const quantity = between(5, 60) * 100;
    const owner = STAGE_OWNER[finalStatus];
    const assignee = owner ? pick(inDepartment(owner)) : null;

    // Replay the workflow so every order carries a believable event history.
    const events: { fromStatus: OrderStatus | null; toStatus: OrderStatus; createdAt: Date }[] = [
      { fromStatus: null, toStatus: "NOT_STARTED", createdAt },
    ];
    let status: OrderStatus = "NOT_STARTED";
    let at = createdAt;
    while (status !== finalStatus) {
      const next: OrderStatus | null = nextStatus(status);
      if (!next) break;
      at = new Date(Math.min(at.getTime() + between(4, 30) * 60 * 60 * 1000, Date.now()));
      events.push({ fromStatus: status, toStatus: next, createdAt: at });
      status = next;
    }

    const order = await prisma.order.create({
      data: {
        customerId: pick(customers).id,
        assigneeId: assignee?.id ?? null,
        paperType: pick(PAPER_TYPES),
        quantity,
        widthMm: pick([50, 70, 90, 100, 120]),
        heightMm: pick([40, 60, 80, 100, 150]),
        deadline: daysFromToday(between(-2, 21)),
        consumption: Math.ceil(quantity / between(8, 14)),
        cost: Math.round(quantity * (0.08 + random() * 0.12) * 100) / 100,
        status: finalStatus,
        createdAt,
        events: { create: events.map((e) => ({ ...e, actorId: admin.id })) },
      },
    });
    orders.push(order);
  }

  // Invoices for completed work, numbered in issue order. Two are left for the demo to invoice.
  const completed = orders.filter((o) => o.status === "COMPLETED");
  const uninvoiced = new Set([completed.at(9)?.id, completed.at(-1)?.id]);
  const invoiced = completed.filter((o) => !uninvoiced.has(o.id));
  const sequence = new Map<number, number>();
  for (const order of invoiced) {
    const issuedAt = new Date(Math.min(order.createdAt.getTime() + 6 * DAY, Date.now()));
    const year = issuedAt.getUTCFullYear();
    const seq = (sequence.get(year) ?? 0) + 1;
    sequence.set(year, seq);
    await prisma.invoice.create({
      data: {
        number: `INV-${year}-${String(seq).padStart(4, "0")}`,
        orderId: order.id,
        ...invoiceTotals(suggestedPrice(Number(order.cost))),
        issuedAt,
      },
    });
  }

  // Complaints against a couple of delivered orders.
  const complaints = [
    {
      defect: "Colour mismatch on cyan",
      department: "PRINTING",
      comment: "Reprint agreed.",
      cost: 240,
    },
    { defect: "Labels cut 2 mm off centre", department: "CUTTING", comment: null, cost: null },
    {
      defect: "Wrong varnish (matte, not gloss)",
      department: "PRINTING",
      comment: "Credit note issued.",
      cost: 180,
    },
    { defect: "Boxes crushed in delivery", department: "DELIVERY", comment: null, cost: 95 },
  ];
  for (const [index, complaint] of complaints.entries()) {
    const order = completed.at(-1 - index * 3);
    if (!order) break;
    const createdAt = new Date(Math.min(order.createdAt.getTime() + 9 * DAY, Date.now()));
    const resolved = index % 2 === 0;
    await prisma.complaint.create({
      data: {
        orderId: order.id,
        customerId: order.customerId,
        responsibleId: pick(inDepartment(complaint.department)).id,
        defect: complaint.defect,
        comment: complaint.comment,
        cost: complaint.cost,
        status: resolved ? "RESOLVED" : "OPEN",
        resolvedAt: resolved ? new Date(Math.min(createdAt.getTime() + 3 * DAY, Date.now())) : null,
        createdAt,
      },
    });
  }

  // Purchases: booked ones in the past, upcoming ones on the way.
  const purchasePlan: {
    category: MaterialCategory;
    type: string;
    status: "BOOKED" | "UPCOMING" | "PARTIAL";
    offset: number;
  }[] = [
    { category: "PAPER", type: "PPW_WHITE", status: "BOOKED", offset: -40 },
    { category: "PAPER", type: "PE_SILVER", status: "BOOKED", offset: -32 },
    { category: "INK", type: "CYAN", status: "BOOKED", offset: -28 },
    { category: "INK", type: "BLACK", status: "BOOKED", offset: -20 },
    { category: "VARNISH", type: "STANDARD", status: "PARTIAL", offset: -12 },
    { category: "PAPER", type: "LASER", status: "UPCOMING", offset: -4 },
    { category: "INK", type: "MAGENTA", status: "UPCOMING", offset: -2 },
  ];
  const supplierFor: Record<MaterialCategory, number> = {
    PAPER: suppliers[0]!.id,
    INK: suppliers[1]!.id,
    VARNISH: suppliers[2]!.id,
  };
  for (const p of purchasePlan) {
    const quantity = between(4, 20);
    const purchaseDate = daysFromToday(p.offset);
    const expectedArrival = daysFromToday(p.offset + 10);
    const received =
      p.status === "BOOKED" ? quantity : p.status === "PARTIAL" ? Math.ceil(quantity / 2) : 0;
    await prisma.purchase.create({
      data: {
        supplierId: supplierFor[p.category],
        category: p.category,
        materialType: p.type,
        quantity,
        quantityReceived: received,
        cost: quantity * between(80, 240),
        purchaseDate,
        expectedArrival,
        bookedAt: received > 0 ? expectedArrival : null,
        status: p.status,
      },
    });
  }

  // Stock for every material in the catalogue, in the material's unit. A few run low.
  for (const [category, material] of Object.entries(MATERIALS)) {
    for (const materialType of Object.keys(material.types)) {
      await prisma.inventoryItem.create({
        data: {
          category: category as MaterialCategory,
          materialType,
          quantity: Math.round((material.packSize * between(0, 60)) / 10),
          location: `Warehouse ${pick(["A", "B"])}, shelf ${between(1, 12)}`,
        },
      });
    }
  }

  // Cost of quality: steady prevention spending, with poor quality shrinking as it pays off.
  const months = recentMonths(6);
  for (const [index, month] of months.entries()) {
    for (const category of QUALITY_COST_CATEGORIES) {
      if (random() < 0.35) continue;
      const base = QUALITY_KIND[category] === "GOOD" ? between(150, 600) : between(80, 500);
      const trend = QUALITY_KIND[category] === "POOR" ? 1.4 - index * 0.15 : 1;
      await prisma.qualityCost.create({
        data: {
          month: new Date(`${month}-01T00:00:00Z`),
          category,
          amount: Math.round(base * trend),
        },
      });
    }
  }

  console.log(
    `Seeded ${users.length} users, ${customers.length + suppliers.length} contacts, ` +
      `${orders.length} orders, ${invoiced.length} invoices, ${purchasePlan.length} purchases.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
