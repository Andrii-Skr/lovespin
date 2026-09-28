import fs from "node:fs/promises";
import path from "node:path";

export async function cleanupExpiredRows(rows, { uploadDir, unlink = fs.unlink, onError }) {
  const cleanedIds = [];
  const root = path.resolve(uploadDir);

  for (const row of rows) {
    try {
      for (const name of [row.photo_path, row.certificate_path]) {
        if (!name) continue;
        const filePath = path.resolve(root, name);
        if (!filePath.startsWith(`${root}${path.sep}`)) {
          throw new Error("Attachment path is outside the upload directory");
        }
        try {
          await unlink(filePath);
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
      }
      cleanedIds.push(row.id);
    } catch (error) {
      onError(row.id, error);
    }
  }

  return cleanedIds;
}
