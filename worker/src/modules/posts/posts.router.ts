import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { Auth } from "../../auth";
import type { Database } from "../../db";
import { authMiddleware } from "../../middleware";
import type { HonoEnv } from "../../types";
import { createPostBodySchema } from "./posts.schema";
import {
	createPostHandler,
	getPostHandler,
	getPostsHandler,
} from "./posts.service";

export function createPostsRouter({ auth, db }: { auth: Auth; db: Database }) {
	return new Hono<HonoEnv>()
		.post(
			"/",
			async (c, next) => authMiddleware(auth, c, next),
			zValidator("json", createPostBodySchema),
			async (c) => {
				const body = c.req.valid("json");
				const user = c.get("user");
				const result = await createPostHandler({ body, userId: user.id }, db);
				return c.json(result, 201);
			},
		)
		.get(
			"/",
			async (c, next) => authMiddleware(auth, c, next),
			async (c) => {
				const result = await getPostsHandler({ db });
				return c.json(result);
			},
		)
		.get(
			"/:postId",
			async (c, next) => authMiddleware(auth, c, next),
			async (c) => {
				const postId = c.req.param("postId");
				const user = c.get("user");
				const result = await getPostHandler({ postId, userId: user.id }, db);
				return c.json(result);
			},
		);
}
