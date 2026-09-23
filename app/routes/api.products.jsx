import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const collectionId = url.searchParams.get("collectionId");

  if (!collectionId) {
    return Response.json({
      products: [],
    });
  }

  const response = await admin.graphql(
    `
      query getCollectionProducts($id: ID!) {
        collection(id: $id) {
          products(first: 50) {
            nodes {
              id
              title
              handle
            }
          }
        }
      }
    `,
    {
      variables: {
        id: collectionId,
      },
    }
  );

  const data = await response.json();

  return Response.json({
    products: data.data.collection?.products?.nodes || [],
  });
}