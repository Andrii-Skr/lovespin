import { describe, expect, it } from "vitest";
import { getClientIp } from "@/lib/client-ip";

describe("client IP behind the trusted proxy", () => {
  it("ignores a forged X-Real-IP header", () => {
    const headers = new Headers({
      "x-real-ip": "203.0.113.99",
      "x-forwarded-for": "198.51.100.42, 127.0.0.1",
    });
    expect(getClientIp(headers)).toBe("198.51.100.42");
  });

  it("uses one bucket when the proxy did not supply a valid address", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "203.0.113.99" }))).toBe("unknown");
    expect(getClientIp(new Headers({ "x-forwarded-for": "not-an-ip" }))).toBe("unknown");
  });
});
