// frontend/src/api.js
export async function getOrders(shop, page = 1, perPage = 50) {
  const url = `/api/orders?shop=${encodeURIComponent(shop)}&page=${page}&limit=${perPage}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function postSync(shop, secret) {
  const headers = { 'Content-Type': 'application/json' };
  if (secret) headers['X-SYNC-SECRET'] = secret;
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers,
    body: JSON.stringify({ shop })
  });
  return res.json();
}

export async function getAnalytics(shop) {
  const url = `/api/analytics?shop=${encodeURIComponent(shop)}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}
