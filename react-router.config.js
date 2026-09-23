// The app runs behind the Shopify CLI's dev tunnel (and behind Shopify's own
// iframe embedding in production). The browser's `Origin` header on POST
// actions reflects that public tunnel/app URL, which can differ from how the
// server perceives `request.url` through the proxy. React Router's CSRF
// check rejects that mismatch unless the host is explicitly allow-listed
// here — see https://reactrouter.com/api/framework-conventions/react-router.config#allowedactionorigins
const appHost = process.env.SHOPIFY_APP_URL
  ? new URL(process.env.SHOPIFY_APP_URL).host
  : null;

export default {
  allowedActionOrigins: appHost ? [appHost] : [],
};
