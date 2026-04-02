import { Pool } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migration_sql = readFileSync(join(__dirname, "migrations/001-initial.sql"), "utf-8");

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "" });
await pool.query(migration_sql);
await pool.end();
console.log("Migration complete.");
