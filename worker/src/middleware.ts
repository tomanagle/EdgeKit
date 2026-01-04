import type { Context, Next } from "hono";
import type { Auth } from "./auth";
import type { HonoEnv } from "./types";

export async function authMiddleware(
	auth: Auth,
	c: Context<HonoEnv>,
	next: Next,
) {
	const logger = c.get("logger");
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		logger.error({
			error: "Unauthorized",
		});
		return c.json({ error: "Unauthorized" }, 401);
	}

	c.set("user", session.user);
	c.set("session", session.session);
	await next();
}
