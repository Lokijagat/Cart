import { useEffect, useState } from "react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useLoaderData, useNavigation, Form, redirect } from "react-router";
import { getDiscount, updateDiscount, deleteDiscount } from "../discounts.server";

export async function loader({ request, params }) {
  const { admin, session } = await authenticate.admin(request);

  const discount = await getDiscount(session.shop, params.id);
  if (!discount) {
    throw new Response("Not found", { status: 404 });
  }

  const response = await admin.graphql(`
    query {
      collections(first: 50) {
        nodes {
          id
          title
        }
      }
    }
  `);
  const data = await response.json();

  return { discount, collections: data.data.collections.nodes };
}

export async function action({ request, params }) {
  const { admin, session } = await authenticate.admin(request);
  const discount = await getDiscount(session.shop, params.id);
  if (!discount) {
    throw new Response("Not found", { status: 404 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await deleteDiscount(admin, discount);
    return redirect("/app");
  }

  const name = formData.get("name")?.toString().trim();
  const collectionId = formData.get("collectionId")?.toString();
  const collectionTitle = formData.get("collectionTitle")?.toString();
  const quantity = Number(formData.get("quantity"));
  const bundlePrice = Number(formData.get("bundlePrice"));
  const status = formData.get("status")?.toString() ?? discount.status;

  const errors = {};
  if (!name) errors.name = "Enter a discount name";
  if (!collectionId) errors.collectionId = "Choose a collection";
  if (!Number.isInteger(quantity) || quantity <= 0) errors.quantity = "Choose a quantity";
  if (!Number.isFinite(bundlePrice) || bundlePrice < 0) errors.bundlePrice = "Enter a valid price";

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    await updateDiscount(admin, discount, {
      name,
      collectionId,
      collectionTitle,
      quantity,
      bundlePrice,
      status,
    });
  } catch (error) {
    return { errors: { form: error.message } };
  }

  return redirect("/app");
}

export default function EditDiscount() {
  const { discount, collections } = useLoaderData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [collectionId, setCollectionId] = useState(discount.collectionId);
  const [products, setProducts] = useState([]);

  const selectedCollection = collections.find((c) => c.id === collectionId);

  useEffect(() => {
    if (!collectionId) {
      setProducts([]);
      return;
    }

    let cancelled = false;
    fetch(`/api/products?collectionId=${encodeURIComponent(collectionId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setProducts(data.products || []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [collectionId]);

  return (
    <s-page heading={`Edit: ${discount.name}`}>
      <s-section heading="Bundle details">
        <Form method="post">
          <s-stack direction="block" gap="base">
            <s-text-field label="Discount Name" name="name" defaultValue={discount.name} />

            <s-select
              label="Choose Collection"
              name="collectionId"
              value={collectionId}
              onChange={(event) => setCollectionId(event.currentTarget.value)}
            >
              <s-option value="">Select Collection</s-option>
              {collections.map((collection) => (
                <s-option key={collection.id} value={collection.id}>
                  {collection.title}
                </s-option>
              ))}
            </s-select>
            <input type="hidden" name="collectionTitle" value={selectedCollection?.title ?? ""} />

            {products.length > 0 && (
              <s-section heading={`Products in ${selectedCollection?.title}`}>
                <s-stack direction="block" gap="small-300">
                  {products.map((product) => (
                    <s-text key={product.id}>{product.title}</s-text>
                  ))}
                </s-stack>
              </s-section>
            )}

            <s-select label="Number of Products" name="quantity" defaultValue={String(discount.quantity)}>
              <s-option value="3">3 Products</s-option>
              <s-option value="5">5 Products</s-option>
              <s-option value="7">7 Products</s-option>
              <s-option value="10">10 Products</s-option>
            </s-select>

            <s-text-field
              label="Price for Selected Products"
              name="bundlePrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={String(discount.bundlePrice)}
            />

            <s-select label="Status" name="status" defaultValue={discount.status}>
              <s-option value="DRAFT">Draft</s-option>
              <s-option value="ACTIVE">Active</s-option>
              <s-option value="DISABLED">Disabled</s-option>
            </s-select>

            <s-stack direction="inline" gap="base">
              <s-button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </s-button>
            </s-stack>
          </s-stack>
        </Form>

        <Form
          method="post"
          onSubmit={(event) => {
            if (!confirm(`Delete "${discount.name}"? This cannot be undone.`)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="intent" value="delete" />
          <s-button variant="tertiary" tone="critical" type="submit" disabled={isSubmitting}>
            Delete Discount
          </s-button>
        </Form>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
