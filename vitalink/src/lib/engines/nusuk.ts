/**
 * Reads an identity number from a scanned card code. The official Nusuk QR format
 * is not public, so this accepts any payload (plain text, URL or JSON) and extracts
 * the first 10-digit Saudi ID / Iqama number (starting with 1 or 2). Verification
 * always goes through the identity adapter afterwards; nothing is trusted from the QR.
 */
export function extractCardId(raw: string): string | null {
  const ascii = raw.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  const m = ascii.match(/(?<!\d)[12]\d{9}(?!\d)/);
  return m ? m[0] : null;
}
