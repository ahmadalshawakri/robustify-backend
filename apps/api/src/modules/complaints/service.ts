import type { ComplaintStatus, Prisma, PrismaClient } from "@prisma/client";
import type { CreateComplaintInput, UpdateComplaintInput } from "@robustify/shared";
import { HttpError } from "../../http/errors";
import { toNumber } from "../../http/money";
import type { SessionUser } from "../users/service";

const include = {
  order: { select: { id: true, status: true, paperType: true, quantity: true } },
  customer: { select: { id: true, name: true } },
  responsible: { select: { id: true, username: true, department: true } },
} satisfies Prisma.ComplaintInclude;

type Row = Prisma.ComplaintGetPayload<{ include: typeof include }>;

function toComplaint(complaint: Row) {
  return { ...complaint, cost: complaint.cost === null ? null : toNumber(complaint.cost) };
}

/** Admins see every complaint; employees the ones they are responsible for. */
export async function listComplaints(
  prisma: PrismaClient,
  user: SessionUser,
  filter: { status?: ComplaintStatus },
) {
  const complaints = await prisma.complaint.findMany({
    where: { ...filter, ...(user.role === "ADMIN" ? {} : { responsibleId: user.id }) },
    include,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return complaints.map(toComplaint);
}

async function assertResponsible(tx: Prisma.TransactionClient, userId: number) {
  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "EMPLOYEE") {
    throw HttpError.badRequest("Pick an employee as responsible");
  }
}

/** Complaints are about delivered work, so the order must be in transit or completed. */
export async function createComplaint(prisma: PrismaClient, input: CreateComplaintInput) {
  const created = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw HttpError.notFound("Order not found");
    if (order.status !== "IN_TRANSIT" && order.status !== "COMPLETED") {
      throw HttpError.conflict("Complaints can only be logged once an order has shipped");
    }
    if (input.responsibleId) await assertResponsible(tx, input.responsibleId);
    return tx.complaint.create({
      data: {
        orderId: order.id,
        customerId: order.customerId,
        defect: input.defect,
        responsibleId: input.responsibleId ?? null,
        cost: input.cost ?? null,
        comment: input.comment ?? null,
      },
      include,
    });
  });
  return toComplaint(created);
}

export async function updateComplaint(
  prisma: PrismaClient,
  id: number,
  input: UpdateComplaintInput,
) {
  const updated = await prisma.$transaction(async (tx) => {
    const complaint = await tx.complaint.findUnique({ where: { id } });
    if (!complaint) throw HttpError.notFound("Complaint not found");
    if (input.responsibleId) await assertResponsible(tx, input.responsibleId);

    const resolvedAt =
      input.status === undefined || input.status === complaint.status
        ? undefined
        : input.status === "RESOLVED"
          ? new Date()
          : null;
    return tx.complaint.update({ where: { id }, data: { ...input, resolvedAt }, include });
  });
  return toComplaint(updated);
}
