import prisma from "./db.server";

export function listFlashOffers(shop) {
  return prisma.flashOffer.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });
}

export function getFlashOffer(shop, id) {
  return prisma.flashOffer.findFirst({ where: { shop, id } });
}

export function createFlashOffer(shop, data) {
  return prisma.flashOffer.create({ data: { shop, ...data } });
}

export function updateFlashOffer(id, data) {
  return prisma.flashOffer.update({ where: { id }, data });
}

export function deleteFlashOffer(id) {
  return prisma.flashOffer.delete({ where: { id } });
}

export function listEnabledFlashOffers(shop) {
  return prisma.flashOffer.findMany({
    where: { shop, enabled: true },
    orderBy: { createdAt: "asc" },
  });
}
