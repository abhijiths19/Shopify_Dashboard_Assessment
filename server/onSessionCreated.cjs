// server/onSessionCreated.cjs
/**
 * onSessionCreated(session)
 *
 * Call this after you finish your OAuth flow and you have a session object.
 * session should contain at least:
 *   - shop (shop domain) e.g. "pokestoredev-2.myshopify.com"
 *   - accessToken (optional) - the per-shop access token created during OAuth
 *
 * This function will:
 *  - prefer session.accessToken (fetch using it)
 *  - otherwise fall back to the global ADMIN_ACCESS_TOKEN (from your .env)
 *
 * It will call the functions exported from shopifySync.cjs:
 *   - fetchAllOrdersAndSave(shop)             // uses ADMIN_ACCESS_TOKEN
 *   - fetchAllOrdersAndSaveWithToken(shop, token) // optional (if available) to use session token
 *
 * The function intentionally catches errors and logs them so it is safe to call in an OAuth flow.
 */

const path = require('path');
const debugPrefix = '[onSessionCreated]';

const { fetchAllOrdersAndSave } = require('./shopifySync.cjs');

// try to require an alternative function that accepts a token (not required)
let fetchAllOrdersAndSaveWithToken = null;
try {
  const maybe = require('./shopifySync.cjs');
  if (typeof maybe.fetchAllOrdersAndSaveWithToken === 'function') {
    fetchAllOrdersAndSaveWithToken = maybe.fetchAllOrdersAndSaveWithToken;
  }
} catch (err) {
  // ignore - not fatal
}

/**
 * session: { shop: string, accessToken?: string, ... }
 */
async function onSessionCreated(session) {
  if (!session || !session.shop) {
    console.warn(`${debugPrefix} called without session.shop - nothing to do`);
    return { success: false, message: 'missing session.shop' };
  }

  const shop = session.shop;
  const token = session.accessToken || session.access_token || null;

  console.log(`${debugPrefix} starting import for shop=${shop} tokenPresent=${!!token}`);

  try {
    if (token && fetchAllOrdersAndSaveWithToken) {
      // If shopifySync exposes a token-aware function, use it (preferred).
      console.log(`${debugPrefix} using token-aware fetchAllOrdersAndSaveWithToken`);
      const res = await fetchAllOrdersAndSaveWithToken(shop, token);
      console.log(`${debugPrefix} token-based sync result:`, res);
      return { success: true, method: 'token', result: res };
    }

    if (token && !fetchAllOrdersAndSaveWithToken) {
      // If token provided but no token-aware function, we can temporarily set ADMIN_ACCESS_TOKEN,
      // call the existing function and restore it. This is safe for short-lived tasks only.
      // NOTE: prefer to implement fetchAllOrdersAndSaveWithToken in shopifySync.cjs for production.
      const envBackup = process.env.ADMIN_ACCESS_TOKEN;
      try {
        process.env.ADMIN_ACCESS_TOKEN = token;
        console.log(`${debugPrefix} temporarily using session token via ADMIN_ACCESS_TOKEN env`);
        const res = await fetchAllOrdersAndSave(shop);
        console.log(`${debugPrefix} sync result with temporary token:`, res);
        return { success: true, method: 'temp-env-token', result: res };
      } finally {
        process.env.ADMIN_ACCESS_TOKEN = envBackup;
      }
    }

    // No token — use the global ADMIN_ACCESS_TOKEN implementation
    console.log(`${debugPrefix} no session token available; using ADMIN_ACCESS_TOKEN fallback`);
    const res = await fetchAllOrdersAndSave(shop);
    console.log(`${debugPrefix} fallback sync result:`, res);
    return { success: true, method: 'admin-token', result: res };
  } catch (err) {
    console.error(`${debugPrefix} sync failed for shop=${shop}:`, err && err.stack ? err.stack : err);
    return { success: false, error: err && err.message ? err.message : String(err) };
  }
}

module.exports = { onSessionCreated };
