import type { Department, OrderStatus, Role } from "@prisma/client";
import request from "supertest";
import { createApp, type AppDeps } from "../../src/app";
import { prisma } from "../../src/db";
import { hashPassword } from "../../src/modules/users/service";

export { prisma };

export const PASSWORD = "correct-horse";

export function testApp(overrides: Partial<AppDeps> = {}) {
  return createApp({
    prisma,
    sessionSecret: "test-secret-that-is-at-least-32-characters",
    secureCookies: false,
    demo: false,
    loginAttempts: 1000,
    ...overrides,
  });
}

/** Empties every table so each test starts from nothing. */
export async function resetDb() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map((t) => `"${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

let userCount = 0;

export async function makeUser(role: Role, department: Department, username?: string) {
  userCount += 1;
  const name = username ?? `${department.toLowerCase()}.user${String.fromCharCode(96 + userCount)}`;
  return prisma.user.create({
    data: {
      username: name,
      email: `${name}@robustify.test`,
      role,
      department,
      passwordHash: await hashPassword(PASSWORD),
    },
  });
}

/** A supertest agent signed in as the given user; it keeps the session cookie. */
export async function signIn(app: ReturnType<typeof testApp>, username: string) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ username, password: PASSWORD });
  if (res.status !== 200)
    throw new Error(`sign-in failed: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

export const customer = {
  name: "Al Noor Bakery",
  email: "orders@alnoor.example",
  phone: "+962 6 555 0141",
  location: "Amman",
};

export const supplier = {
  name: "Levant Paper Mills",
  email: "sales@levantpaper.example",
  phone: "+962 5 555 0112",
  location: "Zarqa",
};

export const newOrder = {
  customer,
  paperType: "PPW_WHITE",
  quantity: 2000,
  widthMm: 90,
  heightMm: 60,
  deadline: "2030-01-15",
  consumption: 500,
  cost: 240.5,
};

/** Creates an order directly in the given status, skipping the workflow. */
export async function makeOrder(status: OrderStatus, cost = 100) {
  const contact = await prisma.contact.upsert({
    where: { email_type: { email: customer.email, type: "CUSTOMER" } },
    create: { ...customer, type: "CUSTOMER" },
    update: {},
  });
  const { customer: _customer, deadline: _deadline, ...order } = newOrder;
  return prisma.order.create({ data: { ...order, cost, status, customerId: contact.id } });
}
