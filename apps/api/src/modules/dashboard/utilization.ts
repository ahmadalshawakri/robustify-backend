import type { PrismaClient } from "@prisma/client";
import { STAGE_OWNER, isInProduction, utilization } from "@robustify/shared";

/**
 * Utilization per employee: the open orders assigned to them that sit in
 * their own department's stage, as a share of one working day.
 */
export async function employeeUtilization(prisma: PrismaClient) {
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: [{ department: "asc" }, { username: "asc" }],
    include: { assignedOrders: { select: { status: true, consumption: true } } },
  });

  return employees.map((employee) => {
    const open = employee.assignedOrders.filter(
      (order) => isInProduction(order.status) && STAGE_OWNER[order.status] === employee.department,
    );
    return {
      id: employee.id,
      username: employee.username,
      department: employee.department,
      openOrders: open.length,
      utilization: utilization(
        employee.department,
        open.map((order) => order.consumption),
      ),
    };
  });
}
