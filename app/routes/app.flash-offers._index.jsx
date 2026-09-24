import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { Form, useLoaderData, useNavigation } from "react-router";
import { listFlashOffers, getFlashOffer, updateFlashOffer, deleteFlashOffer } from "../flash-offers.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const flashOffers = await listFlashOffers(session.shop);
  return { flashOffers };
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id");

  const offer = await getFlashOffer(session.shop, id);
  if (!offer) {
    return { error: "Flash offer not found" };
  }

  if (intent === "delete") {
    await deleteFlashOffer(offer.id);
  } else if (intent === "toggle") {
    await updateFlashOffer(offer.id, { enabled: !offer.enabled });
  }

  return { ok: true };
}

export default function FlashOffersList() {
  const { flashOffers } = useLoaderData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <s-page heading="Flash Offers">
      <s-section heading="Cart flash offer banners">
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
            <s-text tone="subdued">
              Every enabled offer is shown wherever you place the Mixmach block/embed.
            </s-text>
            <s-button href="/app/flash-offers/new" variant="primary">Create Flash Offer</s-button>
          </s-stack>

          {flashOffers.length === 0 ? (
            <s-text tone="subdued">No flash offers yet.</s-text>
          ) : (
            <s-table variant="auto">
              <s-table-header-row>
                <s-table-header listSlot="primary">Name</s-table-header>
                <s-table-header listSlot="secondary">Message</s-table-header>
                <s-table-header listSlot="secondary">Status</s-table-header>
                <s-table-header listSlot="inline">Actions</s-table-header>
              </s-table-header-row>
              <s-table-body>
                {flashOffers.map((offer) => (
                  <s-table-row key={offer.id}>
                    <s-table-cell>{offer.name}</s-table-cell>
                    <s-table-cell>{offer.message}</s-table-cell>
                    <s-table-cell>
                      <s-badge tone={offer.enabled ? "success" : "neutral"}>
                        {offer.enabled ? "ENABLED" : "DISABLED"}
                      </s-badge>
                    </s-table-cell>
                    <s-table-cell>
                      <s-stack direction="inline" gap="small-300">
                        <s-button href={`/app/flash-offers/${offer.id}`} variant="tertiary">Edit</s-button>

                        <Form method="post">
                          <input type="hidden" name="id" value={offer.id} />
                          <input type="hidden" name="intent" value="toggle" />
                          <s-button variant="tertiary" type="submit" disabled={isSubmitting}>
                            {offer.enabled ? "Disable" : "Enable"}
                          </s-button>
                        </Form>

                        <Form
                          method="post"
                          onSubmit={(event) => {
                            if (!confirm(`Delete "${offer.name}"?`)) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="id" value={offer.id} />
                          <input type="hidden" name="intent" value="delete" />
                          <s-button variant="tertiary" tone="critical" type="submit" disabled={isSubmitting}>
                            Delete
                          </s-button>
                        </Form>
                      </s-stack>
                    </s-table-cell>
                  </s-table-row>
                ))}
              </s-table-body>
            </s-table>
          )}
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
