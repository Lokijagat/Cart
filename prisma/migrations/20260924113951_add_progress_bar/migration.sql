-- CreateTable
CREATE TABLE "ProgressBar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "freeShippingThreshold" REAL,
    "showOnDrawer" BOOLEAN NOT NULL DEFAULT true,
    "showOnCartPage" BOOLEAN NOT NULL DEFAULT true,
    "shopifyDiscountId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProgressBarTier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "progressBarId" TEXT NOT NULL,
    "minimumAmount" REAL NOT NULL,
    "percentage" REAL NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProgressBarTier_progressBarId_fkey" FOREIGN KEY ("progressBarId") REFERENCES "ProgressBar" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgressBar_shop_key" ON "ProgressBar"("shop");

-- CreateIndex
CREATE INDEX "ProgressBarTier_progressBarId_idx" ON "ProgressBarTier"("progressBarId");
