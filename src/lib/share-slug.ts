import { randomBytes } from "node:crypto";

// A share URL is a bearer secret. Use 128 cryptographically random bits.
export function createShareSlug() {
  return randomBytes(16).toString("hex");
}

export function isShareSlug(value: string) {
  // Keep previously issued 12-character links valid until they expire.
  return /^(?:[a-z0-9]{12}|[a-f0-9]{32})$/.test(value);
}
