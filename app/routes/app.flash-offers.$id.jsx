import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { Form, useLoaderData, useNavigation, redirect } from "react-router";
import { getFlashOffer, updateFlashOffer, deleteFlashOffer } from "../flash-offers.server";

export async function loader({ request, params }) {
  const { session } = await authenticate.admin(request);

  const offer = await getFlashOffer(session.shop, params.id);
  if (!offer) {
    throw new Response("Not found", { status: 404 });
  }

  return { offer };
}

export async function action({ request, params }) {
  const { session } = await authenticate.admin(request);
  const offer = await getFlashOffer(session.shop, params.id);
  if (!offer) {
    throw new Response("Not found", { status: 404 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await deleteFlashOffer(offer.id);
    return redirect("/app/flash-offers");
  }

  const name = formData.get("name")?.toString().trim();
  const message = formData.get("message")?.toString().trim();
  const backgroundColor = formData.get("backgroundColor")?.toString().trim() || "#2d4a2f";
  const textColor = formData.get("textColor")?.toString().trim() || "#ffffff";
  const showOnDrawer = formData.get("showOnDrawer") === "true";
  const showOnCartPage = formData.get("showOnCartPage") === "true";
  const enabled = formData.get("enabled") === "true";

  const errors = {};
  if (!name) errors.name = "Enter a name";
  if (!message) errors.message = "Enter a message";

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  await updateFlashOffer(offer.id, {
    name,
    message,
    backgroundColor,
    textColor,
    showOnDrawer,
    showOnCartPage,
    enabled,
  });

  return redirect("/app/flash-offers");
}

export default function EditFlashOffer() {
  const { offer } = useLoaderData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <s-page heading={`Edit: ${offer.name}`}>
      <s-section heading="Banner details">
        <Form method="post">
          <s-stack direction="block" gap="base">
            <s-text-field label="Internal name" name="name" defaultValue={offer.name} />
            <s-text-field label="Message" name="message" defaultValue={offer.message} />

            <s-stack direction="inline" gap="base">
              <s-text-field label="Background color (hex)" name="backgroundColor" defaultValue={offer.backgroundColor} />
              <s-text-field label="Text color (hex)" name="textColor" defaultValue={offer.textColor} />
            </s-stack>

            <s-stack direction="inline" gap="base">
              <s-switch name="showOnDrawer" label="Show on cart drawer" value="true" defaultChecked={offer.showOnDrawer} />
              <s-switch name="showOnCartPage" label="Show on cart page" value="true" defaultChecked={offer.showOnCartPage} />
            </s-stack>

            <s-switch name="enabled" label="Enabled" value="true" defaultChecked={offer.enabled} />

            <s-button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </s-button>
          </s-stack>
        </Form>

        <Form
          method="post"
          onSubmit={(event) => {
            if (!confirm(`Delete "${offer.name}"? This cannot be undone.`)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="intent" value="delete" />
          <s-button variant="tertiary" tone="critical" type="submit" disabled={isSubmitting}>
            Delete Flash Offer
          </s-button>
        </Form>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
