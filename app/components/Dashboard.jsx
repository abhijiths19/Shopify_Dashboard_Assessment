// app/components/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";

/**
 * Dashboard component
 *
 * Expectations:
 * - Backend endpoint returns JSON:
 *   GET /orders?days=60&page=1&perPage=25
 *   -> { success: true, meta: { total, page, perPage }, orders: [...] }
 *
 * - Optional manual sync endpoint:
 *   POST /sync?shop=shopDomain   (returns { success: true, insertedCount })
 *
 * Adjust endpoint paths if your API differs (e.g. /api/orders).
 */

// Helper: get 'shop' or 'host' param from URL if present
function getShopFromUrl() {
  try {
    const u = new URL(window.location.href);
    return u.searchParams.get("shop") || u.searchParams.get("host") || null;
  } catch {
    return null;
  }
}

// Format ISO date string nicely
function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 25; // change if you want
  const [total, setTotal] = useState(0);

  // compute candidate endpoints to try
  const shop = typeof window !== "undefined" ? getShopFromUrl() : null;
  // prefer /orders then /api/orders (common variants)
  const buildOrdersUrl = (p = 1) => {
    const baseCandidates = ["/orders", "/api/orders", "/app/orders"];
    const qp = new URLSearchParams();
    qp.set("days", "60");
    qp.set("page", String(p));
    qp.set("perPage", String(perPage));
    if (shop) qp.set("shop", shop);

    // try each candidate in sequence (the fetchOrders implementation will attempt fallbacks)
    return { candidates: baseCandidates.map(b => `${b}?${qp.toString()}`) };
  };

  const fetchOrders = useCallback(
    async (p = 1) => {
      setLoading(true);
      setError(null);

      const { candidates } = buildOrdersUrl(p);

      // Try each candidate endpoint until one works
      let lastErr = null;
      for (const url of candidates) {
        try {
          const resp = await fetch(url, { credentials: "same-origin" });
          if (!resp.ok) {
            // if 404/500, try next candidate
            lastErr = new Error(`HTTP ${resp.status} from ${url}`);
            continue;
          }
          const data = await resp.json();
          // Expect shape: { success: true, meta: { total, page, perPage }, orders: [] }
          if (data && (data.orders || data.success)) {
            setOrders(Array.isArray(data.orders) ? data.orders : data.data || []);
            setPage(data.meta?.page || p);
            setTotal(data.meta?.total ?? (Array.isArray(data.orders) ? data.orders.length : 0));
            setLoading(false);
            return;
          } else {
            lastErr = new Error("Unexpected response shape from " + url);
            continue;
          }
        } catch (err) {
          lastErr = err;
          continue;
        }
      }

      setLoading(false);
      setError(lastErr ? lastErr.message : "Failed to fetch orders");
    },
    [shop],
  );

  // Call sync endpoint to refresh backend from Shopify (optional)
  const syncNow = useCallback(async () => {
    setSyncing(true);
    setError(null);

    const candidates = ["/sync", "/api/sync", "/app/sync"].map(base => {
      const qp = new URLSearchParams();
      if (shop) qp.set("shop", shop);
      return `${base}?${qp.toString()}`;
    });

    let lastErr = null;
    for (const url of candidates) {
      try {
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
        });
        if (!resp.ok) {
          lastErr = new Error(`Sync ${url} failed HTTP ${resp.status}`);
          continue;
        }
        const json = await resp.json();
        // optional: show result
        console.info("sync response", json);
        // after successful sync, re-fetch orders
        await fetchOrders(page);
        setSyncing(false);
        return;
      } catch (err) {
        lastErr = err;
        continue;
      }
    }

    setSyncing(false);
    setError(lastErr ? lastErr.message : "Sync failed");
  }, [fetchOrders, page, shop]);

  useEffect(() => {
    fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOrders]);

  const goPrev = () => {
    if (page <= 1) return;
    const next = page - 1;
    fetchOrders(next);
  };
  const goNext = () => {
    const maxPage = Math.ceil((total || orders.length) / perPage) || page + 1;
    const next = page + 1;
    if (next > maxPage) return;
    fetchOrders(next);
  };

  return (
    <s-page heading="Merchant Orders (last 60 days)">
      <s-section heading="Orders">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <s-button onClick={() => fetchOrders(1)} {...(loading ? { loading: true } : {})}>
              Refresh
            </s-button>
            <s-button onClick={syncNow} variant="tertiary" {...(syncing ? { loading: true } : {})}>
              Sync from Shopify
            </s-button>
            {shop && <s-text>Shop: {shop}</s-text>}
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "var(--s-color-text-muted, #6b6b6b)" }}>
              Showing page {page} — {total ?? orders.length} orders
            </div>
          </div>
        </div>

        {error && (
          <s-banner variant="critical" style={{ marginBottom: 12 }}>
            <div>{String(error)}</div>
          </s-banner>
        )}

        {loading ? (
          <div style={{ padding: 20 }}>
            <s-spinner /> Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <s-empty-state heading="No orders found" subheading="No orders in the last 60 days were returned by the API." />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {orders.map((o) => {
              // possible variations: your backend may have order._id, order.order_id, order.name etc.
              const id = o.order_id || o.id || o._id || o._key || o.name || "unknown";
              const name = o.name || o.title || `#${id}`;
              const date = o.created_at || o.createdAt || o.created || o.date;
              const totalPrice = o.total_price ?? (o.totalPrice ? o.totalPrice.toString() : null);
              const currency = o.currency || (o.currencyCode || (o.total_price_currency || ""));
              const finStatus = o.financial_status || o.displayFinancialStatus || o.financialStatus;
              const fulfill = o.fulfillment_status || o.displayFulfillmentStatus || o.fulfillmentStatus;

              return (
                <s-box key={id} padding="base" borderWidth="base" borderRadius="base" background="subdued">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{name}</div>
                      <div style={{ fontSize: 13, color: "var(--s-color-text-muted, #6b6b6b)" }}>
                        {id} • {fmtDate(date)}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700 }}>
                        {totalPrice ?? "-"} {currency || ""}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--s-color-text-muted, #6b6b6b)" }}>
                        {finStatus ? `${finStatus}` : "—"} {fulfill ? ` • ${fulfill}` : ""}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <s-button
                          size="small"
                          variant="plain"
                          onClick={() => {
                            // open order detail route if you have one, else call API
                            // Example: open a new tab to /app/orders/:id if you implement route
                            window.open(`/app/order/${encodeURIComponent(id)}`, "_blank");
                          }}
                        >
                          View
                        </s-button>
                      </div>
                    </div>
                  </div>
                </s-box>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <div>
            <s-button onClick={goPrev} {...(page <= 1 ? { disabled: true } : {})}>
              Previous
            </s-button>
            <s-button onClick={goNext} style={{ marginLeft: 8 }}>
              Next
            </s-button>
          </div>

          <div style={{ color: "var(--s-color-text-muted, #6b6b6b)", fontSize: 13 }}>
            Page {page}
          </div>
        </div>
      </s-section>
    </s-page>
  );
}
