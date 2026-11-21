// Public privacy policy page, served at /privacy. Linked from the App Store
// listing, so it must load without Shopify authentication. Keep it in sync
// with what the app actually stores (see prisma/schema.prisma) and with the
// GDPR webhook handlers in app/routes/webhooks.*.redact.jsx.

const CONTACT_EMAIL = "lokpal011@gmail.com";
const LAST_UPDATED = "November 18, 2026";

export const meta = () => [
  { title: "Privacy Policy | Mixmach" },
  {
    name: "description",
    content: "How the Mixmach Shopify app collects, uses and deletes data.",
  },
];

const styles = {
  page: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "40px 16px 64px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    lineHeight: 1.6,
    color: "#1a1a1a",
  },
  muted: { color: "#616161" },
};

export default function PrivacyPolicy() {
  return (
    <main style={styles.page}>
      <h1>Mixmach Privacy Policy</h1>
      <p style={styles.muted}>Last updated: {LAST_UPDATED}</p>

      <p>
        Mixmach (&quot;the App&quot;) is a Shopify app built and operated by
        Gbasket (&quot;we&quot;, &quot;us&quot;). It lets merchants create
        bundle discounts, show flash offer banners in the cart and show a
        spend-based progress bar. This policy explains what information the
        App collects when a merchant installs it, how we use it and when we
        delete it.
      </p>

      <h2>Information we collect</h2>
      <p>When you install the App, Shopify gives us, and we store:</p>
      <ul>
        <li>
          Your shop&apos;s myshopify.com domain and the access token Shopify
          issues so the App can work with your store.
        </li>
        <li>
          The access scopes you approved: reading products and collections,
          creating and managing discounts, and serving storefront content
          through an app proxy.
        </li>
      </ul>
      <p>When you use the App, we store the settings you create:</p>
      <ul>
        <li>
          Bundle discounts: name, the chosen collection, product quantity,
          bundle price, status and the ID of the matching Shopify discount.
        </li>
        <li>
          Flash offers: name, banner message, colors and where the banner is
          shown.
        </li>
        <li>
          Progress bar: spend thresholds, discount percentages, free shipping
          threshold and the IDs of the matching Shopify discounts.
        </li>
      </ul>
      <p>
        We read product and collection details (titles, IDs and prices) from
        your store to build these discounts. We do not copy your product
        catalog into our database.
      </p>

      <h2>Information about your customers</h2>
      <p>
        The App does not collect or store personal information about your
        customers. The storefront script reads the shopper&apos;s current
        cart total in their browser to update the progress bar. The cart
        contents are not sent to our servers. When a shopper loads your
        cart, Shopify may include the logged-in customer&apos;s ID in the
        request it forwards to the App. We do not store or use it.
      </p>

      <h2>How we use information</h2>
      <p>We use the information above only to:</p>
      <ul>
        <li>authenticate your store and keep the App connected to it;</li>
        <li>
          create, update and remove the discounts you set up in the App;
        </li>
        <li>show your flash offers and progress bar on your storefront;</li>
        <li>answer your support requests.</li>
      </ul>
      <p>
        We do not sell your information, use it for advertising or share it
        with third parties. The exception is the hosting provider that runs
        the App&apos;s servers and database, which processes it on our
        behalf.
      </p>

      <h2>Data retention and deletion</h2>
      <ul>
        <li>
          When you uninstall the App, we delete your store&apos;s access
          token and session right away.
        </li>
        <li>
          About 48 hours after uninstall, Shopify asks us to erase your
          store&apos;s data, and we delete all remaining discount, flash offer
          and progress bar settings.
        </li>
        <li>
          Discounts the App created stay in your Shopify admin until you
          delete them there or in the App before uninstalling.
        </li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can ask us to access, correct or delete the information we hold
        about your store at any time by emailing us. We also respond to the
        data requests Shopify sends us on behalf of merchants and their
        customers under GDPR and similar laws.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If we change this policy, we will update the date at the top of this
        page. If a change affects what data we collect, we will tell
        merchants inside the App.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions or data requests:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </main>
  );
}
