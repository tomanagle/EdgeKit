import type { env as Env } from "cloudflare:workers";
import type { Session, User } from "better-auth/types";
import type pino from "pino";
import type { Context } from "hono";

export type Variables = {
	user: User;
	session: Session;
	logger: pino.Logger;
};

export type HonoEnv = {
	Bindings: typeof Env;
	Variables: Variables;
};

export type Ctx = Context<HonoEnv>;
