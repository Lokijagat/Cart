import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { login } from "../../shopify.server";

// When Shopify sends a `shop` param, login() throws a redirect into OAuth.
// Without one we don't ask the merchant to type their shop domain
// (App Store requirement 2.3.1); we point them back to the Shopify admin.
export const loader = async ({ request }) => {
  await login(request);

  return null;
};

export default function Auth() {
  return (
    <AppProvider embedded={false}>
      <s-page>
        <s-section heading="Open Mixmach from Shopify">
          <s-paragraph>
            Install Mixmach from the Shopify App Store, or open it from the
            Apps section of your Shopify admin.
          </s-paragraph>
        </s-section>
      </s-page>
    </AppProvider>
  );
}
