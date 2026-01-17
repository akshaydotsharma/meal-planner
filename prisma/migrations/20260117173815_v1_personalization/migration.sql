-- AlterTable
ALTER TABLE "OptionFeedback" ADD COLUMN "reason" TEXT;
ALTER TABLE "OptionFeedback" ADD COLUMN "reasonNote" TEXT;

-- CreateTable
CREATE TABLE "PreferenceSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "summaryText" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SavedMeal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "optionItemId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedMeal_optionItemId_fkey" FOREIGN KEY ("optionItemId") REFERENCES "OptionItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedMeal_optionItemId_key" ON "SavedMeal"("optionItemId");
