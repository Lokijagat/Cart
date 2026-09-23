import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { Form, useLoaderData, useNavigation } from "react-router";
import { listDiscounts, getDiscount, updateDiscount, deleteDiscount } from "../discounts.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const discounts = await listDiscounts(session.shop);
  return { discounts };
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
  const { discounts } = useLoaderData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <s-page heading="Mixmach">
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
