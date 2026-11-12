# أَمَد | AMAD — Adaptive Cyber Readiness & Intelligence Platform

> نحو جاهزية تسبق التهديد.

AMAD is the new name of the RASD project. It is a cyber-readiness platform built
around one continuous five-stage learning loop:

1. **Adaptive AI Adversary** — plans moves from an approved ATT&CK-mapped attack graph, adapts to the learner's profile and to defender actions; every move is validated by the **Guardian**.
2. **Live Defensive Simulation Under Pressure** — safe defensive console + Cyber Twin; every action costs simulated time while the adversary keeps moving.
3. **Digital Forensics Investigation** — evidence explorer, incident reconstruction, server-side scoring against what actually happened.
4. **Behavioral Readiness Measurement** — Speed / Accuracy / Independence / Completeness with stored formulas and inputs.
5. **Incident-to-Scenario Conversion** — today: results drive the next recommended scenario and the next adversary's calibration. Threat-intel → new scenario generation is the next phase.

See `AMAD_IMPLEMENTATION_STATUS.md` for exactly what works and what does not.

## Quick start (local)

Requirements: Node.js 22+, PostgreSQL 14+.

```bash
cd amad
cp .env.example .env            # set DATABASE_URL
npm install                     # also runs `prisma generate`
npm run db:migrate              # apply migrations
npm run db:seed                 # competencies + 3 authored scenarios
npm run dev                     # http://localhost:3000
```

Optional demo organization (clearly labelled in the UI, starts with no history):

```bash
AMAD_DEMO_MODE=true AMAD_DEMO_PASSWORD='choose-a-password-10+' npm run db:seed
```

Production: `npm run build && npm run start`.

## Scripts

| Script | Purpose |
|---|---|
| `dev` / `build` / `start` | Next.js dev server / production build / production server |
| `lint`, `typecheck` | ESLint, TypeScript |
| `db:migrate`, `db:migrate:dev`, `db:seed`, `db:generate` | Prisma migrations, seed, client generation |
| `test` | Unit + integration tests (integration uses `TEST_DATABASE_URL`, default local `amad_test`) |
| `test:e2e` | Browser E2E against a running server (`BASE_URL`, default `http://localhost:3100`) |

## Documentation

`ARCHITECTURE.md` · `DATABASE_SCHEMA.md` · `SECURITY.md` · `DEPLOYMENT.md` · `TESTING.md` · `ROADMAP.md` ·
`docs/READINESS_METHODOLOGY.md` · `docs/DESIGN_SYSTEM.md` · `AMAD_IMPLEMENTATION_STATUS.md`

## Brand

Colors `#06152B`, `#C7F230`, `#FFFFFF`, `#AEB7C2`. The official AMAD logo asset is **not in the
repository**; the UI uses a typographic wordmark placeholder (`src/components/ui.tsx#Wordmark`)
rather than an approximation of the logo.
