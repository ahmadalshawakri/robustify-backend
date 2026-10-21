import type { ContactType, Prisma, PrismaClient } from "@prisma/client";
import type { ContactInput } from "@robustify/shared";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Finds the customer or supplier by email, creating it on first use.
 * Details typed on a new order or purchase refresh the stored ones.
 */
export function upsertContact(db: Db, type: ContactType, input: ContactInput) {
  const { email, ...details } = input;
  return db.contact.upsert({
    where: { email_type: { email, type } },
    create: { type, email, ...details },
    update: details,
  });
}

export function listContacts(prisma: PrismaClient, filter: { type?: ContactType; q?: string }) {
  return prisma.contact.findMany({
    where: {
      type: filter.type,
      ...(filter.q
        ? {
            OR: [
              { name: { contains: filter.q, mode: "insensitive" } },
              { email: { contains: filter.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });
}
