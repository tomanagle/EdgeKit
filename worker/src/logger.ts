import crypto from "node:crypto";
import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import pino from "pino";

export const logger = pino({
	level: "info",
});

export function createRequestLogger(request: Request): pino.Logger {
	const corrId = request.headers.get("cf-ray") ?? crypto.randomUUID();
	return logger.child({ corrId });
}

export function requestLogger(logger: pino.Logger) {
	return createMiddleware(async (c: Context, next: Next) => {
		const start = performance.now();

		c.set("logger", logger);

		let error: Error | undefined;

		try {
			await next();
		} catch (e) {
			error = e instanceof Error ? e : new Error(String(e));
			throw e;
		} finally {
			const duration = performance.now() - start;
			const status = c.res.status;

			const logData = {
				method: c.req.method,
				path: c.req.path,
				status,
				duration: `${duration.toFixed(2)}ms`,
				...(error && { error: error.message, stack: error.stack }),
			};

			if (error || status > 399) {
				logger.error(logData, "Request error");
			} else {
				logger.info(logData, "Request completed");
			}
		}
	});
}

export type Logger = pino.Logger;
