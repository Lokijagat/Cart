/*
  Warnings:

  - You are about to drop the column `hideAboveCartValue` on the `FlashOffer` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `FlashOffer` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "FlashOfferMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flashOfferId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "minCartValue" REAL,
    "maxCartValue" REAL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FlashOfferMessage_flashOfferId_fkey" FOREIGN KEY ("flashOfferId") REFERENCES "FlashOffer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FlashOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL DEFAULT '#2d4a2f',
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "showOnDrawer" BOOLEAN NOT NULL DEFAULT true,
    "showOnCartPage" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FlashOffer" ("backgroundColor", "createdAt", "enabled", "id", "name", "shop", "showOnCartPage", "showOnDrawer", "textColor", "updatedAt") SELECT "backgroundColor", "createdAt", "enabled", "id", "name", "shop", "showOnCartPage", "showOnDrawer", "textColor", "updatedAt" FROM "FlashOffer";
DROP TABLE "FlashOffer";
ALTER TABLE "new_FlashOffer" RENAME TO "FlashOffer";
CREATE INDEX "FlashOffer_shop_idx" ON "FlashOffer"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "FlashOfferMessage_flashOfferId_idx" ON "FlashOfferMessage"("flashOfferId");
