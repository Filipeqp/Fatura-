-- CreateEnum
CREATE TYPE "BudgetAlertLevel" AS ENUM ('NEAR', 'OVER');

-- CreateTable
CREATE TABLE "CategoryBudgetAlert" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "level" "BudgetAlertLevel" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryBudgetAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryBudgetAlert_categoryId_idx" ON "CategoryBudgetAlert"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryBudgetAlert_categoryId_month_level_key" ON "CategoryBudgetAlert"("categoryId", "month", "level");

-- AddForeignKey
ALTER TABLE "CategoryBudgetAlert" ADD CONSTRAINT "CategoryBudgetAlert_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
