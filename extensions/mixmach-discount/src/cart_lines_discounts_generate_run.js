import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
  OrderDiscountSelectionStrategy,
} from '../generated/api';

/**
  * @typedef {import("../generated/api").CartInput} RunInput
  * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
  */

const NO_DISCOUNT = { operations: [] };

/**
 * Mixmach "buy N from a collection for a fixed price" bundle discount.
 *
 * Eligible units (cart line quantity where the product is in the configured
 * collection) are pooled together, sorted highest price first, and grouped
 * into complete bundles of `quantity`. Each complete bundle gets its own
 * discount candidate: total price of that bundle's units minus the fixed
 * `bundlePrice`, split across the cart lines it drew from. Highest-priced
 * units are bundled first so any leftover (non-multiple) units — which stay
 * at full price — are always the cheapest ones, minimizing the customer's
 * total.
 *
 * @param {RunInput} input
 * @returns {CartLinesDiscountsGenerateRunResult}
 */
export function cartLinesDiscountsGenerateRun(input) {
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );
  const hasOrderDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Order,
  );

  const operations = [];

  if (hasProductDiscountClass) {
    const productOperation = buildProductDiscountOperation(input);
    if (productOperation) operations.push(productOperation);
  }

  if (hasOrderDiscountClass) {
    const orderOperation = buildOrderDiscountOperation(input);
    if (orderOperation) operations.push(orderOperation);
  }

  return operations.length > 0 ? { operations } : NO_DISCOUNT;
}

/**
 * Mixmach "spend X, get Y% off the order" progress-bar tiers. Each tier
 * becomes its own candidate guarded by Shopify's own `orderMinimumSubtotal`
 * condition, so Shopify picks whichever tier the current subtotal actually
 * qualifies for (selectionStrategy MAXIMUM picks the best one if several do).
 *
 * @param {RunInput} input
 */
function buildOrderDiscountOperation(input) {
  const rawConfig = input.discount.progressBarMetafield?.value;
  if (!rawConfig) return null;

  /** @type {{ tiers?: { minimumAmount?: number, percentage?: number }[] }} */
  let config;
  try {
    config = JSON.parse(rawConfig);
  } catch {
    return null;
  }

  const tiers = Array.isArray(config.tiers) ? config.tiers : [];
  const candidates = [];

  for (const tier of tiers) {
    const minimumAmount = Number(tier.minimumAmount);
    const percentage = Number(tier.percentage);
    if (!Number.isFinite(minimumAmount) || minimumAmount < 0) continue;
    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) continue;

    candidates.push({
      message: `${percentage}% off orders over ${minimumAmount}`,
      conditions: [
        {
          orderMinimumSubtotal: {
            minimumAmount: minimumAmount.toFixed(2),
            excludedCartLineIds: [],
          },
        },
      ],
      targets: [{ orderSubtotal: { excludedCartLineIds: [] } }],
      value: { percentage: { value: percentage } },
    });
  }

  if (candidates.length === 0) return null;

  return {
    orderDiscountsAdd: {
      candidates,
      selectionStrategy: OrderDiscountSelectionStrategy.Maximum,
    },
  };
}

/**
 * @param {RunInput} input
 */
function buildProductDiscountOperation(input) {
  const rawConfig = input.discount.metafield?.value;
  if (!rawConfig) {
    return null;
  }

  /** @type {{ quantity?: number, bundlePrice?: number }} */
  let config;
  try {
    config = JSON.parse(rawConfig);
  } catch {
    return null;
  }

  const bundleSize = Number(config.quantity);
  const bundlePrice = Number(config.bundlePrice);
  if (!Number.isInteger(bundleSize) || bundleSize <= 0 || !Number.isFinite(bundlePrice) || bundlePrice < 0) {
    return null;
  }

  const eligibleUnits = [];
  for (const line of input.cart.lines) {
    const isEligible = line.merchandise?.product?.eligible;
    if (!isEligible) continue;

    const unitPrice = Number(line.cost.amountPerQuantity.amount);
    for (let i = 0; i < line.quantity; i++) {
      eligibleUnits.push({ lineId: line.id, unitPrice });
    }
  }

  const numBundles = Math.floor(eligibleUnits.length / bundleSize);
  if (numBundles === 0) {
    return null;
  }

  eligibleUnits.sort((a, b) => b.unitPrice - a.unitPrice);
  const bundledUnits = eligibleUnits.slice(0, numBundles * bundleSize);

  const candidates = [];
  for (let bundleIndex = 0; bundleIndex < numBundles; bundleIndex++) {
    const group = bundledUnits.slice(
      bundleIndex * bundleSize,
      (bundleIndex + 1) * bundleSize,
    );
    const groupSubtotal = group.reduce((sum, unit) => sum + unit.unitPrice, 0);
    const discountAmount = groupSubtotal - bundlePrice;

    if (discountAmount <= 0) {
      continue;
    }

    const quantityByLine = new Map();
    for (const unit of group) {
      quantityByLine.set(unit.lineId, (quantityByLine.get(unit.lineId) ?? 0) + 1);
    }

    candidates.push({
      message: `Bundle deal: ${bundleSize} for ${bundlePrice}`,
      targets: Array.from(quantityByLine, ([id, quantity]) => ({
        cartLine: { id, quantity },
      })),
      value: {
        fixedAmount: {
          amount: discountAmount.toFixed(2),
          appliesToEachItem: false,
        },
      },
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  return {
    productDiscountsAdd: {
      candidates,
      selectionStrategy: ProductDiscountSelectionStrategy.All,
    },
  };
}
