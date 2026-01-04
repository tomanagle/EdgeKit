import { Hono } from "hono";
import type { Auth } from "../../auth";
import { authMiddleware } from "../../middleware";
import type { HonoEnv } from "../../types";
import { getFile, uploadFile } from "./upload.service";

export function createUploadRouter({ auth, env }: { auth: Auth; env: Env }) {
	return new Hono<HonoEnv>().post(
		"/",
		async (c, next) => authMiddleware(auth, c, next),
		async (c) => {
			const user = c.get("user");
			const body = await c.req.parseBody();
			const file = body.file;

			if (!file || !(file instanceof File)) {
				return c.json({ error: "File is required" }, 400);
			}

			const result = await uploadFile({
				file,
				userId: user.id,
				env,
			});

			return c.json(result);
		},
	);
}

export function createFilesRouter({ env }: { env: Env }) {
	return new Hono<HonoEnv>().get("/*", async (c) => {
		const logger = c.get("logger");
		const url = new URL(c.req.url);
		const pathParts = url.pathname.split("/api/files/");

		if (pathParts.length < 2 || !pathParts[1]) {
			return c.text("Invalid path", 400);
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
			return c.text("Not Found", 404);
		}
		return file;
	});
}
