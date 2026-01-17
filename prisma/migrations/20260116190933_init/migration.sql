-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pantryText" TEXT NOT NULL DEFAULT '',
    "utensilsText" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extraIngredientsText" TEXT NOT NULL DEFAULT '',
    "constraintsJson" TEXT NOT NULL DEFAULT '{}'
);

-- CreateTable
CREATE TABLE "RecommendationSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gpt-4o',
    "promptVersion" TEXT NOT NULL DEFAULT 'v1',
    "rawResponseJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecommendationSet_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OptionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recommendationSetId" TEXT NOT NULL,
    "idx" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "timeMins" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "ingredientsUsedJson" TEXT NOT NULL,
    "missingIngredientsJson" TEXT NOT NULL,
    "stepsJson" TEXT NOT NULL,
    "substitutionsJson" TEXT NOT NULL,
    CONSTRAINT "OptionItem_recommendationSetId_fkey" FOREIGN KEY ("recommendationSetId") REFERENCES "RecommendationSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OptionFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "optionItemId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OptionFeedback_optionItemId_fkey" FOREIGN KEY ("optionItemId") REFERENCES "OptionItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OptionFeedback_optionItemId_key" ON "OptionFeedback"("optionItemId");
