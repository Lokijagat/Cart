import prisma from "./db.server";

export function listDiscounts(shop) {
  return prisma.discount.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });
}

export function getDiscount(shop, id) {
  return prisma.discount.findFirst({ where: { shop, id } });
}

async function callAdmin(admin, query, variables) {
  const response = await admin.graphql(query, { variables });
  const data = await response.json();
  return data.data;
}

/**
 * Average price of a collection's products, used to translate a flat
 * "any N for ₹bundlePrice" offer into the percentage-off that a native
 * (non-Function) discount needs. Exact only when every product in the
 * collection shares one price; otherwise this is the best available
 * approximation, since native discounts can't price an arbitrary mix of
 * items down to one fixed total the way a Function could.
 */
async function averageCollectionPrice(admin, collectionId) {
  const result = await callAdmin(
    admin,
    `#graphql
    query CollectionAvgPrice($id: ID!) {
      collection(id: $id) {
        products(first: 100) {
          nodes {
            variants(first: 1) {
              nodes {
                price
              }
            }
          }
        }
      }
    }`,
    { id: collectionId },
  );

  const prices = (result.collection?.products?.nodes || [])
    .map((p) => Number(p.variants?.nodes?.[0]?.price))
    .filter((p) => Number.isFinite(p) && p > 0);

  if (prices.length === 0) return 0;
  return prices.reduce((a, b) => a + b, 0) / prices.length;
}

function percentOffForBundle(avgPrice, quantity, bundlePrice) {
  if (avgPrice <= 0 || quantity <= 0) return 0;
  const fullPrice = avgPrice * quantity;
  const percent = 1 - bundlePrice / fullPrice;
  return Math.min(0.95, Math.max(0, percent));
}

function discountInput({ title, percent, quantity, collectionId, endsAt }) {
  return {
    title,
    startsAt: new Date().toISOString(),
    endsAt,
    combinesWith: {
      orderDiscounts: true,
      productDiscounts: true,
      shippingDiscounts: true,
    },
    minimumRequirement: {
      quantity: { greaterThanOrEqualToQuantity: String(quantity) },
    },
    // Basic discounts reject discountOnQuantity (Buy X Get Y only) and the
    // appliesOn* fields on shops without subscriptions, so the bundle is a
    // plain percentage off the collection's items, unlocked by the minimum
    // quantity above.
    customerGets: {
      items: { collections: { add: [collectionId] } },
      value: { percentage: percent },
    },
  };
}

/**
 * Creates the Discount row in our DB. If status is ACTIVE or DISABLED, also
 * creates the underlying native Shopify automatic discount (no Shopify
 * Function involved — Functions on a custom app require Shopify Plus, which
 * this store doesn't have).
 */
export async function createDiscount(admin, shop, input) {
  const { name, collectionId, collectionTitle, quantity, bundlePrice, status } = input;

  let shopifyDiscountId = null;

  if (status !== "DRAFT") {
    const avgPrice = await averageCollectionPrice(admin, collectionId);
    const percent = percentOffForBundle(avgPrice, quantity, bundlePrice);

    const result = await callAdmin(
      admin,
      `#graphql
      mutation CreateMixmachDiscount($discount: DiscountAutomaticBasicInput!) {
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
        discount: discountInput({
          title: name,
          percent,
          quantity,
          collectionId,
          endsAt: status === "DISABLED" ? pastDate() : null,
        }),
      },
    );

    const errors = result.discountAutomaticBasicCreate.userErrors;
    if (errors.length > 0) {
      throw new Error(errors.map((e) => e.message).join(", "));
    }

    shopifyDiscountId = result.discountAutomaticBasicCreate.automaticDiscountNode.id;
  }

  return prisma.discount.create({
    data: {
      shop,
      name,
      collectionId,
      collectionTitle,
      quantity,
      bundlePrice,
      status,
      shopifyDiscountId,
    },
  });
}

/**
 * Updates a Discount row and keeps the Shopify automatic discount in sync:
 * - DRAFT -> ACTIVE/DISABLED: creates the Shopify discount for the first time.
 * - ACTIVE <-> DISABLED: toggles endsAt on the existing Shopify discount.
 * - any -> DRAFT: deletes the underlying Shopify discount (config stays in our DB only).
 */
export async function updateDiscount(admin, discount, input) {
  const { name, collectionId, collectionTitle, quantity, bundlePrice, status } = input;

  let shopifyDiscountId = discount.shopifyDiscountId;

  if (status === "DRAFT" && shopifyDiscountId) {
    await deleteShopifyDiscount(admin, shopifyDiscountId);
    shopifyDiscountId = null;
  } else if (status !== "DRAFT" && !shopifyDiscountId) {
    const avgPrice = await averageCollectionPrice(admin, collectionId);
    const percent = percentOffForBundle(avgPrice, quantity, bundlePrice);

    const result = await callAdmin(
      admin,
      `#graphql
      mutation CreateMixmachDiscount($discount: DiscountAutomaticBasicInput!) {
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
        discount: discountInput({
          title: name,
          percent,
          quantity,
          collectionId,
          endsAt: status === "DISABLED" ? pastDate() : null,
        }),
      },
    );

    const errors = result.discountAutomaticBasicCreate.userErrors;
    if (errors.length > 0) {
      throw new Error(errors.map((e) => e.message).join(", "));
    }

    shopifyDiscountId = result.discountAutomaticBasicCreate.automaticDiscountNode.id;
  } else if (shopifyDiscountId) {
    const avgPrice = await averageCollectionPrice(admin, collectionId);
    const percent = percentOffForBundle(avgPrice, quantity, bundlePrice);

    const result = await callAdmin(
      admin,
      `#graphql
      mutation UpdateMixmachDiscount($id: ID!, $discount: DiscountAutomaticBasicInput!) {
        discountAutomaticBasicUpdate(id: $id, automaticBasicDiscount: $discount) {
          userErrors {
            field
            message
          }
        }
      }`,
      {
        id: shopifyDiscountId,
        discount: discountInput({
          title: name,
          percent,
          quantity,
          collectionId,
          endsAt: status === "DISABLED" ? pastDate() : null,
        }),
      },
    );

    const errors = result.discountAutomaticBasicUpdate.userErrors;
    if (errors.length > 0) {
      throw new Error(errors.map((e) => e.message).join(", "));
    }
  }

  return prisma.discount.update({
    where: { id: discount.id },
    data: {
      name,
      collectionId,
      collectionTitle,
      quantity,
      bundlePrice,
      status,
      shopifyDiscountId,
    },
  });
}

export async function deleteDiscount(admin, discount) {
  if (discount.shopifyDiscountId) {
    await deleteShopifyDiscount(admin, discount.shopifyDiscountId);
  }
  await prisma.discount.delete({ where: { id: discount.id } });
}

async function deleteShopifyDiscount(admin, shopifyDiscountId) {
  const result = await callAdmin(
    admin,
    `#graphql
    mutation DeleteMixmachDiscount($id: ID!) {
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

function pastDate() {
  return new Date(Date.now() - 60_000).toISOString();
}
