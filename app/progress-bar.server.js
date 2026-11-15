import prisma from "./db.server";

export function getProgressBar(shop) {
  return prisma.progressBar.findUnique({
    where: { shop },
    include: { tiers: { orderBy: { position: "asc" } } },
  });
}

async function callAdmin(admin, query, variables) {
  const response = await admin.graphql(query, { variables });
  const data = await response.json();
  return data.data;
}

/**
 * Each spend tier is its own native "amount off order" automatic discount
 * (no Shopify Function — Functions on a custom app need Shopify Plus, which
 * this store doesn't have). combinesWith.orderDiscounts is false on every
 * tier so that when a cart clears more than one threshold, Shopify applies
 * only the single best (highest-value) tier rather than stacking them.
 */
async function createTierDiscount(admin, tier) {
  const result = await callAdmin(
    admin,
    `#graphql
    mutation CreateProgressBarTier($discount: DiscountAutomaticBasicInput!) {
      discountAutomaticBasicCreate(automaticBasicDiscount: $discount) {
        automaticDiscountNode {
          id
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      discount: {
        title: `Mixmach Progress Bar — ${tier.percentage}% at ₹${tier.minimumAmount}+`,
        startsAt: new Date().toISOString(),
        endsAt: null,
        combinesWith: {
          orderDiscounts: false,
          productDiscounts: true,
          shippingDiscounts: true,
        },
        minimumRequirement: {
          subtotal: { greaterThanOrEqualToAmount: String(tier.minimumAmount) },
        },
        customerGets: {
          appliesOnOneTimePurchase: true,
          appliesOnSubscription: false,
          items: { all: true },
          value: { percentage: tier.percentage / 100 },
        },
      },
    },
  );

  const errors = result.discountAutomaticBasicCreate.userErrors;
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }
  return result.discountAutomaticBasicCreate.automaticDiscountNode.id;
}

async function deleteDiscount(admin, shopifyDiscountId) {
  if (!shopifyDiscountId) return;
  const result = await callAdmin(
    admin,
    `#graphql
    mutation DeleteProgressBarDiscount($id: ID!) {
      discountAutomaticDelete(id: $id) {
        userErrors {
          field
          message
        }
      }
    }`,
    { id: shopifyDiscountId },
  );
  const errors = result.discountAutomaticDelete.userErrors;
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }
}

async function createFreeShippingDiscount(admin, freeShippingThreshold) {
  const result = await callAdmin(
    admin,
    `#graphql
    mutation CreateProgressBarShipping($discount: DiscountAutomaticFreeShippingInput!) {
      discountAutomaticFreeShippingCreate(freeShippingAutomaticDiscount: $discount) {
        automaticDiscountNode {
          id
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      discount: {
        title: `Mixmach Progress Bar — Free shipping at ₹${freeShippingThreshold}+`,
        startsAt: new Date().toISOString(),
        endsAt: null,
        combinesWith: {
          orderDiscounts: true,
          productDiscounts: true,
        },
        minimumRequirement: {
          subtotal: { greaterThanOrEqualToAmount: String(freeShippingThreshold) },
        },
      },
    },
  );

  const errors = result.discountAutomaticFreeShippingCreate.userErrors;
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }
  return result.discountAutomaticFreeShippingCreate.automaticDiscountNode.id;
}

/**
 * Creates or updates the shop's single Progress Bar row, keeping the
 * underlying native Shopify discounts in sync. Tiers are always replaced
 * wholesale (matching how the admin form submits them), so on every save
 * with enabled: true we delete the previous tiers' and free-shipping
 * discounts, then create fresh ones for the new config.
 */
export async function saveProgressBar(admin, shop, input) {
  const { enabled, freeShippingThreshold, showOnDrawer, showOnCartPage, tiers } = input;

  const existing = await prisma.progressBar.findUnique({
    where: { shop },
    include: { tiers: true },
  });

  for (const tier of existing?.tiers ?? []) {
    await deleteDiscount(admin, tier.shopifyDiscountId);
  }
  await deleteDiscount(admin, existing?.freeShippingDiscountId);

  let freeShippingDiscountId = null;
  let tiersWithDiscountIds = tiers.map((t) => ({ ...t }));

  if (enabled) {
    if (freeShippingThreshold != null) {
      freeShippingDiscountId = await createFreeShippingDiscount(admin, freeShippingThreshold);
    }
    for (const tier of tiersWithDiscountIds) {
      tier.shopifyDiscountId = await createTierDiscount(admin, tier);
    }
  }

  return prisma.progressBar.upsert({
    where: { shop },
    create: {
      shop,
      enabled,
      freeShippingThreshold,
      showOnDrawer,
      showOnCartPage,
      freeShippingDiscountId,
      tiers: { create: tiersWithDiscountIds.map((t, index) => ({ ...t, position: index })) },
    },
    update: {
      enabled,
      freeShippingThreshold,
      showOnDrawer,
      showOnCartPage,
      freeShippingDiscountId,
      tiers: {
        deleteMany: {},
        create: tiersWithDiscountIds.map((t, index) => ({ ...t, position: index })),
      },
    },
    include: { tiers: true },
  });
}

export function parseTiersFromFormData(formData) {
  const minimums = formData.getAll("tierMinimumAmount").map((v) => v.toString().trim());
  const percentages = formData.getAll("tierPercentage").map((v) => v.toString().trim());

  const tiers = [];
  const errors = [];

  minimums.forEach((minRaw, i) => {
    const percentRaw = percentages[i];
    if (!minRaw && !percentRaw) return;

    const minimumAmount = Number(minRaw);
    const percentage = Number(percentRaw);

    if (!Number.isFinite(minimumAmount) || minimumAmount < 0) {
      errors.push(`Tier ${i + 1}: enter a valid minimum cart value`);
      return;
    }
    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
      errors.push(`Tier ${i + 1}: enter a percent off between 0 and 100`);
      return;
    }

    tiers.push({ minimumAmount, percentage });
  });

  return { tiers, errors };
}
