-- DropTable
DROP TABLE "CartFeature";

-- CreateTable
CREATE TABLE "FlashOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL DEFAULT '#2d4a2f',
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "showOnDrawer" BOOLEAN NOT NULL DEFAULT true,
    "showOnCartPage" BOOLEAN NOT NULL DEFAULT true,
    "hideAboveCartValue" REAL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "FlashOffer_shop_idx" ON "FlashOffer"("shop");
