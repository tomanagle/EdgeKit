import { Hono } from "hono";
import { cors } from "hono/cors";
import type pino from "pino";
import { type Auth, createAuth } from "./auth";
import { createRequestLogger, requestLogger } from "./logger";
import { createPostsRouter } from "./modules/posts/posts.router";
import {
	createFilesRouter,
	createUploadRouter,
} from "./modules/upload/upload.router";
import type { HonoEnv } from "./types";
import { env } from "cloudflare:workers";

function createApp({
	logger,
	auth,
}: {
	logger: pino.Logger;
	auth: Auth;
}) {
	const app = new Hono<HonoEnv>();

	app.use("*", requestLogger(logger));

	// CORS middleware
	app.use(
		"*",
		cors({
			origin: env.FRONTEND_URL,
			allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			allowHeaders: ["Content-Type", "Authorization"],
			credentials: true,
		}),
	);

	app.on(["POST", "GET"], "/api/auth/*", (c) => {
		return auth.handler(c.req.raw);
	});

	// Health check
	app.get("/api/healthcheck", (c) => c.text("OK"));

	// Mount routers
	const routes = app
		.route("/api/posts", createPostsRouter({ auth }))
		.route("/api/upload", createUploadRouter({ auth }))
		.route("/api/files", createFilesRouter());

	return { app, routes };
}

export default {
	async fetch(request: Request, env: Cloudflare.Env): Promise<Response> {
		const logger = createRequestLogger(request);
		const auth = createAuth({ logger });

		const { app } = createApp({ logger, auth });
		return app.fetch(request, env);
	},
};

export type AppRoutes = ReturnType<typeof createApp>["routes"];
