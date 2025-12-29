import type { D1Database } from "@cloudflare/workers-types";

export type Env = {
	DB: D1Database;
	SESSION_CACHE: KVNamespace;
	BUCKET: R2Bucket;
	BETTER_AUTH_SECRET?: string;
	GITHUB_CLIENT_ID?: string;
	GITHUB_CLIENT_SECRET?: string;
	FRONTEND_URL: string;
};
