import { describe, expect, it } from "vitest";
import { extractCardId } from "@/lib/engines/nusuk";

describe("Nusuk card code reader", () => {
  it("finds the ID in plain, URL and JSON payloads", () => {
    expect(extractCardId("1098765432")).toBe("1098765432");
    expect(extractCardId("https://example.test/card?id=2123456789&v=2")).toBe("2123456789");
    expect(extractCardId('{"name":"Ahmed","id":"1098765432"}')).toBe("1098765432");
    expect(extractCardId("١٠٩٨٧٦٥٤٣٢")).toBe("1098765432");
  });
  it("rejects payloads without a valid 10-digit ID", () => {
    expect(extractCardId("3098765432")).toBeNull();
    expect(extractCardId("109876543")).toBeNull();
    expect(extractCardId("110987654321")).toBeNull();
  });
});
