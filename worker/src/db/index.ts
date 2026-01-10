import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb(d1: D1Database) {
	return drizzle(d1, { schema, casing: "snake_case" });
}

export type D1 = ReturnType<typeof getDb>;

export type Database = ReturnType<typeof getDb>;

export const db = drizzle(env.DB, { schema });
