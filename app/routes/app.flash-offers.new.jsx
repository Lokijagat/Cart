import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { Form, useNavigation, redirect } from "react-router";
import { createFlashOffer } from "../flash-offers.server";

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

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

  await createFlashOffer(session.shop, {
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

export default function NewFlashOffer() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <s-page heading="Create Flash Offer">
      <s-section heading="Banner details">
        <Form method="post">
          <s-stack direction="block" gap="base">
            <s-text-field label="Internal name" name="name" placeholder="Prepaid nudge" />
            <s-text-field label="Message" name="message" placeholder="⏳ Prepaid Orders are Delivered Faster! ⏳" />

            <s-stack direction="inline" gap="base">
              <s-text-field label="Background color (hex)" name="backgroundColor" defaultValue="#2d4a2f" />
              <s-text-field label="Text color (hex)" name="textColor" defaultValue="#ffffff" />
            </s-stack>

            <s-stack direction="inline" gap="base">
              <s-switch name="showOnDrawer" label="Show on cart drawer" value="true" defaultChecked={true} />
              <s-switch name="showOnCartPage" label="Show on cart page" value="true" defaultChecked={true} />
            </s-stack>

            <s-switch name="enabled" label="Enabled" value="true" />

            <s-button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Flash Offer"}
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
