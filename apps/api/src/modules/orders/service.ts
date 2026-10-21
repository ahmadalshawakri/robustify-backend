import type { OrderStatus, Prisma, PrismaClient } from "@prisma/client";
import {
  type AdvanceOrderInput,
  type CreateOrderInput,
  LABELS,
  MATERIALS,
  ORDER_STATUSES,
  STAGE_OWNER,
  materialLabel,
  nextStatus,
} from "@robustify/shared";
import { HttpError } from "../../http/errors";
import { toNumber } from "../../http/money";
import { upsertContact } from "../contacts/service";
import type { SessionUser } from "../users/service";

type Tx = Prisma.TransactionClient;

const listInclude = {
  customer: { select: { id: true, name: true } },
  assignee: { select: { id: true, username: true, department: true } },
} satisfies Prisma.OrderInclude;

const detailInclude = {
  customer: true,
  assignee: { select: { id: true, username: true, department: true } },
  events: {
    orderBy: { createdAt: "asc" },
    include: { actor: { select: { id: true, username: true } } },
  },
  invoice: true,
  complaints: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.OrderInclude;

type ListRow = Prisma.OrderGetPayload<{ include: typeof listInclude }>;
type DetailRow = Prisma.OrderGetPayload<{ include: typeof detailInclude }>;

function toOrder(order: ListRow) {
  return {
    ...order,
    cost: toNumber(order.cost),
    paperLabel: materialLabel("PAPER", order.paperType),
    stageOwner: STAGE_OWNER[order.status] ?? null,
  };
}

function toOrderDetail(order: DetailRow) {
  return {
    ...toOrder(order),
    invoice: order.invoice && {
      ...order.invoice,
      subtotal: toNumber(order.invoice.subtotal),
      tax: toNumber(order.invoice.tax),
      total: toNumber(order.invoice.total),
    },
  };
}

/** Statuses whose stage the user's department works on. */
function statusesOwnedBy(user: SessionUser): OrderStatus[] {
  return ORDER_STATUSES.filter((status) => STAGE_OWNER[status] === user.department);
}

/**
 * Admins see every order. Employees see orders assigned to them, plus orders
 * waiting in their department's stage so they can pick up work.
 */
function visibleTo(user: SessionUser): Prisma.OrderWhereInput {
  if (user.role === "ADMIN") return {};
  return { OR: [{ assigneeId: user.id }, { status: { in: statusesOwnedBy(user) } }] };
}

export async function listOrders(
  prisma: PrismaClient,
  user: SessionUser,
  filter: { status?: OrderStatus; assigneeId?: number; mine?: boolean },
) {
  const orders = await prisma.order.findMany({
    where: {
      AND: [
        visibleTo(user),
        {
          status: filter.status,
          assigneeId: filter.mine ? user.id : filter.assigneeId,
        },
      ],
    },
    include: listInclude,
    orderBy: [{ deadline: { sort: "asc", nulls: "last" } }, { id: "desc" }],
  });
  return orders.map(toOrder);
}

export async function getOrder(prisma: PrismaClient, user: SessionUser, id: number) {
  const order = await prisma.order.findFirst({
    where: { AND: [{ id }, visibleTo(user)] },
    include: detailInclude,
  });
  if (!order) throw HttpError.notFound("Order not found");
  return toOrderDetail(order);
}

export async function createOrder(
  prisma: PrismaClient,
  actor: SessionUser,
  input: CreateOrderInput,
) {
  const { customer, ...order } = input;
  const created = await prisma.$transaction(async (tx) => {
    const contact = await upsertContact(tx, "CUSTOMER", customer);
    return tx.order.create({
      data: {
        ...order,
        customerId: contact.id,
        events: { create: { toStatus: "NOT_STARTED", actorId: actor.id } },
      },
      include: listInclude,
    });
  });
  return toOrder(created);
}

/** Checks that `assigneeId` is an employee of the department that owns `status`. */
async function assertAssignable(tx: Tx, status: OrderStatus, assigneeId: number) {
  const owner = STAGE_OWNER[status];
  if (!owner) {
    throw HttpError.conflict(`${LABELS.orderStatus[status]} orders are not assigned to anyone`);
  }
  const assignee = await tx.user.findUnique({ where: { id: assigneeId } });
  if (!assignee || assignee.role !== "EMPLOYEE" || assignee.department !== owner) {
    throw HttpError.badRequest(`Assign this stage to someone in ${LABELS.department[owner]}`);
  }
}

/** Takes the paper a job needs out of stock, refusing when there is not enough. */
async function consumePaper(tx: Tx, paperType: string, metres: number) {
  const { count } = await tx.inventoryItem.updateMany({
    where: { category: "PAPER", materialType: paperType, quantity: { gte: metres } },
    data: { quantity: { decrement: metres } },
  });
  if (count === 0) {
    const item = await tx.inventoryItem.findUnique({
      where: { category_materialType: { category: "PAPER", materialType: paperType } },
    });
    throw HttpError.conflict(
      `Not enough ${materialLabel("PAPER", paperType)} in stock to print: ` +
        `needs ${metres} ${MATERIALS.PAPER.unit}, ${item?.quantity ?? 0} ${MATERIALS.PAPER.unit} available`,
    );
  }
}

/**
 * Moves an order to its next stage. Admins can advance any order; employees
 * only orders in their own department's stage. Entering printing consumes paper.
 */
export async function advanceOrder(
  prisma: PrismaClient,
  actor: SessionUser,
  id: number,
  input: AdvanceOrderInput,
) {
  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { AND: [{ id }, visibleTo(actor)] } });
    if (!order) throw HttpError.notFound("Order not found");

    if (actor.role !== "ADMIN" && STAGE_OWNER[order.status] !== actor.department) {
      throw HttpError.forbidden("Only the department working on this stage can move it on");
    }
    const next = nextStatus(order.status);
    if (!next) throw HttpError.conflict("This order is already completed");

    if (input.assigneeId !== undefined) await assertAssignable(tx, next, input.assigneeId);
    if (next === "PRINTING") await consumePaper(tx, order.paperType, order.consumption);

    // Guard on the old status so two people advancing at once cannot skip a stage.
    const { count } = await tx.order.updateMany({
      where: { id, status: order.status },
      data: { status: next, assigneeId: input.assigneeId ?? null },
    });
    if (count === 0) throw HttpError.conflict("Someone else just moved this order. Reload it.");

    await tx.orderEvent.create({
      data: { orderId: id, actorId: actor.id, fromStatus: order.status, toStatus: next },
    });
    return tx.order.findUniqueOrThrow({ where: { id }, include: detailInclude });
  });
  return toOrderDetail(updated);
}

export async function assignOrder(prisma: PrismaClient, id: number, assigneeId: number | null) {
  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id } });
    if (!order) throw HttpError.notFound("Order not found");
    if (assigneeId !== null) await assertAssignable(tx, order.status, assigneeId);
    return tx.order.update({ where: { id }, data: { assigneeId }, include: detailInclude });
  });
  return toOrderDetail(updated);
}

/** Only orders that never started can be deleted; anything later has history worth keeping. */
export async function deleteOrder(prisma: PrismaClient, id: number) {
  const { count } = await prisma.order.deleteMany({ where: { id, status: "NOT_STARTED" } });
  if (count === 0) {
    const exists = await prisma.order.count({ where: { id } });
    throw exists
      ? HttpError.conflict("Only orders that have not started can be deleted")
      : HttpError.notFound("Order not found");
  }
}
