import "server-only";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";

export const MEDIA_DIR = process.env.MEDIA_DIR ?? path.join(process.cwd(), "storage", "media");

export const ALLOWED: Record<string, { ext: string; kind: "IMAGE" | "VIDEO"; max: number }> = {
  "image/jpeg": { ext: "jpg", kind: "IMAGE", max: 10 * 1024 * 1024 },
  "image/png": { ext: "png", kind: "IMAGE", max: 10 * 1024 * 1024 },
  "image/webp": { ext: "webp", kind: "IMAGE", max: 10 * 1024 * 1024 },
  "video/mp4": { ext: "mp4", kind: "VIDEO", max: 50 * 1024 * 1024 },
  "video/webm": { ext: "webm", kind: "VIDEO", max: 50 * 1024 * 1024 },
  "video/quicktime": { ext: "mov", kind: "VIDEO", max: 50 * 1024 * 1024 },
};

/** Verify file signatures so the declared type can't be spoofed (e.g. HTML disguised as PNG). */
export function sniff(buf: Buffer, mime: string): boolean {
  const hex = buf.subarray(0, 12).toString("hex");
  switch (mime) {
    case "image/jpeg":
      return hex.startsWith("ffd8ff");
    case "image/png":
      return hex.startsWith("89504e470d0a1a0a");
    case "image/webp":
      return buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP";
    case "video/webm":
      return hex.startsWith("1a45dfa3");
    case "video/mp4":
    case "video/quicktime":
      return buf.subarray(4, 8).toString() === "ftyp" || buf.subarray(4, 8).toString() === "moov" || buf.subarray(4, 8).toString() === "wide";
    default:
      return false;
  }
}

export async function storeMedia(encounterId: string, buf: Buffer, ext: string) {
  if (!/^[a-z0-9]+$/i.test(encounterId)) throw new Error("bad id");
  const dir = path.join(MEDIA_DIR, encounterId);
  await mkdir(dir, { recursive: true });
  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  await writeFile(path.join(dir, name), buf);
  return `${encounterId}/${name}`;
}

export async function readMedia(storageKey: string) {
  const full = path.resolve(MEDIA_DIR, storageKey);
  if (!full.startsWith(path.resolve(MEDIA_DIR) + path.sep)) throw new Error("path traversal");
  return readFile(full);
}
