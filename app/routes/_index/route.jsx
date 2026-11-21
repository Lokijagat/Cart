import { redirect } from "react-router";
import styles from "./styles.module.css";

// Public landing page. Merchants install and open Mixmach from the Shopify
// App Store / Shopify admin, so this page never asks for a shop domain
// (App Store requirement 2.3.1). Requests that carry a `shop` param come
// from Shopify and are forwarded straight into the embedded app.
export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return null;
};

export default function App() {
  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Mixmach</h1>
        <p className={styles.text}>
          Bundle discounts, flash offers and a free-shipping progress bar for
          your Shopify cart.
        </p>
        <p>
          Install Mixmach from the Shopify App Store, then open it from your
          Shopify admin.
        </p>
        <ul className={styles.list}>
          <li>
            <strong>Bundle discounts</strong>. Sell any N products from a
            collection for one fixed bundle price.
          </li>
          <li>
            <strong>Flash offers</strong>. Show your own offer banners in the
            cart drawer and on the cart page.
          </li>
          <li>
            <strong>Progress bar</strong>. Show shoppers how close they are to
            free shipping and tiered discounts.
          </li>
        </ul>
        <p>
          <a href="/privacy">Privacy policy</a>
        </p>
      </div>
    </div>
  );
}
