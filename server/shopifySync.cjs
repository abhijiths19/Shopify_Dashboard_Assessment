// server/shopifySync.cjs
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const axios = require('axios');
const mongoose = require('mongoose');
const Order = require('./models/Order.cjs');

const fetchOrdersAndSave = async (shop) => {
  const token = process.env.ADMIN_ACCESS_TOKEN;
  if (!token) {
    throw new Error("ADMIN_ACCESS_TOKEN not found in .env");
  }

  console.log(`🔐 Using token (first 10 chars): ${token.substring(0, 10)}...`);

  const adminUrl = `https://${shop}/admin/api/2024-10/graphql.json`;
  const headers = {
    'X-Shopify-Access-Token': token,
    'Content-Type': 'application/json',
  };

  const query = `
    {
      orders(first: 5, query: "created_at:>=${new Date(Date.now() - 60*24*60*60*1000).toISOString()}") {
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            currentTotalPriceSet { shopMoney { amount currencyCode } }
            lineItems(first: 5) {
              edges {
                node {
                  name
                  quantity
                  originalUnitPriceSet { shopMoney { amount currencyCode } }
                  image { originalSrc }
                }
              }
            }
          }
        }
      }
    }
  `;

  console.log('📡 Fetching orders from Shopify...');
  const res = await axios.post(adminUrl, { query }, { headers }).catch((err) => {
    console.error("❌ Shopify API call failed:", err.response?.data || err.message);
    throw err;
  });

  if (!res.data?.data?.orders) {
    console.log("⚠️ No orders found or invalid response:", res.data);
    return;
  }

  const orders = res.data.data.orders.edges.map((edge) => {
    const o = edge.node;
    return {
      shop,
      orderId: o.id,
      status: o.displayFinancialStatus,
      createdAt: o.createdAt,
      total: o.currentTotalPriceSet.shopMoney.amount,
      currency: o.currentTotalPriceSet.shopMoney.currencyCode,
      lineItems: o.lineItems.edges.map((li) => ({
        name: li.node.name,
        qty: li.node.quantity,
        price: li.node.originalUnitPriceSet.shopMoney.amount,
        imageURL: li.node.image?.originalSrc || null,
      })),
    };
  });

  console.log(`🧾 Found ${orders.length} orders. Saving to DB...`);
  await Order.insertMany(orders, { ordered: false }).catch(() => {});
  console.log('💾 Orders saved successfully.');
};

module.exports = { fetchOrdersAndSave };
