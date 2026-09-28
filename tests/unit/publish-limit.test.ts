import { afterEach, describe, expect, it, vi } from "vitest";
import { lovePageDefaultValues } from "@/lib/love-page-schema";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  sharp: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ sql: mocks.query }));
vi.mock("sharp", () => ({ default: mocks.sharp }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "198.51.100.42" }),
}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: async () => true }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("publish rate limit", () => {
  it("rejects an exhausted client before decoding the uploaded image", async () => {
    vi.stubEnv("DISABLE_PUBLISH_RATE_LIMIT", "false");
    vi.stubEnv("IP_HASH_SECRET", "test-only-secret");
    mocks.query.mockResolvedValue([{ hour_count: 3, day_count: 3 }]);

    const formData = new FormData();
    for (const [key, value] of Object.entries(lovePageDefaultValues)) {
      formData.append(key, value || "Тестовое значение");
    }
    formData.append("photo", new File(["fake image"], "photo.jpg", { type: "image/jpeg" }));
    formData.append("turnstileToken", "test-token");

    const { publishLovePage } = await import("@/actions/publish");
    const result = await publishLovePage(formData);

    expect(result).toMatchObject({ status: "error", message: expect.stringContaining("Лимит публикаций") });
    expect(mocks.sharp).not.toHaveBeenCalled();
  });
});
