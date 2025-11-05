// server/onSessionCreated.js
const { fetchAndSaveOrders } = require('./shopifySync');

/**
 * Call this after a session is created/you finish OAuth.
 * session should have { shop, accessToken }.
 */
async function onSessionCreated(session) {
  try {
    if (!session) {
      console.warn('onSessionCreated called without session');
      return;
    }
    const shop = session.shop || session.shopDomain || session.shopifyDomain;
    const accessToken = session.accessToken || session.access_token;

    if (!shop || !accessToken) {
      console.warn('Missing shop or accessToken on session');
      return;
    }

    console.log(`Running initial order sync for ${shop}`);
    const result = await fetchAndSaveOrders(shop, accessToken);
    console.log(`Order sync complete for ${shop}: imported ${result.imported}`);
  } catch (err) {
    console.error('onSessionCreated error', err);
  }
}

module.exports = onSessionCreated;
