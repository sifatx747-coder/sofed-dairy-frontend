/* All requests go to the same-origin /api/* which Next.js rewrites to the
   Express server — the httpOnly auth cookie rides along automatically. */

export async function api(path, { method = 'GET', body } = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    method,
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    credentials: 'include',
    cache: 'no-store',
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    const err = new Error(data?.message || 'কিছু একটা সমস্যা হয়েছে — আবার চেষ্টা করুন');
    err.status = res.status;
    throw err;
  }
  return data;
}
