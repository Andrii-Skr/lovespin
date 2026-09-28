import fs from "node:fs/promises";
import path from "node:path";
import { loadEnvFile } from "node:process";
import postgres from "postgres";

for (const envFile of [".env.local", ".env"]) {
  try {
    loadEnvFile(path.join(process.cwd(), envFile));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const sql = postgres(connectionString, { max: 1 });

try {
  const migrationsDir = path.join(process.cwd(), "migrations");
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  await sql`create table if not exists schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )`;

  for (const file of files) {
    const [applied] = await sql`select name from schema_migrations where name = ${file}`;
    if (applied) continue;

    const source = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(source);
      await tx`insert into schema_migrations (name) values (${file})`;
    });
    console.log(`Applied migration ${file}`);
  }
} finally {
  await sql.end();
}
