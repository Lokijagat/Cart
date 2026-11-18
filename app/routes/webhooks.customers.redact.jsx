import { authenticate } from "../shopify.server";

// Mandatory GDPR webhook: erase personal data for a specific customer. This
// app never stores customer PII (only shop-level config: Discount,
// FlashOffer, ProgressBar, Session), so there is nothing to redact.
export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  return new Response();
};
