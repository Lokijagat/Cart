import { DiscountClass, DeliveryDiscountSelectionStrategy } from '../generated/api';

/**
  * @typedef {import("../generated/api").DeliveryInput} RunInput
  * @typedef {import("../generated/api").CartDeliveryOptionsDiscountsGenerateRunResult} CartDeliveryOptionsDiscountsGenerateRunResult
  */

const NO_DISCOUNT = { operations: [] };

/**
 * Mixmach progress-bar free shipping: once the cart subtotal reaches the
 * configured threshold, every delivery group in the cart becomes free.
 *
 * @param {RunInput} input
 * @returns {CartDeliveryOptionsDiscountsGenerateRunResult}
 */
export function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const hasShippingDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Shipping,
  );
  if (!hasShippingDiscountClass) {
    return NO_DISCOUNT;
  }

  const rawConfig = input.discount.metafield?.value;
  if (!rawConfig) {
    return NO_DISCOUNT;
  }

  /** @type {{ freeShippingThreshold?: number }} */
  let config;
  try {
    config = JSON.parse(rawConfig);
  } catch {
    return NO_DISCOUNT;
  }

  const threshold = Number(config.freeShippingThreshold);
  if (!Number.isFinite(threshold) || threshold < 0) {
    return NO_DISCOUNT;
  }

  const subtotal = Number(input.cart.cost.subtotalAmount.amount);
  if (subtotal < threshold) {
    return NO_DISCOUNT;
  }

  const deliveryGroups = input.cart.deliveryGroups;
  if (!deliveryGroups.length) {
    return NO_DISCOUNT;
  }

  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates: deliveryGroups.map((group) => ({
            message: 'Free shipping unlocked',
            targets: [{ deliveryGroup: { id: group.id } }],
            value: { percentage: { value: 100 } },
          })),
          selectionStrategy: DeliveryDiscountSelectionStrategy.All,
        },
      },
    ],
  };
}
