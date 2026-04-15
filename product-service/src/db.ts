import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../domain/entities";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://ecommerce:ecommerce@postgres:5432/ecommerce";

const client = postgres(DATABASE_URL);
export const db = drizzle(client, { schema });

async function waitForPostgres(retries = 10, delay = 2000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await client`SELECT 1`;
      console.log("🗄️  Connected to PostgreSQL");
      return;
    } catch (err) {
      if (i < retries - 1) {
        console.log(`⏳ Waiting for PostgreSQL... (${i + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

export async function connectDatabase() {
  await waitForPostgres();
  return client;
}