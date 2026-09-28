import { describe, expect, it, vi } from "vitest";
import { cleanupExpiredRows } from "../../scripts/cleanup-files.mjs";

describe("expired attachment cleanup", () => {
  it("continues with other pages when one file cannot be deleted", async () => {
    const unlink = vi.fn(async (filePath) => {
      if (filePath.endsWith("first.webp")) {
        throw Object.assign(new Error("permission denied"), { code: "EACCES" });
      }
    });
    const onError = vi.fn();

    const ids = await cleanupExpiredRows(
      [
        { id: "first", photo_path: "first.webp", certificate_path: null },
        { id: "second", photo_path: null, certificate_path: "second.pdf" },
      ],
      { uploadDir: "/tmp/uploads", unlink, onError },
    );

    expect(ids).toEqual(["second"]);
    expect(unlink).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledOnce();
  });

  it("treats already-removed files as cleaned and rejects paths outside uploads", async () => {
    const unlink = vi.fn(async () => {
      throw Object.assign(new Error("not found"), { code: "ENOENT" });
    });
    const onError = vi.fn();

    const ids = await cleanupExpiredRows(
      [
        { id: "missing", photo_path: "missing.webp", certificate_path: null },
        { id: "outside", photo_path: "../other.webp", certificate_path: null },
      ],
      { uploadDir: "/tmp/uploads", unlink, onError },
    );

    expect(ids).toEqual(["missing"]);
    expect(unlink).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledOnce();
  });
});
