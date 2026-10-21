import type { Prisma, PrismaClient, PurchaseStatus } from "@prisma/client";
import { type CreatePurchaseInput, MATERIALS, materialLabel } from "@robustify/shared";
import { HttpError } from "../../http/errors";
import { toNumber } from "../../http/money";
import { upsertContact } from "../contacts/service";

const include = {
  supplier: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.PurchaseInclude;

type Row = Prisma.PurchaseGetPayload<{ include: typeof include }>;

function toPurchase(purchase: Row) {
  const material = MATERIALS[purchase.category];
  return {
    ...purchase,
    cost: toNumber(purchase.cost),
    materialLabel: materialLabel(purchase.category, purchase.materialType),
    packSize: material.packSize,
    unit: material.unit,
  };
}

export async function listPurchases(prisma: PrismaClient, filter: { status?: PurchaseStatus }) {
  const purchases = await prisma.purchase.findMany({
    where: filter,
    include,
    orderBy: [{ purchaseDate: "desc" }, { id: "desc" }],
  });
  return purchases.map(toPurchase);
}

export async function getPurchase(prisma: PrismaClient, id: number) {
  const purchase = await prisma.purchase.findUnique({ where: { id }, include });
  if (!purchase) throw HttpError.notFound("Purchase not found");
  return toPurchase(purchase);
}

export async function createPurchase(prisma: PrismaClient, input: CreatePurchaseInput) {
  const { supplier, ...purchase } = input;
  const created = await prisma.$transaction(async (tx) => {
    const contact = await upsertContact(tx, "SUPPLIER", supplier);
    return tx.purchase.create({ data: { ...purchase, supplierId: contact.id }, include });
  });
  return toPurchase(created);
}

/**
 * Books arriving packs into stock. The purchase is BOOKED once everything
 * ordered has arrived, PARTIAL before that.
 */
export async function receivePurchase(prisma: PrismaClient, id: number, packs: number) {
  const updated = await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({ where: { id } });
    if (!purchase) throw HttpError.notFound("Purchase not found");
    if (purchase.status === "CANCELED") throw HttpError.conflict("This purchase was canceled");

    const outstanding = purchase.quantity - purchase.quantityReceived;
    if (outstanding === 0) throw HttpError.conflict("Everything on this purchase has arrived");
    if (packs > outstanding) {
      throw HttpError.badRequest(`Only ${outstanding} packs are still expected`);
    }

    const received = purchase.quantityReceived + packs;
    const { count } = await tx.purchase.updateMany({
      where: { id, quantityReceived: purchase.quantityReceived },
      data: {
        quantityReceived: received,
        status: received === purchase.quantity ? "BOOKED" : "PARTIAL",
        bookedAt: new Date(),
      },
    });
    if (count === 0) throw HttpError.conflict("Someone else just booked this purchase. Reload it.");

    const units = packs * MATERIALS[purchase.category].packSize;
    await tx.inventoryItem.upsert({
      where: {
        category_materialType: { category: purchase.category, materialType: purchase.materialType },
      },
      create: { category: purchase.category, materialType: purchase.materialType, quantity: units },
      update: { quantity: { increment: units } },
    });
    return tx.purchase.findUniqueOrThrow({ where: { id }, include });
  });
  return toPurchase(updated);
}

/** Only purchases with nothing received yet can be canceled. */
export async function cancelPurchase(prisma: PrismaClient, id: number) {
  const { count } = await prisma.purchase.updateMany({
    where: { id, status: "UPCOMING" },
    data: { status: "CANCELED" },
  });
  if (count === 0) {
    const exists = await prisma.purchase.count({ where: { id } });
    throw exists
      ? HttpError.conflict("Only purchases with nothing received can be canceled")
      : HttpError.notFound("Purchase not found");
  }
  return getPurchase(prisma, id);
}
