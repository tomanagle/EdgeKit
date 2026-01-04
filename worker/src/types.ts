import type { env as Env } from "cloudflare:workers";
import type { Session, User } from "better-auth/types";
import type pino from "pino";

export type Variables = {
	user: User;
	session: Session;
	logger: pino.Logger;
};

export type HonoEnv = {
	Bindings: typeof Env;
	Variables: Variables;
};
