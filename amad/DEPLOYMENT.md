# AMAD Deployment

**Status: not deployed.** No production deployment has been performed or verified.

## Requirements
- Node.js 22+
- PostgreSQL 14+ (verified locally on 16.15)
- Environment: `DATABASE_URL` (required). Optional: `AMAD_DEMO_MODE`, `AMAD_DEMO_PASSWORD` (seed only).

## Steps
```bash
npm ci                       # runs prisma generate
npx prisma migrate deploy    # apply migrations
npm run db:seed              # catalog (idempotent)
npm run build
npm run start                # PORT env var selects the port
```

## Production notes
- Serve behind HTTPS (the session cookie is `Secure` when `NODE_ENV=production`).
- Ensure the reverse proxy **overwrites** `X-Forwarded-For` (used for per-IP login rate limiting).
- The app lives in the `amad/` subfolder of a repository whose root is a different Next.js app.
  `turbopack.root` is pinned in `next.config.ts`; on hosting platforms set the project root to `amad/`.
- Not yet provided: Dockerfile, CI pipeline, health-check endpoint, structured logging/monitoring,
  background job runner (needed for the threat-intel sync phase). See `ROADMAP.md`.
