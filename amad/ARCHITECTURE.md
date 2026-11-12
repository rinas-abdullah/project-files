# AMAD Architecture

A single Next.js 16 application (App Router, React 19, TypeScript) with a strict internal layering.
No microservices: one deployable, one PostgreSQL database.

```
src/
  domain/            Pure, framework-free, deterministic logic (unit-tested)
    engine/          types, seeded RNG, simulation engine, adversary planner, guardian
    scenarios/       authored scenario catalog + competency list
    forensics/       investigation submission schema + scoring
    readiness/       readiness scoring (methodology v1) + profile EMA
    recommend/       explainable next-scenario ranking
  server/            Server-only code (imports "server-only")
    db.ts            Prisma client (pg driver adapter)
    auth/            password hashing, DB sessions, RBAC, cookie layer
    services/        simulation, assessment (forensics→readiness→recommendation), dashboard, views
    http.ts          route-handler wrapper: origin check, auth, safe error mapping
    audit.ts         audit log writer
  app/               Routes (UI + API). Pages call services; they never touch the DB directly
    api/sessions/[id]/commands        POST defensive command
    api/sessions/[id]/investigation   POST forensic findings
    actions/         Server Actions (auth, start session, notifications)
  components/        UI primitives (design system), arena/forensics/report clients, charts
  proxy.ts           Optimistic redirect for /app/* without a session cookie
prisma/              schema, migrations, seed
tests/               unit, integration (real PostgreSQL), e2e (Playwright)
```

## The learning loop, as implemented

```
startSession ──► startSimulation(def, seed, learnerProfile)        [stage 1+2]
                   └─ adversary planner ─► guardian ─► apply node ─► events/evidence
executeCommand ─► applyCommand(def, state, cmd)                     [stage 2]
                   ├─ defender effect (isolate/disable/block/kill/image/…)
                   ├─ simulated clock advances by command cost
                   └─ adversary turns while nextActionAt ≤ minute (planner → guardian)
                 contained | breached | timeout ─► phase FORENSICS, evidence persisted
submitInvestigation (one transaction)                               [stage 3→4→5]
   scoreInvestigation vs groundTruth(state) ─► computeReadiness
   ─► BehavioralProfile EMA update ─► rankScenarios ─► TrainingRecommendation
   ─► Notifications ─► AuditLog
next startSession reads the updated profile ─► adversary tempo/stealth adapts [back to 1]
```

### Determinism and replay
The engine is a pure function `state' = f(definition, state, command)`. The PRNG state lives
inside `SimState`, the seed is stored on the session, and every defender command is stored in
order (`DefenderAction`). Replaying the same seed + commands reproduces the session exactly
(unit-tested). This is the foundation for the planned "What If?" counterfactual analysis.

### Adversary + Guardian
`AdversaryPlanner` is an interface. The only implementation today is the deterministic planner
(`domain/engine/adversary.ts`), which scores eligible graph nodes using tactic progress,
objective value, the learner's skill (stealth preference), adaptive-path bonus after being
blocked, difficulty and seeded jitter. Every proposal — including any future LLM planner — goes
through `validateProposal` (`domain/engine/guardian.ts`), which only permits nodes in the
approved graph whose preconditions hold and whose effects are whitelisted, simulation-only
transitions on assets/identities that exist in the twin. Approved and rejected verdicts are
persisted (`AdversaryAction`) with the planner's rationale and candidate scores.

### Fog of war
`server/services/views.ts` projects the session for the browser. During the live phase the
client receives only defender-observable data (alerts, evidence they surfaced, effects of their
own actions). Compromise flags, undiscovered evidence and adversary moves are only sent after
the investigation is submitted.

### Concurrency
Each session row has a `revision`. State writes use `updateMany where revision = n` inside a
transaction; a lost race returns 409 and nothing is written (integration-tested).

## Rendering
`cacheComponents` is disabled: the app area is per-user and session-bound, so pages render
dynamically. The arena/forensics clients POST to route handlers and then `router.refresh()`;
the server is the single source of truth (state survives reloads).
