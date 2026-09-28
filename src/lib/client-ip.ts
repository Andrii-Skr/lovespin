import { isIP } from "node:net";

// Caddy replaces X-Forwarded-For from untrusted clients. X-Real-IP is passed
// through unchanged by default, so it must never take precedence here.
export function getClientIp(requestHeaders: Headers) {
  const firstForwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return firstForwarded && isIP(firstForwarded) ? firstForwarded : "unknown";
}
