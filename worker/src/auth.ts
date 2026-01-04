import type { env as Env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Database } from "./db";
import type { Logger } from "./logger";

const fakeSecret = "Nxcdjj9z+5sM1W9RNya+JttX5tOw30Eb+GUMkXADXWc";

export function createAuth(props: {
	db?: Database;
	env?: Env;
	logger?: Logger;
}) {
	return betterAuth({
		database: drizzleAdapter(props.db ?? ({} as Database), {
			provider: "sqlite",
		}),
		...(props.logger && {
			logger: {
				log: (level, message, ...args) => {
					props.logger?.[level](message, ...args);
				},
			},
		}),
		secret: props.env?.BETTER_AUTH_SECRET || fakeSecret,
		baseURL: props.env?.FRONTEND_URL,
		emailAndPassword: {
			enabled: true,
		},
		...(props.env?.SESSION_CACHE && {
			secondaryStorage: {
				get: (key: string) => {
					return props.env?.SESSION_CACHE.get(key);
				},
				set: (key: string, value: string) => {
					return props.env?.SESSION_CACHE.put(key, value);
				},
				delete: (key: string) => {
					return props.env?.SESSION_CACHE.delete(key);
				},
			},
		}),
		socialProviders: {
			...(props.env?.GITHUB_CLIENT_ID &&
				props.env.GITHUB_CLIENT_SECRET && {
					github: {
						clientId: props.env.GITHUB_CLIENT_ID,
						clientSecret: props.env.GITHUB_CLIENT_SECRET || "",
					},
				}),
		},
	});
}

const auth = createAuth({});
export default auth;

export type Auth = ReturnType<typeof createAuth>;
