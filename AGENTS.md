# AGENTS.md

**Guidelines for AI coding agents working in the EdgeKit codebase.**

## Overview

EdgeKit is a Cloudflare Workers full-stack starter with:
- **Backend**: Hono + Drizzle ORM + Better Auth (in `worker/`)
- **Frontend**: React + TanStack Router/Query/Form + Tailwind v4 (in `frontend/`)
- **Database**: Cloudflare D1 (SQLite)
- **Package Manager**: Bun (NOT npm/pnpm/yarn)

## Build, Lint, Test Commands

### Development
```bash
bun run worker:dev          # Start worker on localhost:8787
bun run frontend:dev        # Start frontend on localhost:5173
```

### Build
```bash
bun run worker:build        # Build worker
bun run frontend:build      # Build frontend (runs tsc + vite build)
```

### Lint & Format
```bash
bun run lint                # Check all files with Biome
bun run lint:fix            # Auto-fix all files with Biome
cd worker && bun run lint   # Lint worker only
cd frontend && bun run lint # Lint frontend only
```

### Database
```bash
bun run generate            # Generate auth + Drizzle schemas
bun run db:migrate          # Apply migrations to local D1
bun run db:migrate:prod     # Apply migrations to production D1
bun run db:studio           # Open Drizzle Studio GUI
```

### Deployment
```bash
bun run worker:deploy       # Deploy worker to Cloudflare
```

### Testing
**Note**: No test suite is currently configured. When adding tests, use Vitest.

To run a single test (once configured):
```bash
bun test path/to/test.spec.ts
```

## Code Style Guidelines

### Formatter Settings (Biome)
- **Indentation**: Tabs (NOT spaces)
- **Quotes**: Double quotes (`"`)
- **Semicolons**: Always required
- **Import organization**: Auto-sorted by Biome
- **Max line length**: Not enforced

### Import Ordering
Imports are auto-organized by Biome in this order:
1. Node.js built-ins (`node:crypto`, `node:fs`)
2. External packages (`hono`, `react`)
3. Type imports (`type { User }`)
4. Internal modules (relative imports)
5. Alias imports (`@/components`)

Example:
```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import type pino from "pino";
import { type Auth, createAuth } from "./auth";
import { type Database, getDb } from "./db";
```

### Naming Conventions
- **Variables/Functions**: `camelCase` (e.g., `authClient`, `createPostHandler`)
- **Types/Interfaces**: `PascalCase` (e.g., `AppRoutes`, `RouterContext`)
- **Constants**: `SCREAMING_SNAKE_CASE` for env vars (e.g., `VITE_API_BASE_URL`)
- **Files**: 
  - Components: `PascalCase.tsx` or `kebab-case.tsx`
  - Utils/modules: `kebab-case.ts`
  - Routes: `kebab-case.tsx` with special prefixes (`_authenticated/`, `$postId.tsx`)
- **Database tables**: `snake_case` (e.g., `post`, `event`)

### TypeScript Usage

#### Always Use Explicit Type Imports
```typescript
import type { Session, User } from "better-auth";
import type pino from "pino";
```

#### Use Zod for Validation + Type Inference
```typescript
import { z } from "zod";

export const createPostBodySchema = z.object({
	title: z.string(),
	body: z.string(),
	image: z.string().optional(),
});

export type CreatePostBody = z.infer<typeof createPostBodySchema>;
```

#### Leverage Type Inference from Libraries
```typescript
// Drizzle ORM
export function getDb(d1: D1Database) {
	return drizzle(d1, { schema });
}
export type Database = ReturnType<typeof getDb>;

// Hono RPC (end-to-end type safety)
export type AppRoutes = ReturnType<typeof createApp>["routes"];
```

#### Enable Strict TypeScript Settings
- `strict: true`
- `noUncheckedIndexedAccess: true` (worker)
- `noImplicitOverride: true` (worker)
- `noUnusedLocals: true` (frontend)
- `noUnusedParameters: true` (frontend)

### Error Handling Patterns

#### Worker: Try-Catch with Logging
```typescript
try {
	await next();
} catch (e) {
	const error = e instanceof Error ? e : new Error(String(e));
	logger.error({ error: error.message }, "Request error");
	throw e;
}
```

#### Middleware: Early Returns with Status Codes
```typescript
if (!session) {
	logger.error({ error: "Unauthorized" });
	return c.json({ error: "Unauthorized" }, 401);
}

if (!file || !(file instanceof File)) {
	return c.json({ error: "File is required" }, 400);
}
```

#### Frontend: React Query Error Handling
```typescript
export async function getPosts() {
	const result = await client.api.posts.$get();
	
	if (!result.ok) {
		throw new Error("Failed to get posts");
	}
	return result.json();
}
```

#### Form Validation: Inline Validators
```typescript
<form.Field
	name="title"
	validators={{
		onChange: ({ value }) =>
			!value
				? "Title is required"
				: value.length < 3
					? "Title must be at least 3 characters"
					: undefined,
	}}
>
```

## Architecture Patterns

### Worker: Feature Module Structure
```
modules/
├── posts/
│   ├── posts.router.ts   # Routes + middleware
│   ├── posts.service.ts  # Business logic + DB queries
│   └── posts.schema.ts   # Zod validation + types
```

**Pattern**: Router defines HTTP routes → Service contains logic → Schema defines validation.

### Router Factory Pattern (Dependency Injection)
```typescript
export function createPostsRouter({ auth }: { auth: Auth }) {
	return new Hono<HonoEnv>()
		.post("/", middleware, validator, handler)
		.get("/", middleware, handler);
}
```

### Frontend: File-Based Routing
```
routes/
├── __root.tsx              # Root layout wrapper
├── _authenticated/         # Protected routes group
│   ├── route.tsx          # Auth layout
│   ├── index.tsx          # /
│   └── posts/
│       ├── $postId.tsx    # /posts/:postId (dynamic)
│       └── new.tsx        # /posts/new
```

**Pattern**: `_prefix` = layout route, `$prefix` = dynamic parameter.

### Protected Routes Pattern
```typescript
beforeLoad: async ({ location }) => {
	const { data } = await queryClient.ensureQueryData({
		queryKey: ["session"],
		queryFn: () => authClient.getSession({}),
	});

	if (!data && !location.pathname.includes("/auth")) {
		throw redirect({ href: `/auth/login?redirectTo=${location.pathname}` });
	}
};
```

## Important Conventions

### Database Timestamps
Use Drizzle's built-in timestamp helpers:
```typescript
createdAt: integer("created_at", { mode: "timestamp_ms" })
	.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
	.notNull(),
updatedAt: integer("updated_at", { mode: "timestamp_ms" })
	.$onUpdate(() => new Date())
	.notNull(),
```

### Logging (Worker)
Always use the Pino logger from context:
```typescript
const logger = c.get("logger");
logger.info({ userId, postId }, "Creating post");
logger.error({ error: err.message }, "Failed to create post");
```

### Auth Middleware Usage
```typescript
import { authMiddleware } from "../middleware";

.post("/", 
	async (c, next) => authMiddleware(auth, c, next),
	zValidator("json", createPostBodySchema),
	async (c) => {
		const user = c.get("user"); // Available after authMiddleware
		// ...
	}
)
```

### Component Styling (Frontend)
Use Tailwind CSS v4 classes. For reusable components, use `cn()` utility:
```typescript
import { cn } from "@/lib/utils";

className={cn("flex items-center", className)}
```

## Common Pitfalls

1. **DON'T use npm/pnpm/yarn** → Always use `bun`
2. **DON'T use spaces** → Use tabs for indentation
3. **DON'T use single quotes** → Use double quotes
4. **DON'T skip type imports** → Always use `import type` for types
5. **DON'T forget migrations** → Run `bun run generate` after schema changes
6. **DON'T commit secrets** → Use `wrangler secret put` for production secrets

## References

- **CLAUDE.md**: Comprehensive AI assistant instructions
- **Biome Config**: `biome.json` (linter + formatter settings)
- **Worker Config**: `worker/wrangler.toml` (Cloudflare bindings)
- **Frontend Config**: `frontend/vite.config.ts` (routing + proxy)
- **DB Schema**: `worker/src/db/schema.ts` and `worker/src/db/auth-schema.ts`
