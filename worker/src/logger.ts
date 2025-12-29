import Elysia from "elysia";
import pino from "pino";

export const logger = pino({
	level: "info",
	transport: {
		target: "pino-pretty",
	},
});

export function createRequestLogger(): pino.Logger {
	const correlationId = crypto.randomUUID();
	return logger.child({ correlationId });
}

interface LoggerStore {
	startTime: number;
	correlationId: string;
	logger: pino.Logger;
}

export function loggerPlugin(requestLogger: pino.Logger) {
	const correlationId = (
		requestLogger.bindings as unknown as {
			correlationId: string;
		}
	).correlationId;

	return new Elysia()
		.onRequest((ctx) => {
			ctx.store = {
				...ctx.store,
				startTime: performance.now(),
				correlationId,
				logger: requestLogger,
			};
		})
		.derive((ctx) => {
			const store = ctx.store as LoggerStore | undefined;
			return {
				logger: store?.logger ?? requestLogger,
			};
		})
		.onAfterHandle((ctx) => {
			const store = ctx.store as LoggerStore | undefined;
			const startTime = store?.startTime ?? performance.now();
			const durationMs = Number((performance.now() - startTime).toFixed(2));

			requestLogger.info(
				{
					method: ctx.request.method,
					path: `${ctx.request.method} ${ctx.path}`,
					statusCode: typeof ctx.set.status === "number" ? ctx.set.status : 200,
					durationMs,
				},
				"Request handled",
			);
		})
		.onError((ctx) => {
			requestLogger.error(
				{
					method: ctx.request.method,
					path: `${ctx.request.method} ${ctx.path}`,
					statusCode: typeof ctx.set.status === "number" ? ctx.set.status : 200,
					error: ctx.error,
				},
				"Request error",
			);
		})
		.as("global");
}

export type Logger = typeof logger;
