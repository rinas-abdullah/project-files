import { describe, expect, it, beforeAll } from "vitest";
import { decryptBuffer, encryptBuffer, deviceOutboxKey } from "@/lib/crypto";

beforeAll(() => {
  process.env.DATA_ENCRYPTION_KEY ??= "test-key";
});

describe("media encryption at rest", () => {
  it("round-trips and does not store plaintext", () => {
    const png = Buffer.from("89504e470d0a1a0a" + "00".repeat(32), "hex");
    const enc = encryptBuffer(png);
    expect(enc.includes(png.subarray(0, 8))).toBe(false);
    expect(decryptBuffer(enc).equals(png)).toBe(true);
  });
  it("reads files stored before encryption was enabled", () => {
    const legacy = Buffer.from("ffd8ffe000", "hex");
    expect(decryptBuffer(legacy).equals(legacy)).toBe(true);
  });
  it("rejects tampered files", () => {
    const enc = encryptBuffer(Buffer.from("photo"));
    enc[enc.length - 1] ^= 1;
    expect(() => decryptBuffer(enc)).toThrow();
  });
  it("derives a distinct 256-bit outbox key per user", () => {
    const a = Buffer.from(deviceOutboxKey("u1"), "base64");
    expect(a.length).toBe(32);
    expect(deviceOutboxKey("u1")).not.toBe(deviceOutboxKey("u2"));
  });
});
