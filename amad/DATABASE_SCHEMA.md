# AMAD Database Schema

PostgreSQL via Prisma 7 (`prisma/schema.prisma`, migration `prisma/migrations/*_init`).
All foreign keys are enforced; child rows cascade on delete of their session/user/org.

| Model | Purpose | Key constraints / indexes |
|---|---|---|
| `Organization` | Tenant. `kind` INDIVIDUAL / ENTERPRISE / UNIVERSITY; `isDemo` flags the seeded demo org | `slug` unique |
| `User` | Account; bcrypt `passwordHash`; `isSuperAdmin` (not yet used by any UI) | `email` unique |
| `Membership` | User ↔ Organization with a `Role` (ORG_ADMIN, SECURITY_MANAGER, INSTRUCTOR, TRAINEE, AUDITOR) | unique (userId, orgId); index (orgId, role) |
| `AuthSession` | Server-side session; stores **SHA-256 of the token only**; `revokedAt`, `expiresAt` | `tokenHash` unique |
| `Competency` | 8 defensive competencies (key, Arabic/English names) | `key` unique |
| `Scenario` | Versioned scenario; `definition` JSON = full `ScenarioDefinition`; `status`, `source`; `orgId` null = global | unique (key, version); index status |
| `ScenarioCompetency` | Weighted competency mapping per scenario | PK (scenarioId, competencyId) |
| `SimulationSession` | One training run: seed, phase, outcome, canonical engine `state` JSON, `revision` for optimistic locking | index (orgId, userId, startedAt), (userId, phase) |
| `SimulationEvent` | Ordered event log (defender / adversary / guardian / system) | unique (sessionId, seq) |
| `DefenderAction` | Every console command with output, validity, effective/disruptive/productive flags, competency, decision latency | unique (sessionId, seq) |
| `AdversaryAction` | Every planner proposal with rationale, candidate scores and guardian verdict | unique (sessionId, seq) |
| `EvidenceRecord` | Evidence available to forensics; `acquiredVia` LIVE or IMAGE | unique (sessionId, key) |
| `InvestigationReport` | Submitted findings + score breakdown | `sessionId` unique (one submission) |
| `ReadinessScore` | Overall + 4 dimensions, `evidence` JSON with formulas/inputs/competency scores, `methodologyVersion` | `sessionId` unique; index (orgId, userId, createdAt) |
| `BehavioralProfile` | Per user/org/competency level (EMA) and sample count | unique (userId, orgId, competencyKey) |
| `TrainingRecommendation` | Next scenario, score, target difficulty, focus competencies, rationale JSON, status OPEN/STARTED/DISMISSED, `sourceSessionId` | index (userId, orgId, status, createdAt) |
| `Notification` | In-app notifications | index (userId, orgId, readAt, createdAt) |
| `AuditLog` | Security/audit events; also the store for failed-login rate limiting | index (orgId, createdAt), (action, createdAt) |

## Notes
- **Tenant isolation**: every tenant-owned row carries `orgId`; every service query filters by the actor's `orgId`.
- **Canonical state** lives in `SimulationSession.state`; `DefenderAction` + seed are sufficient to rebuild it.
- **Not yet modelled** (later phases): ThreatIntelligence, ThreatSources, TrainingPaths, TeamAssignments, Permissions table (permissions are a code-level matrix in `server/auth/rbac.ts`), separate CyberTwinAsset rows (twin state is inside the session state JSON), DemoRequest/Contact.
