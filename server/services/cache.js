const store = new Map();
export function get(key) {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) { store.delete(key); return null; }
  return e.data;
}
export function set(key, data, ttlSeconds) {
  store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000, cachedAt: Date.now() });
}
export function getStale(key) { return store.get(key)?.data ?? null; }
export function age(key) { const e = store.get(key); return e ? (Date.now()-e.cachedAt)/1000 : Infinity; }
export function has(key) { const e = store.get(key); return !!(e && Date.now() <= e.expiresAt); }
export function invalidate(key) { store.delete(key); }
export function stats() {
  return [...store.entries()].map(([k,v])=>({key:k,ageSeconds:Math.round((Date.now()-v.cachedAt)/1000),expiresInSeconds:Math.round((v.expiresAt-Date.now())/1000)}));
}
