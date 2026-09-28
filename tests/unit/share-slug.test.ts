import { describe, expect, it } from "vitest";
import { createShareSlug, isShareSlug } from "@/lib/share-slug";

describe("private share links", () => {
  it("creates independent 128-bit identifiers for new links", () => {
    const slugs = Array.from({ length: 1_000 }, createShareSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((slug) => /^[a-f0-9]{32}$/.test(slug))).toBe(true);
  });

  it("accepts existing links and rejects malformed identifiers", () => {
    expect(isShareSlug("e4z6hghnp2n8")).toBe(true);
    expect(isShareSlug(createShareSlug())).toBe(true);
    expect(isShareSlug("a".repeat(31))).toBe(false);
    expect(isShareSlug("a".repeat(33))).toBe(false);
    expect(isShareSlug("../private-file")).toBe(false);
  });
});
