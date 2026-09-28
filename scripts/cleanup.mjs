import path from "node:path";
import { loadEnvFile } from "node:process";
import postgres from "postgres";
import { cleanupExpiredRows } from "./cleanup-files.mjs";

for (const envFile of [".env.local", ".env"]) {
  try {
    loadEnvFile(path.join(process.cwd(), envFile));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const connectionString = process.env.DATABASE_URL;
const uploadDir = process.env.UPLOAD_DIR?.startsWith("/")
  ? process.env.UPLOAD_DIR
  : "/tmp/lovespin-uploads";
if (!connectionString) throw new Error("DATABASE_URL is required");

const sql = postgres(connectionString, { max: 1 });

try {
  const expired = await sql`
    select id, photo_path, certificate_path
    from love_pages
    where expires_at <= now()
    order by expires_at asc
    limit 500
  `;

  let failures = 0;
  const cleanedIds = await cleanupExpiredRows(expired, {
    uploadDir,
    onError(id, error) {
      failures += 1;
      console.error(`Failed to clean expired page ${id}`, error);
    },
  });

  if (cleanedIds.length > 0) {
    await sql`delete from love_pages where id in ${sql(cleanedIds)}`;
  }

  await sql`delete from publish_events where created_at < now() - interval '2 days'`;
  console.log(`Cleanup complete: ${cleanedIds.length} expired page(s) removed, ${failures} failed`);
  if (failures > 0) process.exitCode = 1;
} finally {
  await sql.end();
}
