import { Prisma, type PrismaClient } from "@prisma/client";
import { type CreateInvoiceInput, invoiceTotals, monthKey, recentMonths } from "@robustify/shared";
import { HttpError } from "../../http/errors";
import { toNumber } from "../../http/money";

const listInclude = {
  order: { select: { id: true, customer: { select: { id: true, name: true } } } },
} satisfies Prisma.InvoiceInclude;

const detailInclude = {
  order: { include: { customer: true } },
} satisfies Prisma.InvoiceInclude;

function amounts<
  T extends { subtotal: Prisma.Decimal; tax: Prisma.Decimal; total: Prisma.Decimal },
>(invoice: T) {
  return {
    ...invoice,
    subtotal: toNumber(invoice.subtotal),
    tax: toNumber(invoice.tax),
    total: toNumber(invoice.total),
  };
}

export async function listInvoices(prisma: PrismaClient) {
  const invoices = await prisma.invoice.findMany({
    include: listInclude,
    orderBy: [{ issuedAt: "desc" }, { id: "desc" }],
  });
  return invoices.map(amounts);
}

export async function getInvoice(prisma: PrismaClient, id: number) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: detailInclude });
  if (!invoice) throw HttpError.notFound("Invoice not found");
  return amounts({ ...invoice, order: { ...invoice.order, cost: toNumber(invoice.order.cost) } });
}

/** Next number in the yearly sequence: INV-2026-0001, INV-2026-0002, … */
async function nextNumber(tx: Prisma.TransactionClient, year: number) {
  const prefix = `INV-${year}-`;
  const last = await tx.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
  });
  const seq = last ? Number(last.number.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

/** Invoices a completed order, once. Tax comes from the shared rate. */
export async function createInvoice(prisma: PrismaClient, input: CreateInvoiceInput) {
  // Two invoices issued at once can race for the same number; the unique index
  // catches it and the second one simply takes the next number.
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: input.orderId },
          include: { invoice: true },
        });
        if (!order) throw HttpError.notFound("Order not found");
        if (order.status !== "COMPLETED") {
          throw HttpError.conflict("Only completed orders can be invoiced");
        }
        if (order.invoice) throw HttpError.conflict(`Already invoiced as ${order.invoice.number}`);

        const invoice = await tx.invoice.create({
          data: {
            orderId: order.id,
            number: await nextNumber(tx, new Date().getUTCFullYear()),
            ...invoiceTotals(input.subtotal),
          },
          include: listInclude,
        });
        return amounts(invoice);
      });
    } catch (err) {
      const numberTaken =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        String(err.meta?.target).includes("number");
      if (!numberTaken || attempt >= 2) throw err;
    }
  }
}

/** Monthly revenue for the last `months` months, plus the best customers in that period. */
export async function salesReport(prisma: PrismaClient, months: number) {
  const keys = recentMonths(months);
  const from = new Date(`${keys[0]}-01T00:00:00Z`);
  const [invoices, uninvoicedOrders] = await Promise.all([
    prisma.invoice.findMany({ where: { issuedAt: { gte: from } }, include: listInclude }),
    prisma.order.count({ where: { status: "COMPLETED", invoice: null } }),
  ]);

  const byMonth = new Map(keys.map((k) => [k, { month: k, invoices: 0, subtotal: 0, total: 0 }]));
  const byCustomer = new Map<
    number,
    { id: number; name: string; invoices: number; total: number }
  >();
  for (const invoice of invoices.map(amounts)) {
    const month = byMonth.get(monthKey(invoice.issuedAt));
    if (month) {
      month.invoices += 1;
      month.subtotal += invoice.subtotal;
      month.total += invoice.total;
    }
    const { id, name } = invoice.order.customer;
    const customer = byCustomer.get(id) ?? { id, name, invoices: 0, total: 0 };
    customer.invoices += 1;
    customer.total += invoice.total;
    byCustomer.set(id, customer);
  }

  const round = (n: number) => Math.round(n * 100) / 100;
  const monthsOut = [...byMonth.values()].map((m) => ({
    ...m,
    subtotal: round(m.subtotal),
    total: round(m.total),
  }));
  return {
    months: monthsOut,
    totalRevenue: round(monthsOut.reduce((sum, m) => sum + m.total, 0)),
    invoiceCount: invoices.length,
    topCustomers: [...byCustomer.values()]
      .map((c) => ({ ...c, total: round(c.total) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
    uninvoicedOrders,
  };
}
