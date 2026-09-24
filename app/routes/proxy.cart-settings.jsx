import { authenticate } from "../shopify.server";
import { listEnabledFlashOffers } from "../flash-offers.server";

export async function loader({ request }) {
  const { session } = await authenticate.public.appProxy(request);

  if (!session) {
    return Response.json({ flashOffers: [] });
  }

  const offers = await listEnabledFlashOffers(session.shop);

  const flashOffers = offers.map((offer) => ({
    message: offer.message,
    backgroundColor: offer.backgroundColor,
    textColor: offer.textColor,
    showOnDrawer: offer.showOnDrawer,
    showOnCartPage: offer.showOnCartPage,
  }));

  return Response.json({ flashOffers });
}
