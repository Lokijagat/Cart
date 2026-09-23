import prisma from "./db.server";

const METAFIELD_NAMESPACE = "$app:mixmach-discount";
const METAFIELD_KEY = "configuration";
const FUNCTION_HANDLE = "mixmach-discount";

export function listDiscounts(shop) {
  return prisma.discount.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });
}

export function getDiscount(shop, id) {
  return prisma.discount.findFirst({ where: { shop, id } });
}

function configMetafield({ collectionId, quantity, bundlePrice }) {
  return {
    namespace: METAFIELD_NAMESPACE,
    key: METAFIELD_KEY,
    type: "json",
    value: JSON.stringify({
      collectionIds: [collectionId],
      quantity,
      bundlePrice,
    }),
  };
}

async function callAdmin(admin, query, variables) {
  const response = await admin.graphql(query, { variables });
  const data = await response.json();
  return data.data;
}

/**
 * Creates the Discount row in our DB. If status is ACTIVE or DISABLED, also
 * creates the underlying Shopify automatic discount + Function metafield.
 */
export async function createDiscount(admin, shop, input) {
  const { name, collectionId, collectionTitle, quantity, bundlePrice, status } = input;

  let shopifyDiscountId = null;

  if (status !== "DRAFT") {
    const result = await callAdmin(
      admin,
      `#graphql
      mutation CreateMixmachDiscount($discount: DiscountAutomaticAppInput!) {
        discountAutomaticAppCreate(automaticAppDiscount: $discount) {
          automaticAppDiscount {
            discountId
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        discount: {
          title: name,
          functionHandle: FUNCTION_HANDLE,
          discountClasses: ["PRODUCT"],
          combinesWith: {
            orderDiscounts: true,
            productDiscounts: false,
            shippingDiscounts: true,
          },
          startsAt: new Date().toISOString(),
          endsAt: status === "DISABLED" ? pastDate() : null,
          metafields: [configMetafield({ collectionId, quantity, bundlePrice })],
        },
      },
    );

    const errors = result.discountAutomaticAppCreate.userErrors;
    if (errors.length > 0) {
      throw new Error(errors.map((e) => e.message).join(", "));
    }

    shopifyDiscountId = result.discountAutomaticAppCreate.automaticAppDiscount.discountId;
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
    const result = await callAdmin(
      admin,
      `#graphql
      mutation CreateMixmachDiscount($discount: DiscountAutomaticAppInput!) {
        discountAutomaticAppCreate(automaticAppDiscount: $discount) {
          automaticAppDiscount {
            discountId
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        discount: {
          title: name,
          functionHandle: FUNCTION_HANDLE,
          discountClasses: ["PRODUCT"],
          combinesWith: {
            orderDiscounts: true,
            productDiscounts: false,
            shippingDiscounts: true,
          },
          startsAt: new Date().toISOString(),
          endsAt: status === "DISABLED" ? pastDate() : null,
          metafields: [configMetafield({ collectionId, quantity, bundlePrice })],
        },
      },
    );

    const errors = result.discountAutomaticAppCreate.userErrors;
    if (errors.length > 0) {
      throw new Error(errors.map((e) => e.message).join(", "));
    }

    shopifyDiscountId = result.discountAutomaticAppCreate.automaticAppDiscount.discountId;
  } else if (shopifyDiscountId) {
    const result = await callAdmin(
      admin,
      `#graphql
      mutation UpdateMixmachDiscount($id: ID!, $discount: DiscountAutomaticAppInput!) {
        discountAutomaticAppUpdate(id: $id, automaticAppDiscount: $discount) {
          userErrors {
            field
            message
          }
        }
      }`,
      {
        id: shopifyDiscountId,
        discount: {
          title: name,
          endsAt: status === "DISABLED" ? pastDate() : null,
          metafields: [configMetafield({ collectionId, quantity, bundlePrice })],
        },
      },
    );

    const errors = result.discountAutomaticAppUpdate.userErrors;
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
