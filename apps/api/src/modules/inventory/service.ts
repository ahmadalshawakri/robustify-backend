import type { PrismaClient } from "@prisma/client";
import { MATERIALS, MATERIAL_CATEGORIES, materialLabel } from "@robustify/shared";

/** Stock below this many packs is flagged as low. */
export const LOW_STOCK_PACKS = 2;

/** Stock for every material in the catalogue, with what is still on order. */
export async function listInventory(prisma: PrismaClient) {
  const [items, openPurchases] = await Promise.all([
    prisma.inventoryItem.findMany(),
    prisma.purchase.findMany({
      where: { status: { in: ["UPCOMING", "PARTIAL"] } },
      select: { category: true, materialType: true, quantity: true, quantityReceived: true },
    }),
  ]);

  return MATERIAL_CATEGORIES.flatMap((category) => {
    const material = MATERIALS[category];
    return Object.keys(material.types).map((materialType) => {
      const item = items.find((i) => i.category === category && i.materialType === materialType);
      const quantity = item?.quantity ?? 0;
      const incomingPacks = openPurchases
        .filter((p) => p.category === category && p.materialType === materialType)
        .reduce((sum, p) => sum + p.quantity - p.quantityReceived, 0);
      return {
        category,
        materialType,
        label: materialLabel(category, materialType),
        unit: material.unit,
        packSize: material.packSize,
        quantity,
        packs: Math.round((quantity / material.packSize) * 10) / 10,
        incomingPacks,
        location: item?.location ?? null,
        low: quantity < LOW_STOCK_PACKS * material.packSize,
      };
    });
  });
}
