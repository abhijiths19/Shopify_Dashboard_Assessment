// server/shopifySync.js
const { Shopify } = require('@shopify/shopify-api');
const Order = require('./models/Order');

function sixtyDaysIso() {
  const d = new Date();
  d.setDate(d.getDate() - 60);
  return d.toISOString();
}

/**
 * Fetch all orders from the last 60 days and upsert into Mongo.
 * Uses GraphQL cursor pagination.
 *
 * @param {string} shop - myshopify domain, e.g. 'example.myshopify.com'
 * @param {string} accessToken - admin access token
 * @returns {Object} { imported: number }
 */
async function fetchAndSaveOrders(shop, accessToken) {
  if (!shop || !accessToken) throw new Error('shop and accessToken required');

  const client = new Shopify.Clients.Graphql(shop, accessToken);
  const queryBase = `created_at:>='${sixtyDaysIso()}'`;

  const graphql = `
    query Orders($query: String!, $first: Int!, $after: String) {
      orders(query: $query, first: $first, after: $after) {
        pageInfo { hasNextPage, hasPreviousPage }
        edges {
          cursor
          node {
            id
            name
            createdAt
            currencyCode
            totalPriceSet { shopMoney { amount currencyCode } }
            lineItems(first: 250) {
              edges {
                node {
                  id
                  title
                  quantity
                  sku
                  originalUnitPrice { amount }
                  image { transformedSrc }
                }
              }
            }
          }
        }
      }
    }`;

  let after = null;
  let totalImported = 0;

  do {
    const variables = { query: queryBase, first: 50, after };
    const resp = await client.query({ data: { query: graphql, variables } });
    const body = resp?.body;
    const edges = body?.data?.orders?.edges || [];
    const pageInfo = body?.data?.orders?.pageInfo || { hasNextPage: false };

    for (const edge of edges) {
      const o = edge.node;
      // Convert createdAt
      const createdAt = new Date(o.createdAt);

      // Build lineItems array
      const lineItems = (o.lineItems?.edges || []).map(e => {
        const li = e.node;
        const images = [];
        if (li.image?.transformedSrc) images.push({ url: li.image.transformedSrc });
        return {
          lineItemId: li.id,
          title: li.title,
          sku: li.sku || null,
          qty: li.quantity || 0,
          price: li.originalUnitPrice?.amount || null,
          images
        };
      });

      // Upsert by orderId
      await Order.findOneAndUpdate(
        { orderId: o.id },
        {
          $set: {
            shop,
            status: 'CREATED',
            totalPrice: o.totalPriceSet?.shopMoney?.amount ?? null,
            currency: o.totalPriceSet?.shopMoney?.currencyCode ?? null,
            createdAt,
            lineItems,
            raw: o
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      totalImported += 1;
    }

    after = edges.length ? edges[edges.length - 1].cursor : null;
    if (!pageInfo.hasNextPage) break;
  } while (after);

  return { imported: totalImported };
}

module.exports = { fetchAndSaveOrders };
