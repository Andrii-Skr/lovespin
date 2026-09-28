export const MAX_CERTIFICATE_SIZE = 10 * 1024 * 1024;
export const CERTIFICATE_ACCEPT = "application/pdf,.pdf";

export function isPdfFileMetadata(file: Pick<File, "name" | "size" | "type">) {
  return (
    file.size > 0 &&
    file.size <= MAX_CERTIFICATE_SIZE &&
    (file.type === "application/pdf" || file.type === "") &&
    file.name.length <= 255 &&
    file.name.toLowerCase().endsWith(".pdf")
  );
}

export function hasPdfSignature(bytes: Uint8Array) {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

export function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}
