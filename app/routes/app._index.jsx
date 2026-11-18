import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { Form, useLoaderData, useNavigation } from "react-router";
import { listDiscounts, getDiscount, updateDiscount, deleteDiscount } from "../discounts.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const discounts = await listDiscounts(session.shop);

  // Theme editor deep links (App Store requirement 5.1.3). The handles are
  // the block filenames in extensions/mixmach-cart/blocks.
  // eslint-disable-next-line no-undef
  const apiKey = process.env.SHOPIFY_API_KEY || "";
  const editorUrl = `https://${session.shop}/admin/themes/current/editor`;
  const setupLinks = {
    drawerEmbed: `${editorUrl}?context=apps&activateAppId=${apiKey}/flash-offer-drawer`,
    flashOfferBlock: `${editorUrl}?template=cart&addAppBlockId=${apiKey}/flash-offer-page&target=newAppsSection`,
    progressBarBlock: `${editorUrl}?template=cart&addAppBlockId=${apiKey}/progress-bar-page&target=newAppsSection`,
  };

  return { discounts, setupLinks };
}

export async function action({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("discountId");

  const discount = await getDiscount(session.shop, id);
  if (!discount) {
    return { error: "Discount not found" };
  }

  try {
    if (intent === "delete") {
      await deleteDiscount(admin, discount);
    } else if (intent === "activate") {
      await updateDiscount(admin, discount, { ...discount, status: "ACTIVE" });
    } else if (intent === "disable") {
      await updateDiscount(admin, discount, { ...discount, status: "DISABLED" });
    }
  } catch (error) {
    return { error: error.message };
  }

  return { ok: true };
}

const STATUS_TONE = {
  ACTIVE: "success",
  DRAFT: "neutral",
  DISABLED: "warning",
};

export default function Dashboard() {
  const { discounts, setupLinks } = useLoaderData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <s-page heading="Mixmach">
      <s-section heading="Set up Mixmach in your theme">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Bundle discounts work at checkout as soon as you create them. To
            show flash offers and the progress bar to shoppers, add Mixmach to
            your theme. Each button opens the theme editor with the block
            ready to add. Click Save in the theme editor to finish.
          </s-paragraph>
          <s-ordered-list>
            <s-list-item>
              <s-stack direction="block" gap="small-200">
                <s-text type="strong">Turn on the cart drawer embed</s-text>
                <s-text>
                  Shows flash offers and the progress bar inside the cart
                  drawer. In the theme editor, under App embeds, make sure
                  &quot;Mixmach Drawer Offers&quot; is on.
                </s-text>
                <s-button href={setupLinks.drawerEmbed} target="_blank">
                  Turn on drawer embed
                </s-button>
              </s-stack>
            </s-list-item>
            <s-list-item>
              <s-stack direction="block" gap="small-200">
                <s-text type="strong">Add flash offers to the cart page</s-text>
                <s-text>
                  Adds the &quot;Mixmach Flash Offers&quot; block to your cart
                  page template.
                </s-text>
                <s-button href={setupLinks.flashOfferBlock} target="_blank">
                  Add flash offers block
                </s-button>
              </s-stack>
            </s-list-item>
            <s-list-item>
              <s-stack direction="block" gap="small-200">
                <s-text type="strong">Add the progress bar to the cart page</s-text>
                <s-text>
                  Adds the &quot;Mixmach Progress Bar&quot; block to your cart
                  page template.
                </s-text>
                <s-button href={setupLinks.progressBarBlock} target="_blank">
                  Add progress bar block
                </s-button>
              </s-stack>
            </s-list-item>
          </s-ordered-list>
          <s-paragraph>
            Then create offers under Flash Offers and set up tiers under
            Progress Bar.
          </s-paragraph>
        </s-stack>
      </s-section>
      <s-section heading="Bundle discounts">
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
            <s-text>
              Buy N products from a collection for a fixed bundle price.
            </s-text>
            <s-button href="/app/discounts/new" variant="primary">Create Discount</s-button>
          </s-stack>

          {discounts.length === 0 ? (
            <s-text tone="subdued">
              No Mixmach discounts yet. Create one to get started.
            </s-text>
          ) : (
            <s-table variant="auto">
              <s-table-header-row>
                <s-table-header listSlot="primary">Name</s-table-header>
                <s-table-header listSlot="secondary">Collection</s-table-header>
                <s-table-header listSlot="secondary">Offer</s-table-header>
                <s-table-header listSlot="secondary">Status</s-table-header>
                <s-table-header listSlot="inline">Actions</s-table-header>
              </s-table-header-row>
              <s-table-body>
                {discounts.map((discount) => (
                  <s-table-row key={discount.id}>
                    <s-table-cell>{discount.name}</s-table-cell>
                    <s-table-cell>{discount.collectionTitle}</s-table-cell>
                    <s-table-cell>
                      {discount.quantity} for {discount.bundlePrice}
                    </s-table-cell>
                    <s-table-cell>
                      <s-badge tone={STATUS_TONE[discount.status] ?? "neutral"}>
                        {discount.status}
                      </s-badge>
                    </s-table-cell>
                    <s-table-cell>
                      <s-stack direction="inline" gap="small-300">
                        <s-button href={`/app/discounts/${discount.id}`} variant="tertiary">Edit</s-button>

                        {discount.status === "ACTIVE" ? (
                          <Form method="post">
                            <input type="hidden" name="discountId" value={discount.id} />
                            <input type="hidden" name="intent" value="disable" />
                            <s-button variant="tertiary" type="submit" disabled={isSubmitting}>
                              Disable
                            </s-button>
                          </Form>
                        ) : (
                          <Form method="post">
                            <input type="hidden" name="discountId" value={discount.id} />
                            <input type="hidden" name="intent" value="activate" />
                            <s-button variant="tertiary" type="submit" disabled={isSubmitting}>
                              Activate
                            </s-button>
                          </Form>
                        )}

                        <Form
                          method="post"
                          onSubmit={(event) => {
                            if (!confirm(`Delete "${discount.name}"?`)) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="discountId" value={discount.id} />
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
