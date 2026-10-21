import type { PrismaClient, QualityCost } from "@prisma/client";
import {
  type CreateQualityCostInput,
  QUALITY_KIND,
  monthKey,
  poorQualityRatio,
  recentMonths,
} from "@robustify/shared";
import { HttpError } from "../../http/errors";
import { toNumber } from "../../http/money";

const round = (n: number) => Math.round(n * 100) / 100;

function toEntry(entry: QualityCost) {
  return {
    ...entry,
    month: monthKey(entry.month),
    amount: toNumber(entry.amount),
    kind: QUALITY_KIND[entry.category],
  };
}

/**
 * Cost of quality for the last `months` months: entered costs, plus what
 * complaints cost to put right, which always counts as poor quality.
 */
export async function qualityReport(prisma: PrismaClient, months: number) {
  const keys = recentMonths(months);
  const from = new Date(`${keys[0]}-01T00:00:00Z`);
  const [entries, complaints] = await Promise.all([
    prisma.qualityCost.findMany({
      where: { month: { gte: from } },
      orderBy: [{ month: "desc" }, { id: "desc" }],
    }),
    prisma.complaint.findMany({
      where: { createdAt: { gte: from }, cost: { not: null } },
      select: { createdAt: true, cost: true },
    }),
  ]);

  const byMonth = new Map(keys.map((k) => [k, { month: k, good: 0, poor: 0, complaints: 0 }]));
  const rows = entries.map(toEntry);
  for (const entry of rows) {
    const month = byMonth.get(entry.month);
    if (!month) continue;
    if (entry.kind === "GOOD") month.good += entry.amount;
    else month.poor += entry.amount;
  }
  for (const complaint of complaints) {
    const month = byMonth.get(monthKey(complaint.createdAt));
    if (month && complaint.cost) month.complaints += toNumber(complaint.cost);
  }

  const summary = [...byMonth.values()].map((m) => {
    const poor = m.poor + m.complaints;
    return {
      month: m.month,
      good: round(m.good),
      poor: round(poor),
      complaints: round(m.complaints),
      poorRatio: round(poorQualityRatio(m.good, poor)),
    };
  });
  const good = summary.reduce((sum, m) => sum + m.good, 0);
  const poor = summary.reduce((sum, m) => sum + m.poor, 0);
  return {
    months: summary,
    totals: {
      good: round(good),
      poor: round(poor),
      poorRatio: round(poorQualityRatio(good, poor)),
    },
    entries: rows,
  };
}

export async function createQualityCost(prisma: PrismaClient, input: CreateQualityCostInput) {
  const entry = await prisma.qualityCost.create({
    data: {
      month: new Date(`${input.month}-01T00:00:00Z`),
      category: input.category,
      amount: input.amount,
      note: input.note ?? null,
    },
  });
  return toEntry(entry);
}

export async function deleteQualityCost(prisma: PrismaClient, id: number) {
  const { count } = await prisma.qualityCost.deleteMany({ where: { id } });
  if (count === 0) throw HttpError.notFound("Entry not found");
}
