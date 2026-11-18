import { authenticate } from "../shopify.server";
import db from "../db.server";

// Mandatory GDPR webhook: fires 48 hours after a shop uninstalls the app and
// requests erasure. Delete all remaining shop-scoped data (app/uninstalled
// already clears the Session row, but the shop's Discount/FlashOffer/
// ProgressBar config can outlive that if the shop reinstalls and uninstalls
// again before this fires).
export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  await db.session.deleteMany({ where: { shop } });
  await db.discount.deleteMany({ where: { shop } });
  await db.flashOffer.deleteMany({ where: { shop } });
  await db.progressBar.deleteMany({ where: { shop } });

  return new Response();
};
