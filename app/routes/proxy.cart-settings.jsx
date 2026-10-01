import { authenticate } from "../shopify.server";
import { listEnabledFlashOffers } from "../flash-offers.server";
import { getProgressBar } from "../progress-bar.server";

export async function loader({ request }) {
  const { session } = await authenticate.public.appProxy(request);

  if (!session) {
    return Response.json({ flashOffers: [], progressBar: null });
  }

  const offers = await listEnabledFlashOffers(session.shop);
  const flashOffers = offers.map((offer) => ({
    message: offer.message,
    backgroundColor: offer.backgroundColor,
    textColor: offer.textColor,
    showOnDrawer: offer.showOnDrawer,
    showOnCartPage: offer.showOnCartPage,
  }));

  const progressBarRow = await getProgressBar(session.shop);
  const progressBar =
    progressBarRow?.enabled
      ? {
          freeShippingThreshold: progressBarRow.freeShippingThreshold,
          showOnDrawer: progressBarRow.showOnDrawer,
          showOnCartPage: progressBarRow.showOnCartPage,
          tiers: progressBarRow.tiers
            .map((t) => ({ minimumAmount: t.minimumAmount, percentage: t.percentage }))
            .sort((a, b) => a.minimumAmount - b.minimumAmount),
        }
      : null;

  return Response.json({ flashOffers, progressBar });
}
