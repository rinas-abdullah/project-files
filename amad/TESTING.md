# AMAD Testing

| Suite | Command | Needs | Files |
|---|---|---|---|
| Unit | `npm run test:unit` | nothing | `tests/unit/engine.test.ts`, `tests/unit/scoring.test.ts` |
| Integration | `npm run test:integration` | PostgreSQL test DB (`TEST_DATABASE_URL`, default `postgresql://amad:amad_dev_pw@127.0.0.1:5432/amad_test`) — migrations are applied automatically; tables are truncated per test (refuses any DB whose URL lacks `amad_test`) | `tests/integration/auth.test.ts`, `tests/integration/learning-loop.test.ts` |
| All (unit + integration) | `npm test` | as above | — |
| E2E | `npm run test:e2e` | a running server (`BASE_URL`, default `http://localhost:3100`) on a seeded DB; Playwright + Chromium | `tests/e2e/learning-loop.e2e.mjs` |

## Coverage map (spec §23)
| Required area | Tests |
|---|---|
| Authentication | register/hash storage, weak password, duplicate email, login, wrong password, unknown user, logout, revoke other sessions, expired/unknown tokens, rate limiting (per account and per IP) |
| Authorization | auditor cannot start simulations; trainee cannot view team; team viewers read-only on others' sessions |
| Tenant isolation | other org cannot read/act on a session (404); team overview scoped to org; org-private scenarios hidden from other orgs |
| Scenario creation | catalog integrity (all references resolve, single entry node); org-private scenario creation + visibility |
| Guardian validation | rejects off-graph nodes, replays, failed preconditions, non-live phase, effects outside the twin |
| Simulation transitions | determinism (same seed + commands ⇒ identical state/events), entry move, breach when undefended, time cost, false containment, successful containment, two adaptive branches (VPN re-entry after isolation, cloud exfil after C2 block), learner-skill tempo, pre-emptive block credit, unsafe input rejection |
| Evidence persistence | live evidence persisted on discovery; forensics evidence persisted on phase change |
| Investigation scoring | F1/LCS helpers, perfect score, citation of unavailable evidence rejected, decoy evidence lowers precision |
| Readiness calculation | full-marks case, penalties, formula/inputs stored, EMA update |
| Training recommendations | new learner starts at difficulty 1, weakest competency targeted with explanation, repetition penalty, persisted recommendation after completion |
| Concurrency | concurrent commands serialised by optimistic locking, no lost updates |
| E2E loop | unauthenticated redirect → register → empty dashboard → logout/failed login/login → start simulation → unsafe input rejected → investigate → contain → forensics (persisted across reload) → submit → readiness report → dashboard reflects persisted score + recommendation + 2 notifications → mark read → start recommended training → phone-width check → no unexpected HTTP failures/console errors |

The integration and E2E suites use a test-only "oracle"/scripted defender to reach containment
deterministically; these helpers read ground truth and never run in the application.
