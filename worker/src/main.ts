import { Elysia, type HTTPHeaders, t } from "elysia";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";
import type pino from "pino";
import { type Auth, createAuth } from "./auth";
import { type Database, getDb } from "./db";
import { createRequestLogger, loggerPlugin } from "./logger";
import {
	createPostBodySchema,
	getPostsResponseSchema,
	postResponseSchema,
} from "./modules/posts/posts.schema";
import {
	createPostHandler,
	getPostHandler,
	getPostsHandler,
} from "./modules/posts/posts.service";
import { getFile, uploadFile } from "./modules/upload/upload.service";

const headers = (env: Env) => {
	return {
		"Access-Control-Allow-Origin": env.FRONTEND_URL,
		"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		"Access-Control-Allow-Credentials": "true",
	} satisfies HTTPHeaders;
};

function createApp({
	env,
	requestLogger,
	auth,
	db,
}: {
	env: Env;
	requestLogger: pino.Logger;
	auth: Auth;
	db: Database;
}) {
	return new Elysia({
		adapter: CloudflareAdapter,
		aot: false,
	})
		.headers(headers(env))
		.use(loggerPlugin(requestLogger))
		.macro({
			auth: {
				async resolve({ status, logger, request: { headers } }) {
					const session = await auth.api.getSession({
						headers,
					});
					if (!session) {
						logger.error({
							error: "Unauthorized",
						});
						return status(401);
					}

					return {
						user: session.user,
						session: session.session,
					};
				},
			},
		})
		.get("/api/healthcheck", () => "OK")
		.post(
			"/api/posts",
			({ body, user }) => createPostHandler({ body, userId: user.id }, db),
			{
				auth: true,
				body: createPostBodySchema,
				response: {
					201: postResponseSchema,
				},
			},
		)
		.get("/api/posts", () => getPostsHandler({ db }), {
			auth: true,
			response: {
				200: getPostsResponseSchema,
			},
		})
		.get(
			"/api/posts/:postId",
			({ params: { postId }, user }) =>
				getPostHandler({ postId, userId: user.id }, db),
			{
				auth: true,
				response: {
					200: postResponseSchema,
				},
			},
		)
		.post(
			"/api/upload",
			async ({ user, body, request }) => {
				const { file } = body;

				if (!file) {
					return new Response("File is required", { status: 400 });
				}

				const result = await uploadFile({
					file,
					userId: user.id,
					env,
					requestUrl: request.url,
				});

				return result;
			},
			{
				body: t.Object({ file: t.File({ type: "image" }) }),
				auth: true,
			},
		)
		.get("/api/files/*", async ({ request, logger }) => {
			// Extract the key from the path
			// The path will be /api/files/posts/userId/uuid.ext
			const url = new URL(request.url);
			const pathParts = url.pathname.split("/api/files/");

			if (pathParts.length < 2 || !pathParts[1]) {
				return new Response("Invalid path", { status: 400 });
			}

			// The key is everything after /api/files/
			const encodedKey = pathParts[1];
			let decodedKey: string;
			try {
				decodedKey = decodeURIComponent(encodedKey);
			} catch {
				decodedKey = encodedKey;
			}

			logger.info({ encodedKey, decodedKey }, "Fetching file from R2");

			const file = await getFile({ key: decodedKey, env });
			if (!file) {
				logger.warn({ encodedKey, decodedKey }, "File not found in R2");
				return new Response("Not Found", { status: 404 });
			}
			return file;
		});
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const requestLogger = createRequestLogger();
		const db = getDb(env.DB);
		const auth = createAuth({ db, env });

		// Handle auth routes before Elysia to avoid body consumption
		const url = new URL(request.url);
		if (url.pathname.startsWith("/api/auth")) {
			if (request.method === "OPTIONS") {
				return new Response(null, {
					headers: headers(env),
				});
			}

			const response = await auth.handler(request);

			for (const [key, value] of Object.entries(headers(env))) {
				response.headers.set(key, value);
			}

			return response;
		}
		return createApp({ env, requestLogger, auth, db }).fetch(request);
	},
};

export type App = ReturnType<typeof createApp>;
