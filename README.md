# EdgeKit
Full-stack starter kit for building production-ready applications on Cloudflare Workers. Built with type-safety, authentication, and developer experience in mind.

## Deployment
### Setup
The setup script will 
- create a Cloudflare D1 database, R2 bucket, and KV namespace
- update the `worker/wrangler.toml` file with the new resources
- update the package.json files with the new application name
- generate the database schema and authentication schema
- apply the migrations to the database

1. Run `bun run setup`
2. Follow the prompts to enter your application name
3. Push the wrangler.toml file changes to your repository

### Deploying the worker
1. Go to Workers & Pages under Compute & AI
2. Click 'Create application'
3. Continue with GitHub
4. Give Cloudflare access to your GitHub repository if you haven't already
5. Select the repository you want to deploy
6. In build command, enter `bun run build`
7. Click advanced settings
8. In path enter `/worker`
9. Add environment variables and secrets as required - This is optional, you can do it later but if your build requires them it will fail until you add them.
10. Click 'Deploy'

### Deploying the frontend
1. Go to Workers & Pages under Compute & AI
2. Click 'Create application'
3. Continue with GitHub
4. Give Cloudflare access to your GitHub repository if you haven't already
5. Select the repository you want to deploy
6. In build command, enter `bun run build`
7. Click advanced settings
8. In path enter `/frontend`
9. Add environment variables and secrets as required - This is optional, you can do it later but if your build requires them it will fail until you add them.
10. Click 'Deploy'

## Local Development
### Prerequisites

- [Bun](https://bun.sh/) installed
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)


**Install dependencies:**
```bash
bun install
```

**Generate and apply database migrations:**
```bash
bun run generate
```

**Configure environment variables in `worker/wrangler.toml`:**
Update the environment variables in the `worker/wrangler.toml` file.
```toml
[vars]
BACKEND_URL = "http://localhost:8787"
FRONTEND_URL = "http://localhost:5173"
BETTER_AUTH_URL = "http://localhost:8787"
BETTER_AUTH_SECRET = "your-better-auth-secret"
GITHUB_CLIENT_ID = "your-github-client-id" # Optional
```
You can copy use the .dev.vars.template file to store local variables and secrets.


**Add secrets (don't commit these):**
```bash
cd worker
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GITHUB_CLIENT_SECRET # If using GitHub OAuth
```

**Run both frontend and backend in development mode:**

```bash
# Terminal 1 - Backend
bun run worker:dev

# Terminal 2 - Frontend
bun run frontend:dev
```

- Backend runs on http://localhost:8787
- Frontend runs on http://localhost:5173

## Tech Stack

### Backend (Cloudflare Worker)

- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Serverless execution environment
- **[Hono](https://hono.dev/)** - Ultrafast web framework for the edge
- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM
- **[Cloudflare D1](https://developers.cloudflare.com/d1/)** - Serverless SQLite database
- **[Cloudflare R2](https://developers.cloudflare.com/r2/)** - Object storage
- **[Better Auth](https://www.better-auth.com/)** - Authentication with email/password and OAuth
- **[Pino](https://getpino.io/)** - Logging
- **[Zod](https://zod.dev/)** - Schema validation

### Frontend

- **[React](https://react.dev/)** - UI library
- **[Vite](https://vitejs.dev/)** - Build tool
- **[TanStack Router](https://tanstack.com/router)** - File-based routing
- **[TanStack Query](https://tanstack.com/query)** - Data synchronization
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS
- **[Radix UI](https://www.radix-ui.com/)** - UI primitives
- **[shadcn/ui](https://ui.shadcn.com/)** - Component collection
- **[Hono RPC](https://hono.dev/docs/guides/rpc)** - End-to-end type safety

### Development Tools

- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Biome](https://biomejs.dev/)** - Linter and formatter
- **[Wrangler](https://developers.cloudflare.com/workers/wrangler/)** - Cloudflare Workers CLI
- **[Bun](https://bun.sh/)** - JavaScript runtime and package manager

## Project Structure

```
edgekit/
├── worker/              # Cloudflare Worker backend
│   ├── src/
│   │   ├── auth.ts      # Better Auth configuration
│   │   ├── main.ts      # Main application entry
│   │   ├── middleware.ts # Auth and other middleware
│   │   ├── types.ts     # Shared types
│   │   ├── db/          # Database schema and connection
│   │   ├── modules/     # Feature modules (posts, upload, etc.)
│   │   │   ├── posts/
│   │   │   │   ├── posts.router.ts   # Posts routes
│   │   │   │   ├── posts.service.ts  # Business logic
│   │   │   │   └── posts.schema.ts   # Validation schemas
│   │   │   └── upload/
│   │   │       ├── upload.router.ts  # Upload routes
│   │   │       └── upload.service.ts # Upload logic
│   │   └── logger.ts    # Logging configuration
│   ├── migrations/      # Database migrations
│   └── wrangler.toml    # Cloudflare Workers config
│
├── frontend/            # React frontend
│   ├── src/
│   │   ├── routes/      # File-based routes
│   │   ├── components/  # React components
│   │   └── lib/         # Utilities and configuration
│   └── vite.config.ts   # Vite configuration
│
└── CLAUDE.md            # AI assistant instructions
```
