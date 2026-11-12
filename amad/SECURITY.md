# AMAD Security

No regulatory compliance (ISO 27001, SOC 2, NCA ECC, etc.) is claimed. No external security
assessment or penetration test has been performed.

## Implemented controls
| Area | Control | Where |
|---|---|---|
| Passwords | bcrypt cost 12; min 10 chars with letter + digit; constant-time path for unknown emails (dummy hash) | `server/auth/service.ts` |
| Sessions | 256-bit random token in `httpOnly`, `SameSite=Lax`, `Secure` (production) cookie; only SHA-256 stored; 7-day expiry; logout revokes; "end other sessions" | `server/auth/*` |
| Brute force | Sliding 15-min window: 5 failures per account, 20 per source IP → HTTP 429 / form error | `server/auth/service.ts` |
| Authorization | Role→permission matrix enforced in the **service layer** on every call; UI hiding is cosmetic only | `server/auth/rbac.ts`, `server/services/*` |
| Tenant isolation | All queries scoped by `actor.orgId`; cross-tenant resources return 404 (indistinguishable from non-existent) | services; integration-tested |
| Write ownership | Only the session owner can act on a session; team viewers are read-only | `getSessionForActor({write:true})` |
| CSRF | Server Actions use Next's built-in origin check; route handlers require a same-origin `Origin` header; SameSite cookies | `server/http.ts` |
| Input validation | Zod schemas for auth and investigation; console grammar whitelist (`[a-z0-9 .-_]`, ≤120 chars, known verbs/arity) | `domain/engine/simulation.ts#parseCommand` |
| Simulation boundary | No shell, network or file access from the engine. Adversary effects are a closed whitelist validated by the Guardian against the twin | `domain/engine/guardian.ts` |
| Errors | 4xx return a machine code only; 5xx return `internal-error`, details only in server logs | `server/http.ts` |
| Headers | CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy; `X-Powered-By` removed | `next.config.ts` |
| Audit | register, login, failed login, rate-limit, logout, session revocation, simulation start/end/complete, team view | `AuditLog` |
| Secrets | Only `DATABASE_URL` (+ optional demo password) from env; `.env*` git-ignored; no secrets reach the client | `.env.example` |
| Dependencies | `npm audit --omit=dev`: 0 vulnerabilities (2026-11-12). Dev-only: 8 moderate in a `minimatch` range used by tooling, fix requires forced breaking upgrade | — |

## Known risks / gaps (open)
1. **CSP allows `'unsafe-inline'`** for scripts/styles (Next bootstrap). Move to nonce-based CSP.
2. **IP for rate limiting comes from `x-forwarded-for`**, which is only trustworthy behind a proxy that overwrites it. Configure the deployment accordingly.
3. **Rate-limit counters are DB queries over `AuditLog`** — fine at small scale; move to Redis for high volume.
4. **No email verification or password reset** — requires an email provider (not configured).
5. **No MFA**.
6. **No organization invitations UI** — members can only be added via DB/seed today.
7. **Super-admin flag exists but no admin panel** — no privileged UI to secure yet.
8. **AI prompt-injection defenses**: no LLM is integrated yet. When the AI planner/scenario generator is added, model output must stay behind the Guardian and schema validation (the planner interface already enforces this boundary).
9. **No file uploads** exist yet.
10. Session tokens are not rotated on privilege change (roles cannot change via UI yet).
