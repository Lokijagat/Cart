import { authenticate } from "../shopify.server";

// Mandatory GDPR webhook: a customer or merchant requested the personal data
// this app holds about a customer. This app never stores customer PII (only
// shop-level config: Discount, FlashOffer, ProgressBar, Session), so there is
// nothing to return beyond acknowledging the request.
export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  return new Response();
};
