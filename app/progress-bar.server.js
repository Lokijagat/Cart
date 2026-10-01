import prisma from "./db.server";

const METAFIELD_NAMESPACE = "$app:mixmach-progress";
const METAFIELD_KEY = "configuration";
const FUNCTION_HANDLE = "mixmach-discount";

export function getProgressBar(shop) {
  return prisma.progressBar.findUnique({
    where: { shop },
    include: { tiers: { orderBy: { position: "asc" } } },
  });
}

function configMetafield({ freeShippingThreshold, tiers }) {
  return {
    namespace: METAFIELD_NAMESPACE,
    key: METAFIELD_KEY,
    type: "json",
    value: JSON.stringify({
      freeShippingThreshold,
      tiers: tiers.map((t) => ({ minimumAmount: t.minimumAmount, percentage: t.percentage })),
    }),
  };
}

async function callAdmin(admin, query, variables) {
  const response = await admin.graphql(query, { variables });
  const data = await response.json();
  return data.data;
}

const CREATE_MUTATION = `#graphql
  mutation CreateMixmachProgressBar($discount: DiscountAutomaticAppInput!) {
    discountAutomaticAppCreate(automaticAppDiscount: $discount) {
      automaticAppDiscount {
        discountId
      }
      userErrors {
        field
        message
      }
    }
  }`;

const UPDATE_MUTATION = `#graphql
  mutation UpdateMixmachProgressBar($id: ID!, $discount: DiscountAutomaticAppInput!) {
    discountAutomaticAppUpdate(id: $id, automaticAppDiscount: $discount) {
      userErrors {
        field
        message
      }
    }
  }`;

const DELETE_MUTATION = `#graphql
  mutation DeleteMixmachProgressBar($id: ID!) {
    discountAutomaticDelete(id: $id) {
      userErrors {
        field
        message
      }
    }
  }`;

function discountInput({ freeShippingThreshold, tiers, endsAt }) {
  return {
    title: "Mixmach Progress Bar",
    functionHandle: FUNCTION_HANDLE,
    discountClasses: ["ORDER", "SHIPPING"],
    combinesWith: {
      orderDiscounts: true,
      productDiscounts: true,
      shippingDiscounts: true,
    },
    startsAt: new Date().toISOString(),
    endsAt,
    metafields: [configMetafield({ freeShippingThreshold, tiers })],
  };
}

/**
 * Creates or updates the shop's single Progress Bar row, keeping the
 * underlying Shopify automatic discount in sync:
 * - enabled: false -> deletes the Shopify discount (config stays in our DB).
 * - enabled: true, no existing Shopify discount -> creates it.
 * - enabled: true, existing Shopify discount -> updates title/metafield.
 */
export async function saveProgressBar(admin, shop, input) {
  const { enabled, freeShippingThreshold, showOnDrawer, showOnCartPage, tiers } = input;

  const existing = await prisma.progressBar.findUnique({ where: { shop } });
  let shopifyDiscountId = existing?.shopifyDiscountId ?? null;

  if (!enabled && shopifyDiscountId) {
    await deleteShopifyDiscount(admin, shopifyDiscountId);
    shopifyDiscountId = null;
  } else if (enabled && !shopifyDiscountId) {
    const result = await callAdmin(admin, CREATE_MUTATION, {
      discount: discountInput({ freeShippingThreshold, tiers, endsAt: null }),
    });
    const errors = result.discountAutomaticAppCreate.userErrors;
    if (errors.length > 0) {
      throw new Error(errors.map((e) => e.message).join(", "));
    }
    shopifyDiscountId = result.discountAutomaticAppCreate.automaticAppDiscount.discountId;
  } else if (enabled && shopifyDiscountId) {
    const result = await callAdmin(admin, UPDATE_MUTATION, {
      id: shopifyDiscountId,
      discount: discountInput({ freeShippingThreshold, tiers, endsAt: null }),
    });
    const errors = result.discountAutomaticAppUpdate.userErrors;
    if (errors.length > 0) {
      throw new Error(errors.map((e) => e.message).join(", "));
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
      shopifyDiscountId,
      tiers: { create: tiers.map((t, index) => ({ ...t, position: index })) },
    },
    update: {
      enabled,
      freeShippingThreshold,
      showOnDrawer,
      showOnCartPage,
      shopifyDiscountId,
      tiers: {
        deleteMany: {},
        create: tiers.map((t, index) => ({ ...t, position: index })),
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

async function deleteShopifyDiscount(admin, shopifyDiscountId) {
  const result = await callAdmin(admin, DELETE_MUTATION, { id: shopifyDiscountId });
  const errors = result.discountAutomaticDelete.userErrors;
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }
}
