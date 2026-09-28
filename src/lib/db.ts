import "server-only";
import postgres from "postgres";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://lovespin:lovespin@localhost:5432/lovespin";

type SqlClient = ReturnType<typeof postgres>;

const globalForDb = globalThis as typeof globalThis & {
  loveSpinSql?: SqlClient;
};

export const sql =
  globalForDb.loveSpinSql ??
  postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.loveSpinSql = sql;
