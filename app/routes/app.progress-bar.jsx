import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { Form, useLoaderData, useNavigation, useActionData } from "react-router";
import { getProgressBar, saveProgressBar, parseTiersFromFormData } from "../progress-bar.server";
import { ProgressBarTiersField } from "../components/ProgressBarTiersField";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const progressBar = await getProgressBar(session.shop);
  return { progressBar };
}

export async function action({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();

  const enabled = formData.get("enabled") === "true";
  const showOnDrawer = formData.get("showOnDrawer") === "true";
  const showOnCartPage = formData.get("showOnCartPage") === "true";
  const freeShippingThresholdRaw = formData.get("freeShippingThreshold")?.toString().trim();
  const freeShippingThreshold =
    freeShippingThresholdRaw === "" || freeShippingThresholdRaw == null
      ? null
      : Number(freeShippingThresholdRaw);

  const { tiers, errors: tierErrors } = parseTiersFromFormData(formData);

  const errors = {};
  if (freeShippingThreshold != null && (!Number.isFinite(freeShippingThreshold) || freeShippingThreshold < 0)) {
    errors.freeShippingThreshold = "Enter a valid amount or leave it blank";
  }
  if (tierErrors.length > 0) errors.tiers = tierErrors;

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    await saveProgressBar(admin, session.shop, {
      enabled,
      freeShippingThreshold,
      showOnDrawer,
      showOnCartPage,
      tiers,
    });
  } catch (error) {
    return { errors: { form: error.message } };
  }

  return { ok: true };
}

export default function ProgressBarSettings() {
  const { progressBar } = useLoaderData();
  const navigation = useNavigation();
  const actionData = useActionData();
  const isSubmitting = navigation.state === "submitting";

  return (
    <s-page heading="Progress Bar">
      <s-section heading="Spend-based order discount + free shipping">
        <Form method="post">
          <s-stack direction="block" gap="base">
            <s-text tone="subdued">
              Shown in the cart drawer/page. As the customer&rsquo;s cart total grows, they unlock
              the next tier automatically — the discount actually applies at checkout.
            </s-text>

            {actionData?.errors?.form && <s-text tone="critical">{actionData.errors.form}</s-text>}

            <s-switch name="enabled" label="Enabled" value="true" defaultChecked={progressBar?.enabled ?? false} />

            <s-text-field
              label="Free shipping threshold (optional)"
              name="freeShippingThreshold"
              type="number"
              min="0"
              step="0.01"
              defaultValue={progressBar?.freeShippingThreshold ?? ""}
              details="Leave blank to not offer free shipping"
            />
            {actionData?.errors?.freeShippingThreshold && (
              <s-text tone="critical">{actionData.errors.freeShippingThreshold}</s-text>
            )}

            <s-stack direction="inline" gap="base">
              <s-switch
                name="showOnDrawer"
                label="Show on cart drawer"
                value="true"
                defaultChecked={progressBar?.showOnDrawer ?? true}
              />
              <s-switch
                name="showOnCartPage"
                label="Show on cart page"
                value="true"
                defaultChecked={progressBar?.showOnCartPage ?? true}
              />
            </s-stack>

            {actionData?.errors?.tiers && (
              <s-stack direction="block" gap="small-300">
                {actionData.errors.tiers.map((err) => (
                  <s-text key={err} tone="critical">{err}</s-text>
                ))}
              </s-stack>
            )}
            <ProgressBarTiersField initialRows={progressBar?.tiers ?? null} />

            <s-button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </s-button>
          </s-stack>
        </Form>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
