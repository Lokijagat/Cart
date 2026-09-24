/*
  Warnings:

  - You are about to drop the `FlashOfferMessage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `message` to the `FlashOffer` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "FlashOfferMessage_flashOfferId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "FlashOfferMessage";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FlashOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
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
