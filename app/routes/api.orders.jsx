// app/routes/api.orders.jsx
/**
 * Simple proxy route for frontend -> backend.
 * Forwards GET /api/orders?... -> BACKEND_URL/api/orders?...
 * Forwards POST (action) to BACKEND_URL/api/orders or /api/sync
 *
 * No imports from react-router to avoid SSR export mismatch.
 */

const BACKEND_BASE = process.env.BACKEND_URL || "http://localhost:8081";

async function forwardToBackend(url, init = {}) {
  const res = await fetch(url, init);
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // fallback to text
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": ct || "text/plain" },
  });
}

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const qs = url.search; // includes leading ? or empty string
    const backendUrl = `${BACKEND_BASE}/api/orders${qs}`;

    return await forwardToBackend(backendUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    console.error("Proxy GET /api/orders error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function action({ request }) {
  try {
    const url = new URL(request.url);
    const qs = url.search;
    // if frontend posts to /api/sync, it should call /api/sync in the app;
    // otherwise this action will forward to /api/orders by default
    const intended = url.pathname.includes("/sync") ? "/api/sync" : "/api/orders";
    const backendUrl = `${BACKEND_BASE}${intended}${qs}`;

    const body = await request.text();
    const headers = {};
    const ct = request.headers.get("content-type");
    if (ct) headers["content-type"] = ct;

    return await forwardToBackend(backendUrl, {
      method: "POST",
      body: body || undefined,
      headers,
    });
  } catch (err) {
    console.error("Proxy POST error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
