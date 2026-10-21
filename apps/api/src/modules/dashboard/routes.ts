import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUSES, recentMonths } from "@robustify/shared";
import { Router } from "express";
import type { Ctx } from "../../context";
import { requireAdmin } from "../../middleware/auth";
import { listInventory } from "../inventory/service";
import { employeeUtilization } from "./utilization";

export function dashboardRouter(ctx: Ctx) {
  const router = Router();
  router.use(requireAdmin);

  router.get("/", async (_req, res) => {
    const { prisma } = ctx;
    const monthStart = new Date(`${recentMonths(1)[0]}-01T00:00:00Z`);
    const [
      statusCounts,
      overdueOrders,
      employees,
      inventory,
      openPurchases,
      openComplaints,
      uninvoicedOrders,
      revenue,
    ] = await Promise.all([
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.count({
        where: { deadline: { lt: new Date() }, status: { not: "COMPLETED" } },
      }),
      employeeUtilization(prisma),
      listInventory(prisma),
      prisma.purchase.count({ where: { status: { in: ["UPCOMING", "PARTIAL"] } } }),
      prisma.complaint.count({ where: { status: "OPEN" } }),
      prisma.order.count({ where: { status: "COMPLETED", invoice: null } }),
      prisma.invoice.aggregate({ _sum: { total: true }, where: { issuedAt: { gte: monthStart } } }),
    ]);

    const ordersByStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<
      OrderStatus,
      number
    >;
    for (const row of statusCounts) ordersByStatus[row.status] = row._count._all;

    const averageUtilization = employees.length
      ? Math.round((employees.reduce((sum, e) => sum + e.utilization, 0) / employees.length) * 10) /
        10
      : 0;

    res.json({
      ordersByStatus,
      overdueOrders,
      averageUtilization,
      lowStock: inventory
        .filter((item) => item.low)
        .map(({ label, quantity, unit }) => ({
          label,
          quantity,
          unit,
        })),
      openPurchases,
      openComplaints,
      uninvoicedOrders,
      revenueThisMonth: revenue._sum.total?.toNumber() ?? 0,
    });
  });

  return router;
}
