import { describe, expect, it } from "vitest";
import {
  formatFileSize,
  hasPdfSignature,
  isPdfFileMetadata,
  MAX_CERTIFICATE_SIZE,
} from "@/lib/certificate";

describe("certificate PDF validation", () => {
  it("accepts a PDF with a safe size", () => {
    const file = new File(["%PDF-1.7"], "certificate.pdf", {
      type: "application/pdf",
    });

    expect(isPdfFileMetadata(file)).toBe(true);
    expect(hasPdfSignature(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe(true);
  });

  it("rejects misleading file metadata and oversized PDFs", () => {
    expect(
      isPdfFileMetadata({
        name: "certificate.png",
        type: "application/pdf",
        size: 1024,
      }),
    ).toBe(false);
    expect(
      isPdfFileMetadata({
        name: "certificate.pdf",
        type: "application/pdf",
        size: MAX_CERTIFICATE_SIZE + 1,
      }),
    ).toBe(false);
  });

  it("rejects content without a PDF signature", () => {
    expect(hasPdfSignature(new TextEncoder().encode("not a pdf"))).toBe(false);
  });

  it("formats small and large file sizes readably", () => {
    expect(formatFileSize(800)).toBe("1 КБ");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 МБ");
  });
});
