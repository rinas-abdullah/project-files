/**
 * Client-side encryption for the ambulance outbox (AES-GCM via WebCrypto).
 * The key comes from /api/device-key (authenticated) and is cached only in
 * sessionStorage, which the browser clears when the tab closes. Ciphertext in
 * localStorage is useless on a lost tablet without a fresh sign-in.
 */
const KEY_CACHE = "vl-outbox-key";
const PREFIX = "enc1:";

let cached: CryptoKey | null = null;

const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function importKey(raw: string) {
  return crypto.subtle.importKey("raw", unb64(raw), "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** Returns the outbox key, or null when offline in a fresh tab (data stays sealed until sign-in). */
export async function getOutboxKey(): Promise<CryptoKey | null> {
  if (cached) return cached;
  try {
    const memo = sessionStorage.getItem(KEY_CACHE);
    if (memo) return (cached = await importKey(memo));
  } catch {}
  try {
    const res = await fetch("/api/device-key", { cache: "no-store" });
    if (!res.ok) return null;
    const { key } = (await res.json()) as { key: string };
    try {
      sessionStorage.setItem(KEY_CACHE, key);
    } catch {}
    return (cached = await importKey(key));
  } catch {
    return null;
  }
}

export function forgetOutboxKey() {
  cached = null;
  try {
    sessionStorage.removeItem(KEY_CACHE);
  } catch {}
}

export async function seal(key: CryptoKey, plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  return `${PREFIX}${b64(iv)}:${b64(ct)}`;
}

export async function unseal(key: CryptoKey, stored: string): Promise<string> {
  if (!stored.startsWith(PREFIX)) return stored; // legacy plaintext, re-encrypted on next write
  const [iv, ct] = stored.slice(PREFIX.length).split(":");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, key, unb64(ct));
  return new TextDecoder().decode(pt);
}

export const isSealed = (stored: string | null) => !!stored && stored.startsWith(PREFIX);
