import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";

/**
 * Field-level encryption for sensitive identifiers (National ID, phone).
 * AES-256-GCM with a key derived from DATA_ENCRYPTION_KEY. A keyed HMAC is
 * stored separately so records can be looked up without decrypting.
 */
function key(): Buffer {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) throw new Error("DATA_ENCRYPTION_KEY is not set");
  return createHash("sha256").update(raw).digest();
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decrypt(payload: string): string {
  const [v, iv, tag, data] = payload.split(":");
  if (v !== "v1") throw new Error("Unsupported ciphertext version");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}

export function lookupHash(value: string): string {
  return createHmac("sha256", key()).update(value.trim()).digest("hex");
}

export function last4(value: string): string {
  return value.replace(/\D/g, "").slice(-4);
}

/** Never show a full National ID in general tables. */
export function maskId(last: string | null | undefined): string {
  return last ? `••••••${last}` : "—";
}
