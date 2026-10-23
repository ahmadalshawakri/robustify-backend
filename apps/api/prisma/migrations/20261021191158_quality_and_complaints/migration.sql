-- CreateEnum
CREATE TYPE "QualityCostCategory" AS ENUM ('MAINTENANCE', 'TRAINING', 'EQUIPMENT', 'INSPECTION', 'DEFECT', 'REWORK', 'LOST_CUSTOMER');

-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN     "cost" DECIMAL(12,2),
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "QualityCost" (
    "id" SERIAL NOT NULL,
    "month" DATE NOT NULL,
    "category" "QualityCostCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QualityCost_month_idx" ON "QualityCost"("month");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_responsibleId_idx" ON "Complaint"("responsibleId");
