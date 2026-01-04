---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

# Cloudflare Workers Project

This project uses Cloudflare Workers with Hono framework.

## Package Manager

Use Bun for package management:

- Use `bun install` instead of `npm install`
- Use `bun run <script>` instead of `npm run <script>`

## Development

Start the development server:

```sh
bun run worker:dev
bun run frontend:dev
```

This runs `wrangler dev` which starts the local Cloudflare Workers development server on port 8787.

## Framework

Use Hono for building the worker:

```ts#src/main.ts
import { Hono } from 'hono'

const app = new Hono()
  .get('/', (c) => c.text('Hello Cloudflare Workers!'))
  .get('/api/users/:id', (c) => {
    const id = c.req.param('id')
    return c.json({ id })
  })

export default app
```

## Deployment

Deploy to Cloudflare Workers:

```sh
bun run deploy
```

## Configuration

The worker is configured via `wrangler.toml`:

```toml
name = "edgekit"
main = "src/main.ts"
compatibility_date = "2024-10-01"

[dev]
port = 8787
```

## Database with Drizzle ORM

This project uses Drizzle ORM with Cloudflare D1 for database operations.

### Define Schema

Create your schema in `src/db/schema.ts`:

```ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})
```

### Use in Routes

Access D1 through Drizzle in your routes:

```ts
import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { users } from './db/schema'

type Env = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Env }>()

app.get('/api/users', async (c) => {
  const db = drizzle(c.env.DB)
  const allUsers = await db.select().from(users)
  return c.json(allUsers)
})
```

### Database Commands

```sh
# Generate migrations from schema
bun run db:generate

# Apply migrations to D1 database
bun run db:migrate

# Open Drizzle Studio (database GUI)
bun run db:studio
```

### Setup D1 Database

1. Create a D1 database:
```sh
wrangler d1 create edgekit-db
```

2. Update `wrangler.toml` with the database ID from the output

3. Generate and apply migrations:
```sh
bun run db:generate
bun run db:migrate
```

## Bindings

D1 and other Cloudflare bindings are configured in `wrangler.toml` and accessed via `c.env`:

```ts
app.get('/data', async (c) => {
  const db = c.env.DB // D1 database
  const bucket = c.env.BUCKET // R2 bucket
  return c.json({ message: 'OK' })
})
```

## Authentication with Better Auth

This project uses Better Auth for authentication with email/password and social providers.

### Auth Routes

Better Auth provides built-in routes at `/api/auth/*`:

- `POST /api/auth/sign-up/email` - Sign up with email and password
- `POST /api/auth/sign-in/email` - Sign in with email and password
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session
- `GET /api/auth/sign-in/github` - Sign in with GitHub (if configured)

### Protected Routes

Create middleware to protect routes:

```ts
import { createMiddleware } from 'hono/factory'

const authMiddleware = createMiddleware(async (c, next) => {
  const auth = createAuth({ db: c.get('db'), env: c.env })
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('user', session.user)
  await next()
})

app.get('/api/me', authMiddleware, async (c) => {
  const user = c.get('user')
  return c.json({ user })
})
```

### Configuration

Auth configuration is in `src/auth.ts`. Environment variables in `wrangler.toml`:

- `BETTER_AUTH_SECRET` - Secret key for signing tokens
- `BETTER_AUTH_URL` - Base URL of your application
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID (optional)
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret (optional)

### Database Schema

Better Auth requires specific tables defined in `src/db/schema.ts`:

- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth accounts and passwords
- `verification` - Email verification tokens

After adding auth tables, regenerate and apply migrations:

```sh
bun run db:generate
bun run db:migrate
```

## Validation with Zod

Use Zod for request validation with Hono:

```ts
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
})

app.post('/api/users',
  zValidator('json', createUserSchema),
  async (c) => {
    const body = c.req.valid('json')
    // body is typed as { name: string; email: string }
    return c.json({ success: true })
  }
)
```

For more information, see [Cloudflare Workers docs](https://developers.cloudflare.com/workers/), [Hono docs](https://hono.dev/), [Drizzle docs](https://orm.drizzle.team/), and [Better Auth docs](https://www.better-auth.com/).
