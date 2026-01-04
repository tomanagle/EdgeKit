import { Hono } from "hono";
import { cors } from "hono/cors";
import type pino from "pino";
import { type Auth, createAuth } from "./auth";
import { type Database, getDb } from "./db";
import { createRequestLogger, requestLogger } from "./logger";
import { createPostsRouter } from "./modules/posts/posts.router";
import {
	createFilesRouter,
	createUploadRouter,
} from "./modules/upload/upload.router";
import type { HonoEnv } from "./types";

function createApp({
	env,
	logger,
	auth,
	db,
}: {
	env: Env;
	logger: pino.Logger;
	auth: Auth;
	db: Database;
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
		.route("/api/posts", createPostsRouter({ auth, db }))
		.route("/api/upload", createUploadRouter({ auth, env }))
		.route("/api/files", createFilesRouter({ env }));

	return { app, routes };
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const logger = createRequestLogger(request);
		const db = getDb(env.DB);
		const auth = createAuth({ db, env, logger });

		const { app } = createApp({ env, logger, auth, db });
		return app.fetch(request, env);
	},
};

export type AppRoutes = ReturnType<typeof createApp>["routes"];
