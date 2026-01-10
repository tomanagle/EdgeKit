import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import type { Logger } from "./logger";

const fakeSecret = "Nxcdjj9z+5sM1W9RNya+JttX5tOw30Eb+GUMkXADXWc";

export function createAuth(props: { logger?: Logger }) {
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "sqlite",
			camelCase: false,
		}),
		...(props.logger && {
			logger: {
				log: (level, message, ...args) => {
					props.logger?.[level](message, ...args);
				},
			},
		}),
		secret: env.BETTER_AUTH_SECRET || fakeSecret,
		// it's type if function during auth:generate for some reason
		...(env.FRONTEND_URL &&
			typeof env.FRONTEND_URL === "string" && {
				baseURL: env.FRONTEND_URL,
			}),
		emailAndPassword: {
			enabled: true,
		},
		...(env.SESSION_CACHE && {
			secondaryStorage: {
				get: (key: string) => {
					return env.SESSION_CACHE.get(key);
				},
				set: (key: string, value: string) => {
					return env.SESSION_CACHE.put(key, value);
				},
				delete: (key: string) => {
					return env.SESSION_CACHE.delete(key);
				},
			},
		}),
		socialProviders: {
			...(env.GITHUB_CLIENT_ID &&
				env.GITHUB_CLIENT_SECRET && {
					github: {
						clientId: env.GITHUB_CLIENT_ID,
						clientSecret: env.GITHUB_CLIENT_SECRET || "",
					},
				}),
		},
	});
}

const auth = createAuth({});
export default auth;

export type Auth = ReturnType<typeof createAuth>;
